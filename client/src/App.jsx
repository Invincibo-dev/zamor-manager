import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CreateSale from "./pages/CreateSale";
import Login from "./pages/Login";
import PrintReceipt from "./pages/PrintReceipt";
import Reports from "./pages/Reports";
import SellerSales from "./pages/SellerSales";
import Users from "./pages/Users";
import ProtectedRoute from "./routes/ProtectedRoute";
import { getStoredUser } from "./utils/auth";

function HomeRedirect() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "admin" ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/create-sale" replace />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-sale"
        element={
          <ProtectedRoute roles={["admin", "vendeur"]}>
            <CreateSale />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-history"
        element={
          <ProtectedRoute roles={["admin", "vendeur"]}>
            <SellerSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["admin"]}>
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
          <ProtectedRoute roles={["admin", "vendeur"]}>
            <PrintReceipt />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
