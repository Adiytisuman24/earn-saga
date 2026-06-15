import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

export default router;
