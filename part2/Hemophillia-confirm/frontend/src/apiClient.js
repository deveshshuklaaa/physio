

import axios from "axios";

// One origin via nginx (G2-A) -- everything is /api on the current host.
const baseURL = "/api";

const api = axios.create({
  baseURL,
});

// =====================================================
// AUTHENTICATION TOKEN
// =====================================================

// Staff (doctor/clinician/admin) sessions are stored under a DIFFERENT key
// than patient sessions: DoctorLogin.jsx writes "staffAuthToken",
// AuthScreen.jsx writes "authToken". Both can exist in the same
// localStorage at once -- one origin (G2-A) means the patient app and the
// doctor portal now share it -- so the interceptor cannot just prefer
// whichever it finds first.
//
// Picking by route is what the backend already does: these prefixes are
// mounted behind staffAuth/roleMiddleware and reject a patient token with
// "Doctor / Clinician access required".
const STAFF_PATH_PREFIXES = [
  "/doctor",
  "/admin",
  "/exercise-recommendations/doctor",
];

function isStaffRequest(url = "") {
  return STAFF_PATH_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(`${prefix}/`)
  );
}

api.interceptors.request.use((config) => {
  // Do NOT automatically overwrite an Authorization
  // header that was explicitly provided by a request.
  if (!config.headers.Authorization) {
    const token = isStaffRequest(config.url || "")
      ? localStorage.getItem("staffAuthToken")
      : localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Home route for whoever is currently signed in, from the tokens the login
// flows already store. Returns "/" (patient login) when nobody is signed in.
export const homePath = () =>
  localStorage.getItem("adminToken")
    ? "/admin/dashboard"
    : localStorage.getItem("staffAuthToken")
    ? "/doctor-dashboard"
    : localStorage.getItem("authToken")
    ? "/awareness"
    : "/";

export default api;
