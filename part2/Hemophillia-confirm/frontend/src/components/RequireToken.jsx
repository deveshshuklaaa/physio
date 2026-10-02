import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Router-level gate. `tokenKey` is the localStorage key each login flow already
// writes: authToken (patient), staffAuthToken (doctor/clinician), adminToken.
//
// ponytail: presence check only. An expired or forged token string still passes
// here and is rejected by the API on the first call. Decode and check exp/role
// if a stale token reaching a page ever causes a real problem.
const RequireToken = ({ tokenKey, redirect = "/permission-denied" }) =>
  localStorage.getItem(tokenKey) ? <Outlet /> : <Navigate to={redirect} replace />;

export default RequireToken;
