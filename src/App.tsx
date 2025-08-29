import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminBooks from "./pages/AdminBooks";
import WalletTopUp from "./pages/WalletTopUp";
import Statistics from "./pages/Statistics";
import Coupons from "./pages/Coupons";
import UsersLoans from "./pages/UsersLoans";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";

import { useAuth } from "./contexts/AuthContext";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/books"
        element={
          <PrivateRoute>
            <AdminBooks />
          </PrivateRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <PrivateRoute>
            <WalletTopUp />
          </PrivateRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <PrivateRoute>
            <Statistics />
          </PrivateRoute>
        }
      />
      <Route
        path="/coupons"
        element={
          <PrivateRoute>
            <Coupons />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UsersLoans />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
