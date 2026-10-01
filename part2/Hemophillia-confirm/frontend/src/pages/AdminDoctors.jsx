

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const AdminDoctors = () => {
  const navigate = useNavigate();
  const admin = (() => {
  try {
    return JSON.parse(localStorage.getItem("admin") || "{}");
  } catch {
    return {};
  }
})();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // =========================================================
  // ADMIN NAME
  // =========================================================

  const getAdminName = () => {
    try {
      const storedAdmin = localStorage.getItem("admin");

      if (!storedAdmin) {
        return "Administrator";
      }

      const admin = JSON.parse(localStorage.getItem("admin") || "{}");

      return (
        admin?.name ||
        admin?.fullName ||
        admin?.email ||
        "Administrator"
      );
    } catch {
      return "Administrator";
    }
  };

  const adminName = getAdminName();

  // =========================================================
  // AUTH TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("adminToken");
  };

  // =========================================================
  // LOAD DOCTORS
  // =========================================================

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.get("/admin/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const doctorList =
        response.data?.doctors ||
        response.data?.data ||
        [];

      setDoctors(
        Array.isArray(doctorList)
          ? doctorList
          : []
      );
    } catch (err) {
      console.error(
        "Error loading doctors:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/admin-login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load doctors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    delete api.defaults.headers.common[
      "Authorization"
    ];

    navigate("/admin-login");
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredDoctors = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      const searchableText = [
        doctor.fullName,
        doctor.email,
        doctor.mobileNumber,
        doctor.professionalId,
        doctor.medicalRegistrationNumber,
        doctor.medicalCouncil,
        doctor.qualification,
        doctor.specialization,
        doctor.yearsOfExperience,
        doctor.hospitalName,
        doctor.country,
        doctor.stateProvince,
        doctor.city,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [doctors, search]);

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) {
      return "DR";
    }

    return name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusClass = (status) => {
    if (
      String(status)
        .toUpperCase() === "APPROVED"
    ) {
      return "status-approved";
    }

    return "status-other";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="admin-doctors-page">
          <aside className="admin-sidebar">
            <div className="sidebar-brand">
              <div className="brand-logo">
                H
              </div>

              <div>
                <div className="brand-title">
                  Hemophilia
                </div>

                <div className="brand-subtitle">
                  Healthcare System
                </div>
              </div>
            </div>

            <div className="sidebar-profile">
              <div className="profile-avatar">
                {getInitials(adminName)}
              </div>

              <div>
                <strong>
                  {adminName}
                </strong>

                
              </div>
            </div>

            <nav className="sidebar-nav">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="sidebar-item"
              >
                <span>⌂</span>
                Dashboard
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/admin/doctor-requests"
                  )
                }
                className="sidebar-item"
              >
                <span>◉</span>
                Doctor Requests
              </button>

              <button
                className="sidebar-item active"
              >
                <span>♙</span>
                Doctors
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/admin/patient-research"
                  )
                }
                className="sidebar-item"
              >
                <span>⌕</span>
                Patient Research
              </button>
            </nav>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              <span>↪</span>
              Logout
            </button>
          </aside>

          <main className="admin-main">
            <div className="loading-container">
              <div className="spinner"></div>

              <h2>
                Loading Doctors
              </h2>

              <p>
                Please wait while we load
                the doctor directory.
              </p>
            </div>
          </main>
        </div>
      </>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <>
        <style>{styles}</style>

        <div className="admin-doctors-page">
          <aside className="admin-sidebar">
            <div className="sidebar-brand">
              <div className="brand-logo">
                H
              </div>

              <div>
                <div className="brand-title">
                  Hemophilia
                </div>

                <div className="brand-subtitle">
                  Healthcare System
                </div>
              </div>
            </div>

            <div className="sidebar-profile">
              <div className="profile-avatar">
                {getInitials(adminName)}
              </div>

              <div>
                <strong>
                  {adminName}
                </strong>

                <span>
                  Administrator
                </span>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="sidebar-item"
              >
                <span>⌂</span>
                Dashboard
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/admin/doctor-requests"
                  )
                }
                className="sidebar-item"
              >
                <span>◉</span>
                Doctor Requests
              </button>

              <button
                className="sidebar-item active"
              >
                <span>♙</span>
                Doctors
              </button>
            </nav>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              <span>↪</span>
              Logout
            </button>
          </aside>

          <main className="admin-main">
            <div className="error-container">
              <div className="error-icon">
                !
              </div>

              <h2>
                Unable to Load Doctors
              </h2>

              <p>{error}</p>

              <button
                className="primary-button"
                onClick={fetchDoctors}
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      <style>{styles}</style>

      <div className="admin-doctors-page">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <aside className="admin-sidebar">

          <div className="sidebar-brand">
            <div className="brand-logo">
              H
            </div>

            <div>
              <div className="brand-title">
                Hemophilia
              </div>

              <div className="brand-subtitle">
                Healthcare System
              </div>
            </div>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">
              {getInitials(adminName)}
            </div>

            <div>
              <strong>
                {adminName}
              </strong>

              <span>
                Administrator
              </span>
            </div>
          </div>

          <nav className="sidebar-nav">

            <button
              onClick={() => navigate("/admin/dashboard")}
              className="sidebar-item"
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              onClick={() =>
                navigate(
                  "/admin/doctor-requests"
                )
              }
              className="sidebar-item"
            >
              <span>◉</span>
              Doctor Requests
            </button>

            <button
              className="sidebar-item active"
            >
              <span>♙</span>
              Doctors
            </button>

            <button
              onClick={() =>
                navigate(
                  "/admin/patient-research"
                )
              }
              className="sidebar-item"
            >
              <span>⌕</span>
              Patient Research
            </button>

          </nav>

          

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </aside>

        {/* =====================================================
            MAIN
        ====================================================== */}

        <main className="admin-main">

          {/* HEADER */}

          <header className="page-header">

            <div>
              <div className="breadcrumb">
                Administration
                <span>›</span>
                Doctors
              </div>

              <h1>
                Doctor Directory
              </h1>

              <p>
                Search and view information
                about approved doctors.
              </p>
            </div>

            <div className="header-actions">

              <button
                className="refresh-button"
                onClick={fetchDoctors}
                title="Refresh doctors"
              >
                ↻
              </button>

              <div className="admin-badge">
                {/* <div className="admin-badge-avatar">
                  {getInitials(adminName)}
                </div> */}

                <div>
                  

                  <span>
                    
                  </span>
                </div>
              </div>

            </div>

          </header>

          {/* =====================================================
              SUMMARY
          ====================================================== */}

          <section className="summary-grid">

            <div className="summary-card">

              <div className="summary-icon blue">
                ♙
              </div>

              <div>
                <span>
                  Total Doctors
                </span>

                <strong>
                  {doctors.length}
                </strong>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon green">
                ✓
              </div>

              <div>
                <span>
                  Approved Doctors
                </span>

                <strong>
                  {doctors.filter(
                    (doctor) =>
                      String(
                        doctor.accountStatus
                      ).toUpperCase() ===
                      "APPROVED"
                  ).length}
                </strong>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon purple">
                🔐
              </div>

              <div>
                <span>
                  Password Change Pending
                </span>

                <strong>
                  {doctors.filter(
                    (doctor) =>
                      doctor.mustChangePassword ===
                      true
                  ).length}
                </strong>
              </div>

            </div>

            {/* <div className="summary-card">

              <div className="summary-icon orange">
                ⌕
              </div>

              <div>
                <span>
                  Search Results
                </span>

                <strong>
                  {filteredDoctors.length}
                </strong>
              </div>

            </div> */}

          </section>

          {/* =====================================================
              SEARCH
          ====================================================== */}

          <section className="search-card">

            <div className="search-heading">

              <div>
                <h2>
                  Search Doctors
                </h2>

                <p>
                  Search by professional ID,
                  name, email, specialization,
                  hospital, registration number
                  or location.
                </p>
              </div>

            </div>

            <div className="search-row">

              <div className="search-input-wrapper">

                <span className="search-icon">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

                {search && (
                  <button
                    className="clear-search"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}

              </div>

              <div className="result-count">
                {filteredDoctors.length}{" "}
                doctor
                {filteredDoctors.length !==
                1
                  ? "s"
                  : ""}{" "}
                found
              </div>

            </div>

          </section>

          {/* =====================================================
              DOCTOR TABLE
          ====================================================== */}

          <section className="doctors-card">

            <div className="table-header">

              <div>
                <h2>
                  Approved Doctors
                </h2>

                <p>
                  Only approved doctor
                  accounts are displayed here.
                </p>
              </div>

              <div className="approved-label">
                <span className="approved-dot"></span>
                Approved Directory
              </div>

            </div>

            {filteredDoctors.length ===
            0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ♙
                </div>

                <h3>
                  {search
                    ? "No doctors found"
                    : "No approved doctors yet"}
                </h3>

                <p>
                  {search
                    ? "Try searching with another name, professional ID, specialization or hospital."
                    : "Approved doctors will appear here after an administrator approves their registration."}
                </p>

                {search && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    Clear Search
                  </button>
                )}

              </div>

            ) : (

              <div className="table-wrapper">

                <table className="doctors-table">

                  <thead>
                    <tr>
                      <th>
                        Doctor
                      </th>

                      <th>
                        Professional ID
                      </th>

                      <th>
                        Specialization
                      </th>

                      <th>
                        Hospital / Organization
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredDoctors.map(
                      (doctor) => (
                        <tr
                          key={
                            doctor._id ||
                            doctor.id ||
                            doctor.professionalId ||
                            doctor.email
                          }
                        >

                          {/* DOCTOR */}

                          <td>

                            <div className="doctor-cell">

                              <div className="doctor-avatar">
                                {getInitials(
                                  doctor.fullName
                                )}
                              </div>

                              <div className="doctor-basic">

                                <strong>
                                  {doctor.fullName ||
                                    "—"}
                                </strong>

                                <span>
                                  {doctor.email ||
                                    "—"}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* PROFESSIONAL ID */}

                          <td>

                            <span className="professional-id">
                              {doctor.professionalId ||
                                "—"}
                            </span>

                          </td>

                          {/* SPECIALIZATION */}

                          <td>

                            <div className="specialization-cell">
                              {doctor.specialization ||
                                "—"}
                            </div>

                          </td>

                          {/* HOSPITAL */}

                          <td>

                            <div className="hospital-cell">

                              <strong>
                                {doctor.hospitalName ||
                                  "—"}
                              </strong>

                            </div>

                          </td>

                          {/* LOCATION */}

                          <td>

                            <div className="location-cell">

                              <span>
                                {doctor.city ||
                                  "—"}
                              </span>

                              {(doctor.stateProvince ||
                                doctor.country) && (
                                <small>
                                  {[
                                    doctor.stateProvince,
                                    doctor.country,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      ", "
                                    )}
                                </small>
                              )}

                            </div>

                          </td>

                          {/* STATUS */}

                          <td>

                            <div className="status-column">

                              <span
                                className={`status-badge ${getStatusClass(
                                  doctor.accountStatus
                                )}`}
                              >
                                <span className="status-dot"></span>

                                {doctor.accountStatus ||
                                  "APPROVED"}
                              </span>

                              {doctor.mustChangePassword ===
                                true && (
                                <span className="password-warning">
                                  Password change
                                  pending
                                </span>
                              )}

                            </div>

                          </td>

                          {/* ACTION */}

                          <td>

                            <button
                              className="view-button"
                              onClick={() =>
                                setSelectedDoctor(
                                  doctor
                                )
                              }
                            >
                              View Details
                              <span>
                                →
                              </span>
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </main>

        {/* =====================================================
            DOCTOR DETAILS MODAL
        ====================================================== */}

        {selectedDoctor && (
          <div
            className="modal-overlay"
            onClick={() =>
              setSelectedDoctor(null)
            }
          >

            <div
              className="doctor-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div className="modal-doctor-info">

                  <div className="modal-avatar">
                    {getInitials(
                      selectedDoctor.fullName
                    )}
                  </div>

                  <div>

                    <div className="modal-title-row">

                      <h2>
                        {selectedDoctor.fullName ||
                          "Doctor"}
                      </h2>

                      <span className="doctor-label">
                        Doctor
                      </span>

                    </div>

                    <p>
                      {selectedDoctor.specialization ||
                        "Medical Professional"}
                    </p>

                    <span className="modal-professional-id">
                      Professional ID:{" "}
                      {selectedDoctor.professionalId ||
                        "—"}
                    </span>

                  </div>

                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setSelectedDoctor(
                      null
                    )
                  }
                >
                  ×
                </button>

              </div>

              {/* STATUS BAR */}

              <div className="modal-status-bar">

                <span
                  className={`status-badge ${getStatusClass(
                    selectedDoctor.accountStatus
                  )}`}
                >
                  <span className="status-dot"></span>

                  {selectedDoctor.accountStatus ||
                    "APPROVED"}
                </span>

                {selectedDoctor.mustChangePassword ===
                true ? (
                  <span className="password-pending">
                    🔐 Password change pending
                  </span>
                ) : (
                  <span className="password-complete">
                    ✓ Password configured
                  </span>
                )}

              </div>

              {/* PERSONAL INFORMATION */}

              <div className="modal-section">

                <div className="section-title">
                  <span className="section-icon">
                    👤
                  </span>

                  <div>
                    <h3>
                      Personal Information
                    </h3>

                    <p>
                      Doctor contact details
                    </p>
                  </div>
                </div>

                <div className="details-grid">

                  <Detail
                    label="Full Name"
                    value={
                      selectedDoctor.fullName
                    }
                  />

                  <Detail
                    label="Email Address"
                    value={
                      selectedDoctor.email
                    }
                  />

                  <Detail
                    label="Mobile Number"
                    value={
                      selectedDoctor.mobileNumber
                    }
                  />

                  <Detail
                    label="Professional ID"
                    value={
                      selectedDoctor.professionalId
                    }
                    highlight
                  />

                </div>

              </div>

              {/* PROFESSIONAL INFORMATION */}

              <div className="modal-section">

                <div className="section-title">
                  <span className="section-icon">
                    🩺
                  </span>

                  <div>
                    <h3>
                      Professional Information
                    </h3>

                    <p>
                      Medical registration and
                      qualifications
                    </p>
                  </div>
                </div>

                <div className="details-grid">

                  <Detail
                    label="Medical Registration Number"
                    value={
                      selectedDoctor.medicalRegistrationNumber
                    }
                  />

                  <Detail
                    label="Medical Council"
                    value={
                      selectedDoctor.medicalCouncil
                    }
                  />

                  <Detail
                    label="Qualification"
                    value={
                      selectedDoctor.qualification
                    }
                  />

                  <Detail
                    label="Specialization"
                    value={
                      selectedDoctor.specialization
                    }
                  />

                  <Detail
                    label="Years of Experience"
                    value={
                      selectedDoctor.yearsOfExperience !==
                      undefined &&
                      selectedDoctor.yearsOfExperience !==
                      null &&
                      selectedDoctor.yearsOfExperience !==
                      ""
                        ? `${selectedDoctor.yearsOfExperience} years`
                        : "—"
                    }
                  />

                </div>

              </div>

              {/* WORKPLACE & LOCATION */}

              <div className="modal-section">

                <div className="section-title">
                  <span className="section-icon">
                    🏥
                  </span>

                  <div>
                    <h3>
                      Workplace & Location
                    </h3>

                    <p>
                      Current professional
                      workplace and location
                    </p>
                  </div>
                </div>

                <div className="details-grid">

                  <Detail
                    label="Hospital / Organization"
                    value={
                      selectedDoctor.hospitalName
                    }
                    full
                  />

                  <Detail
                    label="Country"
                    value={
                      selectedDoctor.country
                    }
                  />

                  <Detail
                    label="State / Province"
                    value={
                      selectedDoctor.stateProvince
                    }
                  />

                  <Detail
                    label="City"
                    value={
                      selectedDoctor.city
                    }
                  />

                </div>

              </div>

              {/* ACCOUNT INFORMATION */}

              <div className="modal-section">

                <div className="section-title">
                  <span className="section-icon">
                    🔐
                  </span>

                  <div>
                    <h3>
                      Account Information
                    </h3>

                    <p>
                      Doctor account and approval
                      information
                    </p>
                  </div>
                </div>

                <div className="details-grid">

                  <Detail
                    label="Account Status"
                    value={
                      selectedDoctor.accountStatus
                    }
                  />

                  <Detail
                    label="Password Status"
                    value={
                      selectedDoctor.mustChangePassword
                        ? "Password change required"
                        : "Password configured"
                    }
                  />

                  <Detail
                    label="Registration Submitted"
                    value={formatDateTime(
                      selectedDoctor.registrationDate ||
                        selectedDoctor.createdAt
                    )}
                  />

                  <Detail
                    label="Approved On"
                    value={formatDateTime(
                      selectedDoctor.approvedAt
                    )}
                  />

                  <Detail
                    label="Doctor Account Created"
                    value={formatDateTime(
                      selectedDoctor.doctorCreatedAt
                    )}
                  />

                  <Detail
                    label="Approved By"
                    value={
                        selectedDoctor.approvedBy ||
                        (admin.adminLevel === "SUPER_ADMIN"
                        ? "Super Admin"
                        : "Assistant Admin")
                    }
                    />

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  className="modal-close-button"
                  onClick={() =>
                    setSelectedDoctor(
                      null
                    )
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
};

// =============================================================
// DETAIL COMPONENT
// =============================================================

const Detail = ({
  label,
  value,
  full = false,
  highlight = false,
}) => {
  return (
    <div
      className={`detail-item ${
        full ? "detail-full" : ""
      }`}
    >

      <span>
        {label}
      </span>

      <strong
        className={
          highlight
            ? "detail-highlight"
            : ""
        }
      >
        {value ||
          "Not available"}
      </strong>

    </div>
  );
};

// =============================================================
// STYLES
// =============================================================

const styles = `
* {
  box-sizing: border-box;
}

.admin-doctors-page {
  min-height: 100vh;
  display: flex;
  background: #f5f8fc;
  color: #10233f;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* ============================================================
   SIDEBAR
============================================================ */

.admin-sidebar {
  width: 255px;
  min-height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e0e8f2;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 8px 25px;
  border-bottom: 1px solid #edf1f6;
}

.brand-logo {
  width: 39px;
  height: 39px;
  border-radius: 11px;
  background: linear-gradient(
    135deg,
    #2c5ce0,
    #1740a8
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 800;
}

.brand-title {
  font-size: 16px;
  font-weight: 800;
  color: #10233f;
}

.brand-subtitle {
  font-size: 10px;
  color: #8092aa;
  margin-top: 2px;
}

.sidebar-profile {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 9px;
  margin-bottom: 10px;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9effd;
  color: #2c5ce0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
}

.sidebar-profile strong {
  display: block;
  font-size: 12px;
  color: #253955;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-profile span {
  display: block;
  color: #93a4ba;
  font-size: 10px;
  margin-top: 3px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sidebar-item {
  width: 100%;
  border: 0;
  background: transparent;
  border-radius: 10px;
  min-height: 45px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  color: #60728b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.sidebar-item span {
  width: 20px;
  text-align: center;
  font-size: 17px;
}

.sidebar-item:hover {
  background: #f3f6fb;
  color: #2c5ce0;
}

.sidebar-item.active {
  background: #eaf0fe;
  color: #2c5ce0;
  font-weight: 750;
}

.logout-button {
  margin-top: auto;
  border: 0;
  background: #f8fafd;
  color: #687b94;
  border-radius: 10px;
  min-height: 44px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
}

.logout-button:hover {
  background: #fff0f0;
  color: #d64d4d;
}

/* ============================================================
   MAIN
============================================================ */

.admin-main {
  margin-left: 255px;
  width: calc(100% - 255px);
  min-height: 100vh;
  padding: 30px 34px 45px;
}

/* ============================================================
   HEADER
============================================================ */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 26px;
}

.breadcrumb {
  color: #8a9ab0;
  font-size: 11px;
  margin-bottom: 8px;
}

.breadcrumb span {
  padding: 0 7px;
  color: #b1bdcb;
}

.page-header h1 {
  margin: 0;
  color: #10233f;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
}

.page-header p {
  margin: 7px 0 0;
  color: #71839b;
  font-size: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-button {
  width: 42px;
  height: 42px;
  border: 1px solid #dce5f0;
  border-radius: 11px;
  background: white;
  color: #4268b9;
  font-size: 22px;
  cursor: pointer;
}

.refresh-button:hover {
  background: #f5f8ff;
}

.admin-badge {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #fff;
  border: 1px solid #e0e8f2;
  border-radius: 12px;
  padding: 6px 12px 6px 7px;
}

.admin-badge-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eaf0fe;
  color: #2c5ce0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.admin-badge strong {
  display: block;
  font-size: 11px;
  color: #2d405a;
}

.admin-badge span {
  display: block;
  color: #91a1b5;
  font-size: 9px;
  margin-top: 1px;
}

/* ============================================================
   SUMMARY
============================================================ */

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 18px;
}

.summary-card {
  background: white;
  border: 1px solid #e1e9f3;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 13px;
  box-shadow:
    0 2px 7px rgba(
      16,
      35,
      63,
      0.025
    );
}

.summary-icon {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
}

.summary-icon.blue {
  background: #eaf0fe;
  color: #2c5ce0;
}

.summary-icon.green {
  background: #e8f8f1;
  color: #149461;
}

.summary-icon.purple {
  background: #f0ebff;
  color: #7251cf;
}

.summary-icon.orange {
  background: #fff3e5;
  color: #d9801f;
}

.summary-card span {
  display: block;
  font-size: 10px;
  color: #8292a7;
  margin-bottom: 4px;
}

.summary-card strong {
  display: block;
  font-size: 22px;
  color: #17304f;
}

/* ============================================================
   SEARCH
============================================================ */

.search-card {
  background: white;
  border: 1px solid #e0e8f2;
  border-radius: 15px;
  padding: 21px;
  margin-bottom: 18px;
}

.search-heading h2 {
  margin: 0;
  font-size: 16px;
  color: #18304e;
}

.search-heading p {
  margin: 5px 0 15px;
  color: #8292a7;
  font-size: 11px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 13px;
}

.search-input-wrapper {
  flex: 1;
  height: 48px;
  border: 1px solid #d9e3ef;
  border-radius: 11px;
  background: #fbfcfe;
  display: flex;
  align-items: center;
  padding: 0 13px;
  transition: 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #5c7fe2;
  box-shadow:
    0 0 0 3px rgba(
      44,
      92,
      224,
      0.08
    );
  background: white;
}

.search-icon {
  color: #8da0b7;
  font-size: 19px;
  margin-right: 9px;
}

.search-input-wrapper input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #253955;
  font-size: 12px;
}

.search-input-wrapper input::placeholder {
  color: #a0afc1;
}

.clear-search {
  border: 0;
  background: #e9eef5;
  color: #60738d;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 17px;
  line-height: 20px;
}

.result-count {
  white-space: nowrap;
  color: #70839b;
  font-size: 11px;
  font-weight: 600;
}

/* ============================================================
   DOCTOR CARD
============================================================ */

.doctors-card {
  background: white;
  border: 1px solid #e0e8f2;
  border-radius: 15px;
  overflow: hidden;
}

.table-header {
  padding: 21px 22px;
  border-bottom: 1px solid #e8edf4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.table-header h2 {
  margin: 0;
  font-size: 16px;
  color: #18304e;
}

.table-header p {
  margin: 5px 0 0;
  color: #8a9aae;
  font-size: 10px;
}

.approved-label {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  background: #eaf8f1;
  color: #168b5c;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.approved-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #20a66b;
}

/* ============================================================
   TABLE
============================================================ */

.table-wrapper {
  overflow-x: auto;
}

.doctors-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1080px;
}

.doctors-table th {
  background: #f8fafd;
  color: #71849b;
  text-align: left;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 13px 15px;
  border-bottom: 1px solid #e4ebf3;
  white-space: nowrap;
}

.doctors-table td {
  padding: 15px;
  border-bottom: 1px solid #edf1f6;
  vertical-align: middle;
}

.doctors-table tbody tr:hover {
  background: #fbfcff;
}

.doctors-table tbody tr:last-child td {
  border-bottom: 0;
}

.doctor-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 190px;
}

.doctor-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 50%;
  background: #eaf0fe;
  color: #2c5ce0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.doctor-basic strong {
  display: block;
  color: #213953;
  font-size: 11px;
  font-weight: 750;
}

.doctor-basic span {
  display: block;
  color: #8495aa;
  font-size: 9px;
  margin-top: 3px;
}

.professional-id {
  display: inline-flex;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f0f4fb;
  color: #34558b;
  font-size: 10px;
  font-weight: 750;
  font-family: monospace;
}

.specialization-cell {
  max-width: 160px;
  color: #3c526e;
  font-size: 10px;
  line-height: 1.45;
}

.hospital-cell {
  max-width: 160px;
}

.hospital-cell strong {
  color: #3c526e;
  font-size: 10px;
  line-height: 1.45;
}

.location-cell span {
  display: block;
  color: #3d536f;
  font-size: 10px;
}

.location-cell small {
  display: block;
  color: #91a0b3;
  font-size: 8px;
  margin-top: 3px;
}

.status-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 750;
  white-space: nowrap;
}

.status-approved {
  background: #e9f8f0;
  color: #168a5b;
}

.status-other {
  background: #f1f3f6;
  color: #65758b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.password-warning {
  color: #c17a18;
  font-size: 8px;
  white-space: nowrap;
}

.view-button {
  border: 1px solid #d9e4f4;
  background: #f6f9ff;
  color: #2c5ce0;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.view-button:hover {
  background: #eaf0fe;
  border-color: #cbd9f5;
}

.view-button span {
  font-size: 12px;
}

/* ============================================================
   EMPTY
============================================================ */

.empty-state {
  text-align: center;
  padding: 65px 25px;
}

.empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #eef3fb;
  color: #6f83a2;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25px;
}

.empty-state h3 {
  margin: 0;
  color: #263d59;
  font-size: 15px;
}

.empty-state p {
  max-width: 450px;
  margin: 7px auto 18px;
  color: #8a9aae;
  font-size: 10px;
  line-height: 1.6;
}

.secondary-button,
.primary-button {
  border: 0;
  border-radius: 8px;
  padding: 9px 15px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

.secondary-button {
  background: #eaf0fe;
  color: #2c5ce0;
}

.primary-button {
  background: #2c5ce0;
  color: white;
}

/* ============================================================
   MODAL
============================================================ */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(
    14,
    30,
    52,
    0.55
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  backdrop-filter: blur(3px);
}

.doctor-modal {
  width: min(
    900px,
    100%
  );
  max-height: 92vh;
  overflow-y: auto;
  background: white;
  border-radius: 18px;
  box-shadow:
    0 25px 70px rgba(
      8,
      25,
      50,
      0.22
    );
}

.modal-header {
  padding: 22px 25px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e7edf4;
}

.modal-doctor-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.modal-avatar {
  width: 58px;
  height: 58px;
  border-radius: 15px;
  background: #eaf0fe;
  color: #2c5ce0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.modal-title-row h2 {
  margin: 0;
  color: #132b48;
  font-size: 19px;
}

.doctor-label {
  padding: 4px 7px;
  border-radius: 5px;
  background: #edf2fa;
  color: #627791;
  font-size: 8px;
  font-weight: 750;
  text-transform: uppercase;
}

.modal-doctor-info p {
  margin: 4px 0;
  color: #687c96;
  font-size: 10px;
}

.modal-professional-id {
  display: inline-block;
  margin-top: 2px;
  color: #2c5ce0;
  font-size: 9px;
  font-weight: 700;
  font-family: monospace;
}

.modal-close {
  border: 0;
  background: #f2f5f9;
  color: #65788f;
  width: 33px;
  height: 33px;
  border-radius: 50%;
  font-size: 22px;
  line-height: 25px;
  cursor: pointer;
}

.modal-close:hover {
  background: #e9edf3;
}

.modal-status-bar {
  padding: 12px 25px;
  background: #f8fafd;
  border-bottom: 1px solid #e7edf4;
  display: flex;
  align-items: center;
  gap: 13px;
}

.password-pending {
  color: #c17a18;
  font-size: 9px;
  font-weight: 700;
}

.password-complete {
  color: #168a5b;
  font-size: 9px;
  font-weight: 700;
}

.modal-section {
  padding: 22px 25px;
  border-bottom: 1px solid #edf1f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 17px;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #edf2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.section-title h3 {
  margin: 0;
  color: #203853;
  font-size: 12px;
}

.section-title p {
  margin: 3px 0 0;
  color: #93a1b2;
  font-size: 8px;
}

.details-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.detail-item {
  border: 1px solid #e7edf4;
  background: #fbfcfe;
  border-radius: 9px;
  padding: 11px 12px;
  min-height: 58px;
}

.detail-full {
  grid-column: 1 / -1;
}

.detail-item span {
  display: block;
  color: #8999ad;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 700;
  margin-bottom: 6px;
}

.detail-item strong {
  display: block;
  color: #304862;
  font-size: 10px;
  line-height: 1.4;
  word-break: break-word;
}

.detail-highlight {
  color: #2c5ce0 !important;
  font-family: monospace;
}

.modal-footer {
  padding: 17px 25px;
  display: flex;
  justify-content: flex-end;
  background: #fafbfd;
}

.modal-close-button {
  border: 1px solid #dce5ef;
  background: white;
  color: #60738b;
  border-radius: 8px;
  padding: 9px 17px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

.modal-close-button:hover {
  background: #f4f7fb;
}

/* ============================================================
   LOADING / ERROR
============================================================ */

.loading-container,
.error-container {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 3px solid #e3eaf5;
  border-top-color: #2c5ce0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container h2,
.error-container h2 {
  margin: 0;
  color: #263d59;
  font-size: 17px;
}

.loading-container p,
.error-container p {
  margin: 7px 0 0;
  color: #8595aa;
  font-size: 11px;
}

.error-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff0f0;
  color: #d95353;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 24px;
  margin-bottom: 15px;
}

.error-container .primary-button {
  margin-top: 18px;
}

/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 1050px) {

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 800px) {

  .admin-sidebar {
    width: 72px;
    padding: 18px 9px;
  }

  .brand-title,
  .brand-subtitle,
  .sidebar-profile > div:last-child,
  .sidebar-item:not(.active)::after {
    display: none;
  }

  .sidebar-brand {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar-profile {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar-item {
    justify-content: center;
    padding: 0;
  }

  .sidebar-item span {
    margin: 0;
  }

  .logout-button {
    justify-content: center;
    padding: 0;
  }

  .admin-main {
    margin-left: 72px;
    width: calc(100% - 72px);
    padding: 22px 18px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 560px) {

  .admin-sidebar {
    display: none;
  }

  .admin-main {
    margin-left: 0;
    width: 100%;
    padding: 18px 12px 30px;
  }

  .page-header h1 {
    font-size: 23px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .result-count {
    text-align: right;
  }

  .table-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-header,
  .modal-section,
  .modal-footer {
    padding-left: 17px;
    padding-right: 17px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detail-full {
    grid-column: auto;
  }

  .modal-doctor-info {
    align-items: flex-start;
  }

}
`;

export default AdminDoctors;
