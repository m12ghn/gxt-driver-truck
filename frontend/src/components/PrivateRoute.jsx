import { Navigate } from "react-router-dom";

export default function PrivateRoute({
  children,
  roles,
}) {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Không có quyền
  if (
    roles &&
    !roles.includes(user.quyen)
  ) {
    return <Navigate to="/403" replace />;
  }

  return children;

}