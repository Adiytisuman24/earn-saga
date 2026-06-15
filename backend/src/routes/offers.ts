import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { syncOffersFromPubScale } from '../services/pubscale.service';

const router = Router();

// Endpoint to manually trigger a sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncOffersFromPubScale();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync offers' });
  }
});

// List offers with optional search
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        name: {
          contains: search,
          mode: 'insensitive', // PostgreSQL supports this via Prisma
        }
      };
    }

    const offers = await prisma.offer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ offers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Get single offer details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const offerId = parseInt(req.params.id as string);
    const userId = req.userId;

    if (isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check if user has started this offer
    const userOffer = await prisma.userOffer.findUnique({
      where: {
        userId_offerId: {
          userId: userId!,
          offerId: offerId,
        }
      }
    });

    res.json({ offer, userOffer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offer details' });
  }
});

// Start an offer
router.post('/:id/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const offerId = parseInt(req.params.id as string);
    const userId = req.userId!;

    if (isNaN(offerId)) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Check if already started
    const existing = await prisma.userOffer.findUnique({
      where: {
        userId_offerId: { userId, offerId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Offer already started', status: existing.status });
    }

    // Create record
    await prisma.userOffer.create({
      data: {
        userId,
        offerId,
        status: 'IN_PROGRESS'
      }
    });

    // Replace tracking URL placeholder
    // PubScale trk_url typically has {your_user_id}
    const trkUrl = offer.trk_url.replace('{your_user_id}', userId.toString());

    res.json({ success: true, redirectUrl: trkUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start offer' });
  }
});

export default router;
