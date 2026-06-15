import { Router, Request, Response } from 'express';
import md5 from 'md5';
import { prisma } from '../lib/prisma';

const router = Router();

// Middleware for PubScale IP Whitelist
const ipWhitelist = (req: Request, res: Response, next: any) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  // Based on instructions, the IP is 34.100.236.68
  // But we might be in sandbox/local, so we can make this optional or env based
  if (process.env.NODE_ENV === 'production' && typeof ip === 'string') {
     if (!ip.includes('34.100.236.68')) {
        return res.status(403).json({ error: 'IP not whitelisted' });
     }
  }
  next();
};

router.get('/', ipWhitelist, async (req: Request, res: Response) => {
  try {
    const { user_id, value, token, signature, offer_id, goal_id } = req.query;

    if (!user_id || !value || !token || !signature) {
      return res.status(400).send('missing parameters');
    }

    const userIdNum = parseInt(user_id as string);
    const valueNum = parseFloat(value as string);
    const secretKey = process.env.PUBSCALE_SECRET_KEY || '';

    // Signature Formula: MD5(secret_key.user_id.int(value).token)
    // Value must be truncated to integer
    const template = `${secretKey}.${userIdNum}.${Math.trunc(valueNum)}.${token}`;
    const hash = md5(template);

    if (signature !== hash) {
      return res.status(400).send('invalid signature');
    }

    // Idempotency check
    const existingLog = await prisma.callbackLog.findUnique({
      where: { pubscaleToken: token as string }
    });

    if (existingLog) {
      // Return 200 so PubScale doesn't retry, but don't credit again
      return res.status(200).send('already processed');
    }

    // Begin transaction for crediting user wallet
    await prisma.$transaction(async (tx) => {
      // 1. Log the callback
      await tx.callbackLog.create({
        data: {
          pubscaleToken: token as string,
          userId: userIdNum,
          value: valueNum,
          status: 'SUCCESS'
        }
      });

      // 2. Update Wallet
      await tx.wallet.update({
        where: { userId: userIdNum },
        data: {
          balance: {
            increment: Math.trunc(valueNum)
          }
        }
      });

      // 3. Create Transaction record
      const wallet = await tx.wallet.findUnique({ where: { userId: userIdNum } });
      if (wallet) {
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: Math.trunc(valueNum),
            type: 'CREDIT',
            reference: offer_id ? `offer_${offer_id}_completion` : `s2s_callback`,
          }
        });
      }

      // 4. Optionally mark UserOffer as completed if we have offer_id
      if (offer_id) {
        const offer = await tx.offer.findUnique({ where: { offer_id: offer_id as string } });
        if (offer) {
          const userOffer = await tx.userOffer.findUnique({
            where: { userId_offerId: { userId: userIdNum, offerId: offer.id } }
          });
          if (userOffer && userOffer.status !== 'COMPLETED') {
            await tx.userOffer.update({
              where: { id: userOffer.id },
              data: { status: 'COMPLETED' }
            });
          }
        }
      }
    });

    return res.status(200).send('ok');
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).send('internal server error');
  }
});

export default router;
