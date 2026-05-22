import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';

const Home = lazy(() => import('./components/Home'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LetterEditor = lazy(() => import('./components/LetterEditor'));
const Auth = lazy(() => import('./components/Auth'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex-1 flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="h-screen flex flex-col bg-immersive-bg text-neutral-400 font-sans overflow-hidden">
          <Navbar />
          <main className="flex-1 flex overflow-hidden">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">লোড হচ্ছে...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/:username" element={<LetterEditor />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

