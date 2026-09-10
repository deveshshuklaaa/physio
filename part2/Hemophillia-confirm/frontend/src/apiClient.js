// import axios from "axios";

// // const api = axios.create({
// //   baseURL: "http://localhost:5000/api",
// // });

// const baseURL =
//   window.location.hostname === "localhost"
//     ? "http://localhost:5000/api"
//     : `http://${window.location.hostname}:5000/api`;

// const api = axios.create({
//   baseURL,
// });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("authToken");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;

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

export default api;