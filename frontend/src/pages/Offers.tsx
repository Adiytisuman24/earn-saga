import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Search, Coins, ChevronRight, RefreshCw, Smartphone, Globe, Zap } from 'lucide-react';

export const Offers = () => {
  const [search, setSearch] = useState('');
  const [filterOS, setFilterOS] = useState<'all' | 'app' | 'web'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0A0514] text-white">
      {/* Background Glows */}
      <div className="fixed top-0 left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Zap className="w-7 h-7 text-emerald-400 fill-emerald-400" />
              Available Offers
            </h1>
            <p className="mt-1 text-slate-400 font-medium">Complete tasks to earn real rewards</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 sm:text-sm font-medium transition-all"
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
              <button
                onClick={() => setFilterOS('all')}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filterOS === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterOS('app')}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filterOS === 'app' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              >
                App
              </button>
              <button
                onClick={() => setFilterOS('web')}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filterOS === 'web' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}
              >
                Web
              </button>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-emerald-500/30 shadow-sm text-sm font-bold rounded-2xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 focus:outline-none transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Offers'}
            </button>
          </div>
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
                if (filterOS === 'app') {
                  return offer.os?.toLowerCase().includes('android') || offer.os?.toLowerCase().includes('ios');
                }
                if (filterOS === 'web') {
                  return offer.os?.toLowerCase().includes('web') || offer.os?.toLowerCase() === 'all' || !offer.os;
                }
                return true;
              })
              .map((offer: any) => (
              <Link
                key={offer.id}
                to={`/offers/${offer.id}`}
                className="group bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition-all duration-300 flex flex-col overflow-hidden relative"
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
