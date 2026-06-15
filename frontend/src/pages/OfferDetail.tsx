import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Coins, ArrowLeft, CheckCircle2, Play, ExternalLink, ArrowRight, Zap, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAnalytics } from '../hooks/useAnalytics';

export const OfferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const { track } = useAnalytics();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      const res = await api.get(`/offers/${id}`);
      const offerData = res.data;
      
      // Auto-populate the QR Code url if the offer is already IN_PROGRESS and it's a mobile app/game on desktop
      if (offerData?.userOffer?.status === 'IN_PROGRESS' && offerData?.offer) {
        const isAppOrGame = offerData.offer.off_type?.toLowerCase() === 'game' || 
                            offerData.offer.off_type?.toLowerCase() === 'app' ||
                            offerData.offer.os?.toLowerCase().includes('android') ||
                            offerData.offer.os?.toLowerCase().includes('ios');
        const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isAppOrGame && isDesktop) {
          // Re-generate tracking link to display in the QR code
          let trackingURL = offerData.offer.trk_url;
          const userId = offerData.userOffer.user_id;
          if (trackingURL) {
            const replacements: Record<string, string> = {
              "{your_user_id}": String(userId),
              "{USER_ID}":      String(userId),
              "[USER_ID]":      String(userId),
              "{subid}":        String(userId),
            };
            for (const [k, v] of Object.entries(replacements)) {
              trackingURL = trackingURL.replaceAll(k, v);
            }
            setQrUrl(trackingURL);
          }
        }
      }
      return offerData;
    }
  });

  React.useEffect(() => {
    if (data?.offer) {
      track('PAGE_VIEW', { page: 'OfferDetail', offer_id: data.offer.offer_id, name: data.offer.name });
    }
  }, [data?.offer, track]);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      track('START_OFFER_CLICK', { offer_id: data?.offer?.offer_id, name: data?.offer?.name });
      const res = await api.post(`/offers/${id}/start`);
      if (res.data.redirectUrl) {
        // Navigate to the Mock Affiliate Network (tracks → checkout → postback → wallet)
        window.location.href = res.data.redirectUrl;
      }
    } catch (err: any) {
      if (err.response?.data?.status) {
        alert(`Offer is already ${err.response.data.status}`);
      } else {
        alert('Failed to start offer');
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0514] flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Loading offer...</div>
      </div>
    );
  }

  if (!data?.offer) {
    return (
      <div className="min-h-screen bg-[#0A0514] flex items-center justify-center">
        <div className="text-rose-400 font-bold">Offer not found.</div>
      </div>
    );
  }

  const { offer, userOffer } = data;
  const status = userOffer?.status;

  let parsedGoals: any[] = [];
  try {
    parsedGoals = typeof offer.goals === 'string' ? JSON.parse(offer.goals) : (offer.goals || []);
  } catch {}

  return (
    <div className="min-h-screen bg-[#0A0514] text-white">
      <div className="fixed top-0 left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/offers')} className="mb-6 flex items-center text-slate-400 hover:text-emerald-400 transition-colors font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Offers
        </button>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:p-10 border-b border-white/10 flex flex-col sm:flex-row gap-8 items-start">
            {offer.ic_url ? (
              <img src={offer.ic_url} alt={offer.name} className="w-28 h-28 rounded-3xl object-cover ring-1 ring-white/10" />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                <Coins className="text-slate-600 w-14 h-14" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {offer.off_type && (
                  <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30 uppercase tracking-wider">
                    {offer.off_type}
                  </div>
                )}
                <div className="flex items-center bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <Coins className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  <span className="text-emerald-400 font-black text-sm">
                    {offer.inapp_pyt_amt ? `+${offer.inapp_pyt_amt} Coins` : `+$${offer.payout_usd}`}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-black text-white tracking-tight mb-4">{offer.name}</h1>
              <p className="text-slate-400 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: offer.desc_raw || '' }} />
            </div>
          </div>

          {/* Action Area */}
          <div className="p-8 sm:p-10 bg-white/[0.03]">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Offer Status</h2>
                {status === 'COMPLETED' ? (
                  <div className="flex items-center text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Completed — Coins Credited!
                  </div>
                ) : status === 'IN_PROGRESS' ? (
                  <div className="flex items-center text-yellow-400 font-bold bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                    <Play className="w-5 h-5 mr-2" /> In Progress
                  </div>
                ) : (
                  <div className="text-slate-500 font-medium">Not started yet — click to begin!</div>
                )}
              </div>

              {status !== 'COMPLETED' && !qrUrl && (
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-[#0A0514] rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all font-black text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isStarting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-[#0A0514] border-t-transparent rounded-full"></div>
                  ) : status === 'IN_PROGRESS' ? (
                    <><ExternalLink className="w-5 h-5" /> Continue Offer</>
                  ) : (
                    <><Zap className="w-5 h-5 fill-[#0A0514]" /> Start Offer<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              )}
            </div>

            {qrUrl && status !== 'COMPLETED' && (
              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center">
                <QrCode className="w-8 h-8 text-emerald-400 mb-2" />
                <h3 className="text-lg font-bold text-white mb-1">
                  Scan QR Code to Play {offer.off_type?.toLowerCase() === 'game' ? 'Game' : 'App'}
                </h3>
                <p className="text-slate-400 text-sm max-w-sm mb-6">
                  This offer requires a{offer.os && offer.os.toLowerCase() !== 'all' ? ` ${offer.os}` : ' mobile'} device. Scan this code with your phone's camera to install and start.
                </p>
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <QRCodeSVG value={qrUrl} size={180} level="H" />
                </div>
                <a 
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 text-sm text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 underline"
                >
                  Or open tracking link directly <ExternalLink size={14} />
                </a>
              </div>
            )}

            {parsedGoals.length > 0 && (
              <div className="mt-10">
                <h3 className="text-base font-bold text-white mb-4 uppercase tracking-widest text-xs text-slate-400">Steps to Complete</h3>
                <ul className="space-y-3">
                  {parsedGoals.map((goal: any, idx: number) => {
                    const isCompleted = status === 'COMPLETED';
                    const hasReward = goal.inapp_pyt?.amt || goal.pyt?.amt;
                    return (
                      <li key={idx} className={`p-5 rounded-2xl border flex items-start gap-4 transition-colors ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-emerald-500 text-[#0A0514] border-emerald-400 shadow-lg shadow-emerald-500/30' : 'bg-emerald-500/20 text-emerald-400 font-black text-sm border-emerald-500/30'}`}>
                          {isCompleted ? <CheckCircle2 size={18} strokeWidth={3} /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm">{goal.ttl || goal.title || 'Complete Task'}</h4>
                          {(goal.instr || goal.instructions) && (
                            <p className="text-slate-400 text-sm mt-1 font-medium leading-relaxed">{goal.instr || goal.instructions}</p>
                          )}
                        </div>
                        {hasReward && (
                          <div className={`shrink-0 flex items-center px-3 py-1.5 rounded-xl border ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                            <Coins size={14} className="mr-1.5" />
                            <span className="text-sm font-black tracking-tight">
                              +{goal.inapp_pyt?.amt ? goal.inapp_pyt.amt : `$${goal.pyt?.amt}`}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
