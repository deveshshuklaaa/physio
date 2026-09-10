// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";

// import AuthScreen from "./pages/AuthScreen";
// import ConsentScreen from "./pages/ConsentScreen";
// import ProfileStepper from "./pages/ProfileStepper";
// import AwarenessScreen from "./pages/AwarenessScreen";
// import HemophiliaDetailsScreen from "./pages/HemophiliaDetailsScreen";
// import ChatbotScreen from "./pages/ChatbotScreen";
// import ScreeningResultScreen from "./pages/ScreeningResultScreen";
// import CareGuidanceScreen from "./pages/CareGuidanceScreen";
// import InfoChatbotScreen from "./pages/InfoChatbotScreen";
// import Layout from "./components/Layout";
// import RequireAuth from "./components/RequireAuth";
// import Report from "./pages/Report";
// import Chatbot from "./pages/HemophiliaChatbot";

// import DoctorLogin from "./pages/DoctorLogin";
// import DoctorChangePassword from "./pages/DoctorChangePassword";
// import DoctorDashboard from "./pages/DoctorDashboard";
// import PatientResearch from "./pages/PatientResearch.jsx";
// import AdminLogin from "./pages/AdminLogin";
// import AdminDashboard from "./pages/AdminDashboard";

// function App() {
//   return (
//     <Routes>

//       {/* =========================
//           PATIENT LOGIN
//       ========================= */}
//       <Route path="/" element={<AuthScreen />} />

//       {/* =========================
//           DOCTOR / CLINICIAN LOGIN
//       ========================= */}
//       <Route
//         path="/doctor-login"
//         element={<DoctorLogin />}
//       />

//       {/* =========================
//           DOCTOR PASSWORD CHANGE
//       ========================= */}
//       <Route
//         path="/doctor-change-password"
//         element={<DoctorChangePassword />}
//       />

//       {/* =========================
//           DOCTOR DASHBOARD
//       ========================= */}
//       <Route
//         path="/doctor-dashboard"
//         element={<DoctorDashboard />}
//       />

//       {/* =========================
//           PATIENT PUBLIC PAGES
//       ========================= */}
//       <Route
//         path="/consent"
//         element={<ConsentScreen />}
//       />

//       <Route
//         path="/register/profile"
//         element={<ProfileStepper />}
//       />
//       <Route
//         path="/doctor/patient-research"
//         element={<PatientResearch />}
//       />
//       <Route
//         path="/admin/dashboard"
//         element={<AdminDashboard />}
//       />

//       {/* =========================
//           PATIENT PROTECTED PAGES
//       ========================= */}
//       <Route element={<RequireAuth />}>
//         <Route element={<Layout />}>

//           <Route
//             path="/chatbbot"
//             element={<Chatbot />}
//           />

//           <Route
//             path="/report"
//             element={<Report />}
//           />

//           <Route
//             path="/awareness"
//             element={<AwarenessScreen />}
//           />

//           <Route
//             path="/hemophilia-details"
//             element={<HemophiliaDetailsScreen />}
//           />

//           <Route
//             path="/chatbot"
//             element={<ChatbotScreen />}
//           />

//           <Route
//             path="/screening-result/:id"
//             element={<ScreeningResultScreen />}
//           />

//           <Route
//             path="/care-guidance"
//             element={<CareGuidanceScreen />}
//           />

//           <Route
//             path="/info-chatbot"
//             element={<InfoChatbotScreen />}
//           />

//         </Route>
//       </Route>

//       {/* =========================
//           FALLBACK
//       ========================= */}
//       <Route
//         path="*"
//         element={<Navigate to="/" replace />}
//       />
//       <Route
//         path="/admin-login"
//         element={<AdminLogin />}
//       />
//       <Route
//         path="/admin/dashboard"
//         element={
//           <div style={{ padding: "40px" }}>
//             <h1>Admin Dashboard</h1>
//             <p>Admin authentication working.</p>
//           </div>
//         }
//       />

//     </Routes>
//   );
// }

