import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Offers } from './pages/Offers';
import { OfferDetail } from './pages/OfferDetail';
import { Wallet } from './pages/Wallet';

const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '501362372103-aede7r0in44128i3i3j2cergg2vcbk8b.apps.googleusercontent.com';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0514] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[#0A0514] flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
                  <Route path="/offers/:id" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
                  <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                  <Route path="/" element={<Navigate to="/offers" replace />} />
                  <Route path="*" element={<Navigate to="/offers" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
