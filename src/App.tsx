// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PlexAuth from './components/auth/PlexAuth';
import UserProfile from './components/auth/UserProfile';
import LandingPage from './components/LandingPage';
import CreateSession from './components/session/CreateSession';
import SessionInterface from './components/session/SessionInterface';
import { Toaster } from '@/components/ui/toaster';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<PlexAuth />} />
          <Route path="/auth/callback" element={<PlexAuth />} />

          {/* Protected routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/create-session" element={
            <ProtectedRoute>
              <CreateSession />
            </ProtectedRoute>
          } />
          <Route path="/session/:sessionId" element={
            <ProtectedRoute>
              <SessionInterface />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