// export default App;

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AuthScreen from "./pages/AuthScreen";
import ConsentScreen from "./pages/ConsentScreen";
import ProfileStepper from "./pages/ProfileStepper";
import AwarenessScreen from "./pages/AwarenessScreen";
import HemophiliaDetailsScreen from "./pages/HemophiliaDetailsScreen";

import ScreeningResultScreen from "./pages/ScreeningResultScreen";
import CareGuidanceScreen from "./pages/CareGuidanceScreen";
import InfoChatbotScreen from "./pages/InfoChatbotScreen";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Report from "./pages/Report";
import Chatbot from "./pages/HemophiliaChatbot";

import DoctorLogin from "./pages/DoctorLogin";
import DoctorChangePassword from "./pages/DoctorChangePassword";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientResearch from "./pages/PatientResearch.jsx";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDoctorRequests from "./pages/AdminDoctorRequests";
import AdminDoctorRequestDetails from "./pages/AdminDoctorRequestDetails";
import DoctorRegistration from "./pages/DoctorRegistration";
import AdminDoctors from "./pages/AdminDoctors";
import AdminPatientResearch from "./pages/AdminPatientResearch";
import ExercisePlan from "./pages/ExercisePlan";

import OTPVerification from "./pages/OTPVerification";

function App() {
  return (
    <Routes>

      {/* =========================
          PATIENT LOGIN
      ========================= */}

      <Route
        path="/"
        element={<AuthScreen />}
      />


      {/* =========================
          DOCTOR / CLINICIAN LOGIN
      ========================= */}

      <Route
        path="/doctor-login"
        element={<DoctorLogin />}
      />


      {/* =========================
          DOCTOR PASSWORD CHANGE
      ========================= */}

      <Route
        path="/doctor-change-password"
        element={<DoctorChangePassword />}
      />
      <Route
        path="/doctor-registration"
        element={<DoctorRegistration />}
      />
      <Route
        path="/admin/doctors"
        element={<AdminDoctors />}
      />

      <Route
        path="/verify-otp"
        element={<OTPVerification />}
      />


      {/* =========================
          DOCTOR DASHBOARD
      ========================= */}

      <Route
        path="/doctor-dashboard"
        element={<DoctorDashboard />}
      />


      {/* =========================
          PATIENT PUBLIC PAGES
      ========================= */}

      <Route
        path="/consent"
        element={<ConsentScreen />}
      />
      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route
        path="/admin/doctor-requests"
        element={<AdminDoctorRequests />}
      />

      <Route
        path="/admin/patient-research"
        element={<AdminPatientResearch />}
      />

      <Route
        path="/admin/doctor-requests/:requestId"
        element={<AdminDoctorRequestDetails />}
      />

      <Route
        path="/register/profile"
        element={<ProfileStepper />}
      />

      <Route
        path="/doctor/patient-research"
        element={<PatientResearch />}
      />


      {/* =========================
          ADMIN LOGIN
      ========================= */}

      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />


      {/* =========================
          ADMIN DASHBOARD
      ========================= */}

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />


      {/* =========================
          ADMIN DOCTOR REQUESTS
      ========================= */}

      <Route
        path="/admin/doctor-requests"
        element={<AdminDoctorRequests />}
      />


      {/* =========================
          PATIENT PROTECTED PAGES
      ========================= */}

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>

          <Route
            path="/chatbbot"
            element={<Chatbot />}
          />

          <Route
            path="/report"
            element={<Report />}
          />

          <Route
            path="/awareness"
            element={<AwarenessScreen />}
          />

          <Route
            path="/hemophilia-details"
            element={<HemophiliaDetailsScreen />}
          />

          

          <Route
            path="/screening-result/:id"
            element={<ScreeningResultScreen />}
          />

          <Route
            path="/care-guidance"
            element={<CareGuidanceScreen />}
          />

          <Route
            path="/exercise-plan"
            element={<ExercisePlan />}
          />

          <Route
            path="/info-chatbot"
            element={<InfoChatbotScreen />}
          />

        </Route>
      </Route>


      {/* =========================
          FALLBACK
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;