import axios from 'axios';
import { prisma } from '../lib/prisma';

const PUBSCALE_API_URL = 'https://api-dev.sikkaapp.in/v1/offer/api';
// From Sandbox Credentials
const APP_ID = '66555042';
const PUB_KEY = 'C423E0560E41A9EF42876CC684CB1F74';

export const syncOffersFromPubScale = async () => {
  try {
    const response = await axios.post(PUBSCALE_API_URL, {}, {
      headers: {
        'App-Id': APP_ID,
        'Pub-Key': PUB_KEY,
      }
    });

    const offers = response.data.offers || response.data.data?.offers || response.data;
    
    const offerList = Array.isArray(offers) ? offers : (offers.offers ? offers.offers : []);

    for (const offer of offerList) {
      if (!offer.id) continue;
      
      await prisma.offer.upsert({
        where: { offer_id: offer.id.toString() },
        update: {
          name: offer.name,
          ic_url: offer.ic_url,
          payout_usd: offer.payout_usd || offer.pyt?.amt,
          inapp_pyt_amt: offer.inapp_pyt?.amt,
          desc_raw: offer.desc?.raw,
          trk_url: offer.trk_url,
          off_type: offer.off_type,
          os: offer.os,
          geo_tgt_include: offer.geo_tgt?.include || [],
          geo_tgt_exclude: offer.geo_tgt?.exclude || [],
          pubscale_upd_ts: offer.upd_ts,
          goals: offer.gls || [],
        },
        create: {
          offer_id: offer.id.toString(),
          name: offer.name,
          ic_url: offer.ic_url,
          payout_usd: offer.payout_usd || offer.pyt?.amt,
          inapp_pyt_amt: offer.inapp_pyt?.amt,
          desc_raw: offer.desc?.raw,
          trk_url: offer.trk_url,
          off_type: offer.off_type,
          os: offer.os,
          geo_tgt_include: offer.geo_tgt?.include || [],
          geo_tgt_exclude: offer.geo_tgt?.exclude || [],
          pubscale_upd_ts: offer.upd_ts,
          goals: offer.gls || [],
        }
      });
    }

    return { success: true, count: offerList.length };
  } catch (error) {
    console.error('Error syncing offers from PubScale:', error);
    throw new Error('Failed to sync offers');
  }
};
