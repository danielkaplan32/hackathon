
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';
import MainApp from './components/MainApp';
import TradeModal from './components/TradeModal';
const Trade = React.lazy(() => import('./components/Trade'));
const Requests = React.lazy(() => import('./components/Requests'));
const Counter = React.lazy(() => import('./components/Counter'));
const Messages = React.lazy(() => import('./components/Messages'));
const MessagesList = React.lazy(() => import('./components/MessagesList'));
import { supabase } from "./supabaseClient";

function App() {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  function PrivateRoute({ children }) {
    if (!session || !session.user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
      <Router>
        <Routes>
          <Route path="/" element={<AuthScreenWrapper />} />
          <Route path="/login" element={<AuthScreenWrapper />} />
          <Route path="/profile" element={<PrivateRoute><ProfileScreenWrapper /></PrivateRoute>} />
          <Route path="/app" element={<PrivateRoute><MainApp openTradeModal={() => setShowTradeModal(true)} /></PrivateRoute>} />
          <Route path="/items" element={<PrivateRoute><MainApp openTradeModal={() => setShowTradeModal(true)} /></PrivateRoute>} />
          <Route path="/feed" element={<PrivateRoute><MainApp openTradeModal={() => setShowTradeModal(true)} /></PrivateRoute>} />
          <Route path="/trade" element={<PrivateRoute><Suspense fallback={<div>Loading...</div>}><Trade /></Suspense></PrivateRoute>} />
          <Route path="/counter/:tradeId" element={<PrivateRoute><Suspense fallback={<div>Loading...</div>}><Counter /></Suspense></PrivateRoute>} />
          <Route path="/requests" element={<PrivateRoute><MainApp openTradeModal={() => setShowTradeModal(true)} panelOverride="requests" /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Suspense fallback={<div>Loading...</div>}><MessagesList /></Suspense></PrivateRoute>} />
          <Route path="/messages/:userId" element={<PrivateRoute><Suspense fallback={<div>Loading...</div>}><Messages /></Suspense></PrivateRoute>} />
        </Routes>
        {showTradeModal && <TradeModal onClose={() => setShowTradeModal(false)} />}
      </Router>
    </>
  );
}


// Wrappers to allow navigation after auth/profile
function AuthScreenWrapper() {
  const navigate = useNavigate();
  return <AuthScreen onAuthSuccess={() => navigate('/profile')} />;
}
function ProfileScreenWrapper() {
  const navigate = useNavigate();
  return <ProfileScreen onProfileComplete={() => navigate('/feed')} />;
}

export default App;
