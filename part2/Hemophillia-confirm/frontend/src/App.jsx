
import ExercisePlan from "./pages/ExercisePlan";


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
import AdminManagement from "./pages/AdminManagement.jsx";
import AdminProfile from "./pages/AdminProfile.jsx";

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
        path="/admin/dashboard"
        element={<AdminDashboard />}
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
      <Route path="/admin-management" element = {<AdminManagement/>}/>
      <Route path="/admin/profile" element = {<AdminProfile/>}/>

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
          PASSWORD RESET
      ========================= */}

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
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
