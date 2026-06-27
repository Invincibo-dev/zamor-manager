import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import { getStoredUser } from "./utils/auth";

// Chargement différé — chaque page est un chunk séparé chargé à la demande
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateSale = lazy(() => import("./pages/CreateSale"));
const Login = lazy(() => import("./pages/Login"));
const PrintReceipt = lazy(() => import("./pages/PrintReceipt"));
const Reports = lazy(() => import("./pages/Reports"));
const Users = lazy(() => import("./pages/Users"));
const CompanySettingsPage = lazy(() => import("./pages/CompanySettings"));
const Phones = lazy(() => import("./pages/Phones"));
const Repairs = lazy(() => import("./pages/Repairs"));
const Clients = lazy(() => import("./pages/Clients"));
const Finances = lazy(() => import("./pages/Finances"));
const LoginHistoryPage = lazy(() => import("./pages/LoginHistory"));
const Natcash = lazy(() => import("./pages/Natcash"));
const Recharges = lazy(() => import("./pages/Recharges"));
const AuditLogPage = lazy(() => import("./pages/AuditLog"));

function HomeRedirect() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "admin" || user.role === "gestionnaire" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/create-sale" replace />
  );
}

function App() {
  return (
    // Fallback minimal pendant le chargement d'un chunk de page
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-sale"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire", "vendeur"]}>
            <CreateSale />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt/print/:code"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire", "vendeur"]}>
            <PrintReceipt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/company"
        element={
          <ProtectedRoute roles={["admin"]}>
            <CompanySettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phones"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Phones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repairs"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Repairs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finances"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire"]}>
            <Finances />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-history"
        element={
          <ProtectedRoute roles={["admin"]}>
            <LoginHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/natcash"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire", "vendeur"]}>
            <Natcash />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recharges"
        element={
          <ProtectedRoute roles={["admin", "gestionnaire", "vendeur"]}>
            <Recharges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App;
