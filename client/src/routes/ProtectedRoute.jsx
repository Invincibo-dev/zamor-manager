import { Navigate } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../utils/auth";

function ProtectedRoute({ children, roles = [] }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <Navigate to={user.role === "admin" ? "/dashboard" : "/create-sale"} replace />
    );
  }

  return children;
}

export default ProtectedRoute;
