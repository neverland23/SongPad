import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderPage from './pages/OrderPage';
import DashboardLayout from './components/layout/DashboardLayout';
import NumbersPage from './pages/dashboard/NumbersPage';
import VoicePage from './pages/dashboard/VoicePage';
import SmsPage from './pages/dashboard/SmsPage';

function RequireAuth({ children }) {
  const isAuthenticated = useAppSelector((state) => Boolean(state.auth.token));
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard/*"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<NumbersPage />} />
        <Route path="numbers" element={<NumbersPage />} />
        <Route path="voice" element={<VoicePage />} />
        <Route path="sms" element={<SmsPage />} />
      </Route>

      <Route
        path="/order"
        element={
          <RequireAuth>
            <OrderPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
