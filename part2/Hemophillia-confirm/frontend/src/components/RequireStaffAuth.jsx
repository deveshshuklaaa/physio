import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const RequireStaffAuth = () => {
  const token = localStorage.getItem("staffAuthToken");

  if (!token) {
    return <Navigate to="/permission-denied" replace />;
  }

  return <Outlet />;
};

export default RequireStaffAuth;
