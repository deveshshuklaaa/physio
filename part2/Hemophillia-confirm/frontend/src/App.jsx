
import ExercisePlan from "./pages/ExercisePlan";


import React from "react";
import { Routes, Route } from "react-router-dom";

import AuthScreen from "./pages/AuthScreen";
import ConsentScreen from "./pages/ConsentScreen";
import ProfileStepper from "./pages/ProfileStepper";
import AwarenessScreen from "./pages/AwarenessScreen";
import HemophiliaDetailsScreen from "./pages/HemophiliaDetailsScreen";

import ScreeningResultScreen from "./pages/ScreeningResultScreen";
import CareGuidanceScreen from "./pages/CareGuidanceScreen";
import InfoChatbotScreen from "./pages/InfoChatbotScreen";
import Layout from "./components/Layout";
import RequireToken from "./components/RequireToken";
import Report from "./pages/Report";
import Chatbot from "./pages/HemophiliaChatbot";
import NotFound from "./pages/NotFound";
import PermissionDenied from "./pages/PermissionDenied";

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
import AdminManagement from "./pages/AdminManagement.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";
import AdminChangePassword from "./pages/AdminChangePassword.jsx";

import OTPVerification from "./pages/OTPVerification";
import ForgotPassword from "./pages/ForgotPassword";

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

      <Route
        path="/admin-login"
        element={<AdminLogin />}
      />


      {/* =========================
          PUBLIC
          Doctor registration is a public application form: a new doctor has
          no account yet, so it must stay outside every guard.
      ========================= */}

      <Route
        path="/doctor-registration"
        element={<DoctorRegistration />}
      />

      <Route
        path="/verify-otp"
        element={<OTPVerification />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/permission-denied"
        element={<PermissionDenied />}
      />


      {/* =========================
          DOCTOR / CLINICIAN  (staffAuthToken)
      ========================= */}

      <Route element={<RequireToken tokenKey="staffAuthToken" />}>
        <Route
          path="/doctor-dashboard"
          element={<DoctorDashboard />}
        />

        <Route
          path="/doctor/patient-research"
          element={<PatientResearch />}
        />

        {/* Reached straight after login when mustChangePassword is true,
            so staffAuthToken is already set by then. */}
        <Route
          path="/doctor-change-password"
          element={<DoctorChangePassword />}
        />
      </Route>


      {/* =========================
          ADMIN  (adminToken)
      ========================= */}

      <Route element={<RequireToken tokenKey="adminToken" />}>
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/doctors"
          element={<AdminDoctors />}
        />

        <Route
          path="/admin/doctor-requests"
          element={<AdminDoctorRequests />}
        />

        <Route
          path="/admin/doctor-requests/:requestId"
          element={<AdminDoctorRequestDetails />}
        />

        <Route
          path="/admin/patient-research"
          element={<AdminPatientResearch />}
        />

        <Route
          path="/admin-management"
          element={<AdminManagement />}
        />

        <Route
          path="/admin/profile"
          element={<AdminProfile />}
        />

        {/* Was never routed: OTPVerification.jsx:561 and AdminProfile.jsx:47
            both navigate here, so a new admin forced to change password hit
            the 404 and could not finish logging in. */}
        <Route
          path="/admin-change-password"
          element={<AdminChangePassword />}
        />
      </Route>


      {/* =========================
          PATIENT ONBOARDING
          Consent and profile run before onboarding is complete, so they sit
          outside the Layout guard but still require a patient token.
      ========================= */}

      <Route element={<RequireToken tokenKey="authToken" redirect="/" />}>
        <Route
          path="/consent"
          element={<ConsentScreen />}
        />

        <Route
          path="/register/profile"
          element={<ProfileStepper />}
        />
      </Route>


      {/* =========================
          PATIENT PROTECTED PAGES
      ========================= */}

      <Route element={<RequireToken tokenKey="authToken" redirect="/" />}>
        <Route element={<Layout />}>

          <Route
            path="/chatbot"
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
        element={<NotFound />}
      />

    </Routes>
  );
}

export default App;
