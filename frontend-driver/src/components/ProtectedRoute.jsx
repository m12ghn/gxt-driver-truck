import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  const user = localStorage.getItem("driverUser");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;

}
