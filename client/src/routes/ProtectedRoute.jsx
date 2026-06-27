import { Navigate } from "react-router-dom";
import { getStoredUser } from "../utils/auth";

function ProtectedRoute({ children, roles = [] }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "admin" || user.role === "gestionnaire" ? "/dashboard" : "/create-sale"}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
