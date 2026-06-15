import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Search, Coins, ChevronRight, RefreshCw, Smartphone, Globe, Zap, Monitor, ChevronDown } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';


export const Offers = () => {
  const [search, setSearch] = useState('');
  const [activeOs, setActiveOs] = useState<'desktop' | 'android' | 'ios' | null>(null);
  const [category, setCategory] = useState('all');
  const [recommendation, setRecommendation] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const { track } = useAnalytics();

  React.useEffect(() => {
    track('PAGE_VIEW', { page: 'Offers' });
  }, [track]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['offers', search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const res = await api.get('/offers', { params });
      return res.data.offers;
    }
  });

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await api.post('/offers/sync');
      await refetch();
    } catch (err) {
      console.error('Failed to sync offers', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleOs = (os: 'desktop' | 'android' | 'ios') => {
    const newOs = activeOs === os ? null : os;
    setActiveOs(newOs);
    track('FILTER_OS', { os: newOs });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    track('FILTER_CATEGORY', { category: val });
  };

  const handleRecommendationChange = (val: string) => {
    setRecommendation(val);
    track('FILTER_RECOMMENDATION', { recommendation: val });
  };

  return (
    <div className="min-h-screen bg-[#0A0514] text-white">
      {/* Background Glows */}
      <div className="fixed top-0 left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Navigation Bar from Mockup */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8 bg-[#110C1D] border border-white/5 p-4 rounded-2xl shadow-lg">
          
          {/* OS Filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => toggleOs('desktop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${activeOs === 'desktop' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Monitor size={16} /> Desktop
            </button>
            <button
              onClick={() => toggleOs('android')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${activeOs === 'android' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Smartphone size={16} /> Android
            </button>
            <button
              onClick={() => toggleOs('ios')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${activeOs === 'ios' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-transparent border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Smartphone size={16} /> iOS
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 border border-white/5 rounded-xl bg-[#1A1527] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20 sm:text-sm font-medium transition-all"
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Categories & Sync */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none flex items-center gap-2 px-4 py-2 pr-8 rounded-xl text-sm font-semibold bg-transparent border border-white/5 text-slate-300 hover:bg-white/5 transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="all" className="bg-[#110C1D]">Categories</option>
                <option value="game" className="bg-[#110C1D]">Game Rewards</option>
                <option value="signup" className="bg-[#110C1D]">Signup Rewards</option>
                <option value="website" className="bg-[#110C1D]">Website Rewards</option>
              </select>
              <ChevronDown size={14} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={recommendation}
                onChange={(e) => handleRecommendationChange(e.target.value)}
                className="appearance-none flex items-center gap-2 px-4 py-2 pr-8 rounded-xl text-sm font-semibold bg-transparent border border-white/5 text-slate-300 hover:bg-white/5 transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="all" className="bg-[#110C1D]">Recommended</option>
                <option value="my_offers" className="bg-[#110C1D]">My Offers</option>
                <option value="huge_offers" className="bg-[#110C1D]">Huge Offers</option>
              </select>
              <ChevronDown size={14} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              title="Sync Offers"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">Available Offers</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white/5 rounded-3xl border border-white/10 p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-white/10 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !data?.length ? (
          <div className="text-center py-24 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/10">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Coins className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No offers found</h3>
            <p className="mt-2 text-slate-400 font-medium">Try syncing or adjust your search.</p>
            <button onClick={handleSync} className="mt-6 px-6 py-3 bg-emerald-500 text-[#0A0514] rounded-2xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 font-black transition-all">
              Sync Offers Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data
              .filter((offer: any) => {
                if (activeOs === 'android') {
                  return offer.os?.toLowerCase().includes('android');
                }
                if (activeOs === 'ios') {
                  return offer.os?.toLowerCase().includes('ios');
                }
                if (activeOs === 'desktop') {
                  return offer.os?.toLowerCase().includes('web') || offer.os?.toLowerCase().includes('desktop') || offer.os?.toLowerCase() === 'all' || !offer.os;
                }
                
                // Category Filtering
                if (category === 'game') {
                  if (offer.off_type?.toLowerCase() !== 'game' && !offer.name?.toLowerCase().includes('game')) return false;
                }
                if (category === 'signup') {
                  const text = (offer.name + ' ' + (offer.desc_raw || '')).toLowerCase();
                  if (!text.includes('sign') && !text.includes('register') && !text.includes('account')) return false;
                }
                if (category === 'website') {
                  if (!offer.os?.toLowerCase().includes('web') && offer.off_type?.toLowerCase() !== 'cpa') return false;
                }

                return true;
              })
              .filter((offer: any, index: number, self: any[]) => {
                // Deduplicate offers with the exact same name and OS type
                return index === self.findIndex((t) => t.name === offer.name && t.os === offer.os);
              })
              .sort((a: any, b: any) => {
                // Sorting for Recommendations
                if (recommendation === 'huge_offers') {
                  return (b.payout_usd || 0) - (a.payout_usd || 0); // Highest payout first
                }
                if (recommendation === 'my_offers') {
                  // "My offers" could randomly shuffle or sort by lowest to give a mix of achievable tasks
                  // We'll use a string comparison on the name for a deterministic pseudo-random sort
                  return a.name.localeCompare(b.name);
                }
                return 0; // Default sort order from DB
              })
              .map((offer: any) => (
              <Link
                key={offer.id}
                to={`/offers/${offer.id}`}
                onClick={() => track('CLICK_OFFER_CARD', { offer_id: offer.offer_id, name: offer.name })}
                className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-white/20 overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 group flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    {offer.ic_url ? (
                      <img src={offer.ic_url} alt={offer.name} className="w-16 h-16 rounded-2xl object-cover bg-white/10 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Coins className="text-slate-600 w-8 h-8" />
                      </div>
                    )}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                        <span className="text-emerald-400 font-black text-sm tracking-tight">
                          {offer.inapp_pyt_amt ? `+${offer.inapp_pyt_amt}` : `+$${offer.payout_usd}`}
                        </span>
                      </div>
                      {offer.os && (
                        <div className="flex items-center text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {offer.os?.toLowerCase().includes('android') || offer.os?.toLowerCase().includes('ios') ? (
                            <Smartphone size={10} className="mr-1" />
                          ) : (
                            <Globe size={10} className="mr-1" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{offer.os}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {offer.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: offer.desc_raw || '' }} />
                </div>
                <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex items-center justify-between group-hover:bg-emerald-500/5 transition-colors">
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 uppercase tracking-widest transition-colors">
                    View Details
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
