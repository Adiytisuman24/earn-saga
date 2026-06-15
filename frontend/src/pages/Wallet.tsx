import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Coins, ArrowUpRight, ArrowDownRight, Clock, Zap, CreditCard, CheckCircle2 } from 'lucide-react';

export const Wallet = () => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('PayPal');
  const [payoutStatus, setPayoutStatus] = useState<{loading: boolean, error: string | null, success: boolean}>({
    loading: false, error: null, success: false
  });
  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    }
  });

  const handlePayout = async () => {
    try {
      setPayoutStatus({ loading: true, error: null, success: false });
      await api.post('/wallet/payout', { amount: 1000, method: payoutMethod });
      setPayoutStatus({ loading: false, error: null, success: true });
      refetch();
      setTimeout(() => {
        setIsRedeeming(false);
        setPayoutStatus({ loading: false, error: null, success: false });
      }, 3000);
    } catch (err: any) {
      setPayoutStatus({ 
        loading: false, 
        error: err.response?.data?.error || 'Failed to request payout', 
        success: false 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0514] text-white">
      <div className="fixed top-0 left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="mb-8 bg-gradient-to-br from-emerald-500/20 to-purple-600/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Your Wallet</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-xs">Coins are credited automatically when you complete offers</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-w-[200px] text-center">
            <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs mb-3">Current Balance</p>
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-8 h-8 text-yellow-400" />
              <span className="text-5xl font-black tracking-tight">{isLoading ? '...' : data?.balance ?? 0}</span>
            </div>
            <p className="text-slate-500 text-xs font-semibold mt-2 uppercase tracking-widest mb-4">Coins</p>
            <button
              onClick={() => setIsRedeeming(!isRedeeming)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0A0514] font-black py-2 rounded-xl transition-all"
            >
              Redeem Coins
            </button>
          </div>
        </div>

        {/* Redeem Section */}
        {isRedeeming && (
          <div className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Request Payout</h2>
            </div>
            
            {payoutStatus.success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="text-emerald-400 font-bold text-lg">Payout Requested!</h3>
                <p className="text-slate-400 mt-1">Your reward is being processed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-400 font-semibold mb-2">Select Method</label>
                  <div className="flex gap-3">
                    {['PayPal', 'Amazon Gift Card'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPayoutMethod(method)}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold border transition-all ${payoutMethod === method ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-2">Amount</label>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-white font-bold text-lg">1000 Coins</span>
                    <span className="text-emerald-400 font-black">→ $1.00</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  {payoutStatus.error && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-center font-semibold">
                      {payoutStatus.error}
                    </div>
                  )}
                  <button
                    onClick={handlePayout}
                    disabled={payoutStatus.loading || (data?.balance ?? 0) < 1000}
                    className="w-full bg-emerald-500 text-[#0A0514] font-black py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {payoutStatus.loading ? 'Processing...' : (data?.balance ?? 0) < 1000 ? 'Insufficient Coins (Need 1000)' : 'Confirm Payout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wide">Transaction History</h2>
            <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
              Last 50
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading transactions...</div>
          ) : !data?.transactions?.length ? (
            <div className="p-12 text-center">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Clock className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-white font-bold text-lg">No transactions yet</p>
              <p className="text-slate-500 mt-1 font-medium">Complete offers to earn coins and see history here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {data.transactions.map((tx: any) => (
                <li key={tx.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${tx.type === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {tx.type === 'CREDIT' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-wide">
                          {tx.type === 'CREDIT' ? 'Offer Completion' : 'Withdrawal'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5">
                          <span className="bg-white/5 text-slate-400 px-2 py-0.5 rounded font-mono">{tx.reference}</span>
                          <span>•</span>
                          <span>{new Date(tx.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </p>
                      </div>
                    </div>
                    <div className={`text-xl font-black tracking-tight ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
