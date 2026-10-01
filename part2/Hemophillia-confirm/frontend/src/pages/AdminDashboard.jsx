     
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState({});
  const [stats, setStats] = useState({
    pendingDoctorRequests: 0,
    totalDoctors: 0,
    activeDoctors: 0,
    approvedDoctorRequests: 0,
    rejectedDoctorRequests: 0,
    approvedToday: 0,
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ADMIN + DASHBOARD
  // =====================================================

  useEffect(() => {
    const storedAdmin =
      JSON.parse(
        localStorage.getItem("admin") || "{}"
      );

    setAdmin(storedAdmin);

    fetchDashboard();
  }, []);

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login", {
          replace: true,
        });

        return;
      }

      const response =
        await api.get(
          "/admin/dashboard",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load dashboard"
        );
      }

      setStats(
        response.data.stats || {}
      );

      setRecentRequests(
        response.data.recentRequests || []
      );

    } catch (err) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem(
          "adminToken"
        );

        localStorage.removeItem(
          "admin"
        );

        navigate("/admin-login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "admin"
    );

    navigate("/admin-login", {
      replace: true,
    });
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // REQUEST STATUS
  // =====================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "status-approved";

      case "REJECTED":
        return "status-rejected";

      default:
        return "status-pending";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-loading-page">

        <div className="admin-loader"></div>

        <p>
          Loading administrator dashboard...
        </p>

        <style>{`
          .admin-loading-page {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f4f6fa;
            color: #5f6b80;
            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .admin-loader {
            width: 38px;
            height: 38px;
            border: 3px solid #dce2f0;
            border-top-color: #2f45a0;
            border-radius: 50%;
            animation:
              adminSpin 0.8s linear infinite;
          }

          .admin-loading-page p {
            margin-top: 15px;
            font-size: 13px;
          }

          @keyframes adminSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="admin-dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">

        <div className="admin-sidebar-top">

          {/* LOGO */}

          <div className="admin-logo-area">

            <div className="admin-logo">
              +
            </div>

            <div>
              <div className="admin-brand-name">
                Hemophilia Care
              </div>

              <div className="admin-brand-subtitle">
                ADMINISTRATION
              </div>
            </div>

          </div>

          {/* NAVIGATION */}

          <nav className="admin-navigation">

            <button
              className="admin-nav-item active"
              onClick={() =>
                navigate(
                  "/admin/dashboard"
                )
              }
            >
              <span className="nav-icon">
                ▦
              </span>

              <span>
                Dashboard
              </span>
            </button>

            <button
              className="admin-nav-item"
              onClick={() =>
                navigate(
                  "/admin/doctor-requests"
                )
              }
            >
              <span className="nav-icon">
                ◉
              </span>

              <span>
                Doctor Requests
              </span>

              {stats.pendingDoctorRequests >
                0 && (
                <span className="nav-count">
                  {
                    stats.pendingDoctorRequests
                  }
                </span>
              )}
            </button>

            <button
              className="admin-nav-item"
              onClick={() =>
                navigate(
                  "/admin/doctors"
                )
              }
            >
              <span className="nav-icon">
                ♙
              </span>

              <span>
                Doctors
              </span>
            </button>

            <button
              className="admin-nav-item"
              onClick={() => navigate("/admin/patient-research")}
            >
              <span className="nav-icon">⌕</span>
              <span>Patient Research</span>
            </button>

            {(admin.adminLevel === "SUPER_ADMIN" ||
              admin.permissions?.canManageAdmins) && (
              <button
                className="admin-nav-item"
                onClick={() => navigate("/admin-management")}
              >
                <span className="nav-icon">♙</span>
                <span>Admin Management</span>
              </button>
            )}

            <button
              className="admin-nav-item"
              onClick={() => navigate("/admin/profile")}
            >
              <span className="nav-icon">◌</span>
              <span>My Information</span>
            </button>

          </nav>

        </div>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-bottom">

          <div className="admin-sidebar-user">

            <div className="admin-avatar">
              {(
                admin.fullName ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-sidebar-user-info">


              <strong>
                {admin.fullName}
              </strong>

              

              <span>
                {admin.adminLevel === "SUPER_ADMIN"
                  ? "Super Admin"
                  : "Assistant Admin"}
              </span>

            </div>

          </div>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-topbar">

          <div className="admin-mobile-brand">

            <div className="admin-logo small">
              +
            </div>

            <span>
              Hemophilia Care
            </span>

          </div>

          <div className="admin-topbar-right">

            <div className="admin-top-user">

              {/* <div className="admin-avatar">
                {(
                  admin.fullName ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div> */}

              <div>
                {/* <strong>
                  {admin.fullName}
                </strong>

                <span>
                  {admin.adminLevel === "SUPER_ADMIN"
                  ? "Super Admin"
                  : "Assistant Admin"}
                </span> */}
              </div>

            </div>

            {/* <button
              className="topbar-logout"
              onClick={handleLogout}
            >
              Logout
            </button> */}

          </div>

        </header>

        {/* CONTENT */}

        <div className="admin-content">

          {/* PAGE HEADING */}

          <div className="admin-page-heading">

            <div>

              <div className="heading-eyebrow">
                ADMINISTRATION
              </div>

              <h1>
                Clinical Platform Overview
              </h1>

              <p>
                Monitor doctor registrations,
                platform access and clinical
                operations from one place.
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={fetchDashboard}
            >
              ↻ Refresh
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="dashboard-error">
              <span>!</span>

              <div>
                <strong>
                  Unable to load dashboard
                </strong>

                <p>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <section className="stats-grid">

            <div className="stat-card pending">

              <div className="stat-top">

                <div className="stat-icon">
                  ◷
                </div>

                <span className="stat-label">
                  NEEDS REVIEW
                </span>

              </div>

              <div className="stat-number">
                {
                  stats.pendingDoctorRequests ??
                  0
                }
              </div>

              <div className="stat-title">
                Pending Doctor Requests
              </div>

              <div className="stat-description">
                Registration requests waiting
                for administrator review.
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">

                <div className="stat-icon">
                  ♙
                </div>

                <span className="stat-label">
                  REGISTERED
                </span>

              </div>

              <div className="stat-number">
                {
                  stats.totalDoctors ??
                  0
                }
              </div>

              <div className="stat-title">
                Total Doctors
              </div>

              <div className="stat-description">
                Doctors currently registered
                on the platform.
              </div>

            </div>

            <div className="stat-card active-card">

              <div className="stat-top">

                <div className="stat-icon">
                  ✓
                </div>

                <span className="stat-label">
                  ACTIVE
                </span>

              </div>

              <div className="stat-number">
                {
                  stats.activeDoctors ??
                  0
                }
              </div>

              <div className="stat-title">
                Active Doctors
              </div>

              <div className="stat-description">
                Approved doctors with active
                platform access.
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">

                <div className="stat-icon">
                  ✓
                </div>

                <span className="stat-label">
                  TODAY
                </span>

              </div>

              <div className="stat-number">
                {
                  stats.approvedToday ??
                  0
                }
              </div>

              <div className="stat-title">
                Approved Today
              </div>

              <div className="stat-description">
                Doctor requests approved
                today.
              </div>

            </div>

          </section>

          {/* =================================================
              LOWER GRID
          ================================================= */}

          <section className="dashboard-grid">

            {/* REQUEST SUMMARY */}

            <div className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h2>
                    Doctor Request Summary
                  </h2>

                  <p>
                    Current registration
                    request status.
                  </p>

                </div>

                <button
                  className="card-link"
                  onClick={() =>
                    navigate(
                      "/admin/doctor-requests"
                    )
                  }
                >
                  View all →
                </button>

              </div>

              <div className="request-summary">

                <div className="summary-row">

                  <div className="summary-left">

                    <span className="summary-dot pending-dot"></span>

                    Pending

                  </div>

                  <strong>
                    {
                      stats.pendingDoctorRequests ??
                      0
                    }
                  </strong>

                </div>

                <div className="summary-row">

                  <div className="summary-left">

                    <span className="summary-dot approved-dot"></span>

                    Approved

                  </div>

                  <strong>
                    {
                      stats.approvedDoctorRequests ??
                      0
                    }
                  </strong>

                </div>

                <div className="summary-row">

                  <div className="summary-left">

                    <span className="summary-dot rejected-dot"></span>

                    Rejected

                  </div>

                  <strong>
                    {
                      stats.rejectedDoctorRequests ??
                      0
                    }
                  </strong>

                </div>

              </div>

            </div>

            {/* QUICK ACTIONS */}

            <div className="dashboard-card">

              <div className="card-heading">

                <div>

                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Frequently used
                    administrative tools.
                  </p>

                </div>

              </div>

              <div className="quick-actions">

                <button
                  onClick={() =>
                    navigate(
                      "/admin/doctor-requests"
                    )
                  }
                >
                  <span className="quick-icon">
                    ◉
                  </span>

                  <div>
                    <strong>
                      Review Doctor Requests
                    </strong>

                    <small>
                      Review pending
                      registrations
                    </small>
                  </div>

                  <span className="quick-arrow">
                    →
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/admin/doctors"
                    )
                  }
                >
                  <span className="quick-icon">
                    ♙
                  </span>

                  <div>
                    <strong>
                      Manage Doctors
                    </strong>

                    <small>
                      View registered
                      doctors
                    </small>
                  </div>

                  <span className="quick-arrow">
                    →
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/admin/patient-research"
                    )
                  }
                >
                  <span className="quick-icon">
                    ⌕
                  </span>

                  <div>
                    <strong>
                      Patient Research
                    </strong>

                    <small>
                      Search patient
                      clinical records
                    </small>
                  </div>

                  <span className="quick-arrow">
                    →
                  </span>
                </button>

              </div>

            </div>

          </section>

          {/* =================================================
              RECENT REQUESTS
          ================================================= */}

          <section className="dashboard-card recent-card">

            <div className="card-heading">

              <div>

                <h2>
                  Recent Doctor Requests
                </h2>

                <p>
                  Latest registration
                  activity.
                </p>

              </div>

              <button
                className="card-link"
                onClick={() =>
                  navigate(
                    "/admin/doctor-requests"
                  )
                }
              >
                Manage requests →
              </button>

            </div>

            {recentRequests.length ===
            0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ✓
                </div>

                <h3>
                  No doctor requests yet
                </h3>

                <p>
                  New doctor registration
                  requests will appear here
                  once submitted.
                </p>

              </div>

            ) : (

              <div className="requests-table-wrapper">

                <table className="requests-table">

                  <thead>

                    <tr>
                      <th>
                        Doctor
                      </th>

                      <th>
                        Specialization
                      </th>

                      <th>
                        Hospital
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Submitted
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {recentRequests.map(
                      (request, index) => (

                        <tr
                          key={
                            request._id ||
                            index
                          }
                        >

                          <td>

                            <div className="doctor-cell">

                              <div className="doctor-avatar">
                                {(
                                  request.fullName ||
                                  "D"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <strong>
                                  {
                                    request.fullName ||
                                    "Unknown Doctor"
                                  }
                                </strong>

                                <span>
                                  {
                                    request.email ||
                                    "—"
                                  }
                                </span>

                              </div>

                            </div>

                          </td>

                          <td>
                            {
                              request.specialization ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              request.hospitalName ||
                              "—"
                            }
                          </td>

                          <td>

                            <span
                              className={
                                `request-status ${
                                  getStatusClass(
                                    request.status
                                  )
                                }`
                              }
                            >
                              {
                                request.status ||
                                "PENDING"
                              }
                            </span>

                          </td>

                          <td>
                            {formatDate(
                              request.createdAt
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* FOOTER NOTE */}

          <div className="admin-privacy-note">

            <span>
              ⓘ
            </span>

            <p>
              Administrative access is restricted
              to authorized personnel. Patient
              clinical information should only be
              accessed when required for legitimate
              clinical or administrative purposes.
            </p>

          </div>

        </div>

      </main>

      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .admin-dashboard {
          min-height: 100vh;
          width: 100%;

          display: flex;

          background: #f4f6fa;

          color: #1a2336;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* =============================================
           SIDEBAR
           ============================================= */

        .admin-sidebar {
          position: fixed;

          left: 0;
          top: 0;
          bottom: 0;

          width: 245px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: 25px 16px;

          background: #ffffff;

          border-right:
            1px solid #e0e5ef;

          z-index: 20;
        }

        .admin-logo-area {
          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            4px 9px 28px;

          border-bottom:
            1px solid #edf0f5;
        }

        .admin-logo {
          width: 40px;
          height: 40px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #4165c5,
              #2c429b
            );

          color: #ffffff;

          font-size: 24px;
          font-weight: 500;

          box-shadow:
            0 6px 16px
            rgba(48,70,157,0.2);
        }

        .admin-brand-name {
          font-size: 14px;
          font-weight: 700;

          color: #24345f;
        }

        .admin-brand-subtitle {
          margin-top: 3px;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 1.2px;

          color: #8d97a9;
        }

        .admin-navigation {
          display: flex;
          flex-direction: column;

          gap: 6px;

          padding-top: 25px;
        }

        .admin-nav-item {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            11px 12px;

          border:
            1px solid transparent;

          border-radius: 9px;

          background: transparent;

          color: #667188;

          font-size: 13px;
          font-weight: 600;

          text-align: left;

          cursor: pointer;

          transition:
            all 0.15s ease;
        }

        .admin-nav-item:hover {
          background: #f1f4fb;
          color: #30469e;
        }

        .admin-nav-item.active {
          background: #eef1fb;

          border-color:
            #dce2f5;

          color: #293e96;
        }

        .nav-icon {
          width: 20px;

          text-align: center;

          font-size: 15px;
        }

        .nav-count {
          margin-left: auto;

          min-width: 21px;
          height: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #e8edf9;

          color: #30469e;

          font-size: 10px;
          font-weight: 700;
        }

        .admin-sidebar-bottom {
          border-top:
            1px solid #edf0f5;

          padding-top: 17px;
        }

        .admin-sidebar-user {
          display: flex;
          align-items: center;

          gap: 9px;

          padding:
            7px 8px 14px;
        }

        .admin-avatar {
          width: 33px;
          height: 33px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #eaf0ff;

          color: #30469e;

          font-size: 12px;
          font-weight: 700;
        }

        .admin-sidebar-user-info {
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .admin-sidebar-user-info strong {
          overflow: hidden;

          color: #29334a;

          font-size: 11.5px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .admin-sidebar-user-info span {
          margin-top: 2px;

          color: #8b94a6;

          font-size: 10px;
        }

        .sidebar-logout {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 9px;

          padding:
            10px 12px;

          border:
            1px solid #e0e4ec;

          border-radius: 8px;

          background: #ffffff;

          color: #687286;

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;

          transition:
            all 0.15s ease;
        }

        .sidebar-logout:hover {
          border-color: #e0a4a0;

          background: #fff6f5;

          color: #b33b35;
        }

        /* =============================================
           MAIN
           ============================================= */

        .admin-main {
          width: calc(100% - 245px);

          margin-left: 245px;

          min-height: 100vh;
        }

        .admin-topbar {
          height: 70px;

          display: flex;
          align-items: center;
          justify-content: flex-end;

          padding:
            0 38px;

          background: #ffffff;

          border-bottom:
            1px solid #e0e5ef;
        }

        .admin-topbar-right {
          display: flex;
          align-items: center;

          gap: 20px;
        }

        .admin-top-user {
          display: flex;
          align-items: center;

          gap: 9px;
        }

        .admin-top-user > div:last-child {
          display: flex;
          flex-direction: column;
        }

        .admin-top-user strong {
          color: #283249;

          font-size: 12px;
        }

        .admin-top-user span {
          margin-top: 2px;

          color: #8a94a7;

          font-size: 10px;
        }

        .topbar-logout {
          padding:
            8px 14px;

          border:
            1px solid #dce1eb;

          border-radius: 8px;

          background: #ffffff;

          color: #647087;

          font-size: 11.5px;
          font-weight: 600;

          cursor: pointer;
        }

        .topbar-logout:hover {
          background: #fff5f4;

          border-color: #e3b0ac;

          color: #ad3c35;
        }

        .admin-mobile-brand {
          display: none;
        }

        /* =============================================
           CONTENT
           ============================================= */

        .admin-content {
          width: 100%;

          max-width: 1400px;

          margin: 0 auto;

          padding:
            34px 38px 45px;
        }

        .admin-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 20px;

          margin-bottom: 27px;
        }

        .heading-eyebrow {
          margin-bottom: 8px;

          color: #4960ad;

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 1.5px;
        }

        .admin-page-heading h1 {
          margin: 0;

          color: #17213b;

          font-size:
            clamp(25px, 3vw, 32px);

          line-height: 1.2;

          letter-spacing: -0.7px;
        }

        .admin-page-heading p {
          margin:
            8px 0 0;

          color: #788399;

          font-size: 13px;

          line-height: 1.6;
        }

        .refresh-button {
          flex-shrink: 0;

          padding:
            9px 14px;

          border:
            1px solid #dce2ed;

          border-radius: 8px;

          background: #ffffff;

          color: #4255a0;

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .refresh-button:hover {
          background: #f1f4fb;

          border-color:
            #bdc8e6;
        }

        /* =============================================
           ERROR
           ============================================= */

        .dashboard-error {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-bottom: 20px;

          padding:
            13px 15px;

          border:
            1px solid #f0cfcb;

          border-radius: 10px;

          background: #fff6f5;

          color: #a83c36;
        }

        .dashboard-error > span {
          width: 21px;
          height: 21px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #f7deda;

          font-size: 11px;
          font-weight: 800;
        }

        .dashboard-error strong {
          font-size: 12px;
        }

        .dashboard-error p {
          margin: 3px 0 0;

          font-size: 11px;
        }

        /* =============================================
           STAT CARDS
           ============================================= */

        .stats-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 16px;

          margin-bottom: 20px;
        }

        .stat-card {
          min-width: 0;

          padding:
            19px;

          border:
            1px solid #dfe4ed;

          border-radius: 12px;

          background: #ffffff;

          box-shadow:
            0 3px 12px
            rgba(35,48,85,0.035);
        }

        .stat-card:hover {
          border-color: #cbd4e8;
        }

        .stat-card.pending {
          border-top:
            3px solid #667bc1;
        }

        .stat-card.active-card {
          border-top:
            3px solid #54a27e;
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .stat-icon {
          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #eef1fb;

          color: #3d53a1;

          font-size: 16px;
          font-weight: 600;
        }

        .stat-card.active-card .stat-icon {
          background: #edf8f2;

          color: #3b9169;
        }

        .stat-label {
          color: #9aa3b3;

          font-size: 8.5px;
          font-weight: 700;

          letter-spacing: 1px;
        }

        .stat-number {
          margin-top: 17px;

          color: #1d2943;

          font-size: 28px;
          font-weight: 700;

          letter-spacing: -0.7px;
        }

        .stat-title {
          margin-top: 3px;

          color: #39445a;

          font-size: 12px;
          font-weight: 650;
        }

        .stat-description {
          margin-top: 7px;

          color: #929bab;

          font-size: 10px;

          line-height: 1.45;
        }

        /* =============================================
           LOWER GRID
           ============================================= */

        .dashboard-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 0.85fr)
            minmax(0, 1.15fr);

          gap: 20px;

          margin-bottom: 20px;
        }

        .dashboard-card {
          min-width: 0;

          padding:
            21px;

          border:
            1px solid #dfe4ed;

          border-radius: 12px;

          background: #ffffff;

          box-shadow:
            0 3px 12px
            rgba(35,48,85,0.035);
        }

        .card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 15px;

          margin-bottom: 19px;
        }

        .card-heading h2 {
          margin: 0;

          color: #25304a;

          font-size: 14px;
          font-weight: 700;
        }

        .card-heading p {
          margin:
            5px 0 0;

          color: #929aaa;

          font-size: 10.5px;
        }

        .card-link {
          padding: 0;

          border: none;

          background: transparent;

          color: #4056a2;

          font-size: 10.5px;
          font-weight: 650;

          white-space: nowrap;

          cursor: pointer;
        }

        .card-link:hover {
          color: #243583;

          text-decoration: underline;
        }

        /* =============================================
           REQUEST SUMMARY
           ============================================= */

        .request-summary {
          display: flex;
          flex-direction: column;

          gap: 8px;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            12px 13px;

          border:
            1px solid #e5e9f0;

          border-radius: 8px;

          background: #fafbfc;

          color: #59657a;

          font-size: 11.5px;
        }

        .summary-left {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .summary-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;
        }

        .pending-dot {
          background: #6075bb;
        }

        .approved-dot {
          background: #55a57e;
        }

        .rejected-dot {
          background: #cc6862;
        }

        .summary-row strong {
          color: #28334b;

          font-size: 13px;
        }

        /* =============================================
           QUICK ACTIONS
           ============================================= */

        .quick-actions {
          display: flex;
          flex-direction: column;

          gap: 8px;
        }

        .quick-actions button {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            10px 11px;

          border:
            1px solid #e3e7ef;

          border-radius: 9px;

          background: #ffffff;

          color: #2e3950;

          text-align: left;

          cursor: pointer;

          transition:
            all 0.15s ease;
        }

        .quick-actions button:hover {
          background: #f7f8fc;

          border-color:
            #ccd5e9;
        }

        .quick-icon {
          width: 31px;
          height: 31px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #eef1fb;

          color: #3d53a1;

          font-size: 13px;
        }

        .quick-actions button > div {
          flex: 1;

          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .quick-actions strong {
          font-size: 11.5px;
        }

        .quick-actions small {
          margin-top: 2px;

          color: #929bab;

          font-size: 9.5px;
        }

        .quick-arrow {
          color: #8590a5;

          font-size: 14px;
        }

        /* =============================================
           RECENT REQUESTS
           ============================================= */

        .recent-card {
          margin-bottom: 20px;
        }

        .requests-table-wrapper {
          width: 100%;

          overflow-x: auto;
        }

        .requests-table {
          width: 100%;

          border-collapse: collapse;

          min-width: 720px;
        }

        .requests-table th {
          padding:
            9px 10px;

          border-bottom:
            1px solid #e5e9f0;

          color: #919aaa;

          font-size: 9px;
          font-weight: 700;

          text-align: left;

          letter-spacing: 0.5px;

          text-transform: uppercase;
        }

        .requests-table td {
          padding:
            12px 10px;

          border-bottom:
            1px solid #edf0f4;

          color: #5e697d;

          font-size: 10.5px;
        }

        .requests-table tbody tr:last-child td {
          border-bottom: none;
        }

        .doctor-cell {
          display: flex;
          align-items: center;

          gap: 9px;
        }

        .doctor-avatar {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #eef1fb;

          color: #3d53a1;

          font-size: 10px;
          font-weight: 700;
        }

        .doctor-cell > div:last-child {
          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .doctor-cell strong {
          color: #303a50;

          font-size: 10.5px;
        }

        .doctor-cell span {
          margin-top: 2px;

          color: #98a0af;

          font-size: 9px;
        }

        .request-status {
          display: inline-flex;
          align-items: center;

          padding:
            4px 8px;

          border-radius: 999px;

          font-size: 8.5px;
          font-weight: 700;

          letter-spacing: 0.3px;
        }

        .status-pending {
          background: #f0f3fc;

          color: #5368ac;
        }

        .status-approved {
          background: #edf8f2;

          color: #3c9168;
        }

        .status-rejected {
          background: #fff0ef;

          color: #b5524c;
        }

        /* =============================================
           EMPTY STATE
           ============================================= */

        .empty-state {
          min-height: 170px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          padding: 20px;

          border:
            1px dashed #dce2ec;

          border-radius: 9px;

          background: #fafbfc;

          text-align: center;
        }

        .empty-icon {
          width: 35px;
          height: 35px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 9px;

          border-radius: 50%;

          background: #edf8f2;

          color: #45986e;

          font-size: 14px;
          font-weight: 700;
        }

        .empty-state h3 {
          margin: 0;

          color: #48536a;

          font-size: 12px;
        }

        .empty-state p {
          max-width: 330px;

          margin:
            6px 0 0;

          color: #98a1b0;

          font-size: 10px;

          line-height: 1.5;
        }

        /* =============================================
           PRIVACY NOTE
           ============================================= */

        .admin-privacy-note {
          display: flex;
          align-items: flex-start;

          gap: 9px;

          padding:
            12px 14px;

          border:
            1px solid #cde5e7;

          border-radius: 9px;

          background: #eefafa;

          color: #547d82;
        }

        .admin-privacy-note > span {
          color: #4d9298;

          font-size: 13px;
        }

        .admin-privacy-note p {
          margin: 0;

          font-size: 9.5px;

          line-height: 1.55;
        }

        /* =============================================
           TABLET
           ============================================= */

        @media (max-width: 1050px) {

          .admin-sidebar {
            width: 215px;
          }

          .admin-main {
            width: calc(100% - 215px);

            margin-left: 215px;
          }

          .admin-content {
            padding:
              30px 25px 40px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        /* =============================================
           MOBILE
           ============================================= */

        @media (max-width: 760px) {

          .admin-dashboard {
            display: block;
          }

          .admin-sidebar {
            display: none;
          }

          .admin-main {
            width: 100%;

            margin-left: 0;
          }

          .admin-topbar {
            height: 64px;

            justify-content:
              space-between;

            padding:
              0 16px;
          }

          .admin-mobile-brand {
            display: flex;
            align-items: center;

            gap: 8px;

            color: #26365f;

            font-size: 13px;
            font-weight: 700;
          }

          .admin-logo.small {
            width: 33px;
            height: 33px;

            border-radius: 9px;

            font-size: 19px;
          }

          .admin-top-user {
            display: none;
          }

          .admin-topbar-right {
            margin-left: auto;
          }

          .topbar-logout {
            padding:
              7px 11px;

            font-size: 10px;
          }

          .admin-content {
            padding:
              24px 15px 30px;
          }

          .admin-page-heading {
            align-items: flex-start;

            flex-direction: column;

            margin-bottom: 20px;
          }

          .admin-page-heading h1 {
            font-size: 25px;
          }

          .admin-page-heading p {
            font-size: 12px;
          }

          .refresh-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns:
              1fr 1fr;

            gap: 10px;
          }

          .stat-card {
            padding: 14px;
          }

          .stat-number {
            font-size: 24px;
          }

          .stat-title {
            font-size: 11px;
          }

          .stat-description {
            font-size: 9px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;

            gap: 12px;
          }

          .dashboard-card {
            padding: 16px;
          }

          .card-heading h2 {
            font-size: 13px;
          }

          .recent-card {
            overflow: hidden;
          }

          .requests-table-wrapper {
            margin:
              0 -5px;
          }

          .admin-privacy-note {
            padding: 11px;
          }

        }

        /* =============================================
           SMALL MOBILE
           ============================================= */

        @media (max-width: 430px) {

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 16px;
          }

          .admin-page-heading h1 {
            font-size: 23px;
          }

          .card-heading {
            flex-direction: column;
          }

          .card-link {
            align-self: flex-start;
          }

        }

      `}</style>

    </div>
  );
};

export default AdminDashboard;
