import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const AdminDoctorRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // =========================================================
  // FETCH PENDING DOCTOR REQUESTS
  // =========================================================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.get("/admin/doctor-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(response.data?.requests || []);
    } catch (err) {
      console.error("Error fetching doctor requests:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/admin-login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load doctor registration requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin-login");
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================
  const filteredRequests = requests.filter((request) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      request.fullName?.toLowerCase().includes(searchText) ||
      request.email?.toLowerCase().includes(searchText) ||
      request.specialization?.toLowerCase().includes(searchText) ||
      request.hospital?.toLowerCase().includes(searchText) ||
      request.professionalId?.toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "ALL" ||
      request.status?.toUpperCase() === filter.toUpperCase();

    return matchesSearch && matchesFilter;
  });

  // =========================================================
  // DATE FORMAT
  // =========================================================
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================
  const getStatusClass = (status) => {
    const normalized = status?.toUpperCase();

    if (normalized === "APPROVED") return "status-approved";
    if (normalized === "REJECTED") return "status-rejected";

    return "status-pending";
  };

  // =========================================================
  // ADMIN INFO
  // =========================================================
  let adminName = "Administrator";

  try {
    const storedAdmin = localStorage.getItem("admin");

    if (storedAdmin) {
      const parsedAdmin = JSON.parse(storedAdmin);

      adminName =
        parsedAdmin?.name ||
        parsedAdmin?.fullName ||
        parsedAdmin?.email ||
        "Administrator";
    }
  } catch (err) {
    console.error("Unable to read admin information:", err);
  }

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="admin-page">
          <aside className="admin-sidebar">
            <div className="brand-section">
              <div className="brand-logo">HC</div>

              <div className="brand-text">
                <h2>Hemophilia Care</h2>
                <p>Clinical Platform</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button
                className="nav-item"
                onClick={() => navigate("/admin/dashboard")}
              >
                <span className="nav-icon">▦</span>
                <span>Dashboard</span>
              </button>

              <button className="nav-item active">
                <span className="nav-icon">♙</span>
                <span>Doctor Requests</span>
              </button>

              <button
                className="nav-item"
                onClick={() => navigate("/admin/doctors")}
              >
                <span className="nav-icon">♟</span>
                <span>Doctors</span>
              </button>

              <button
                className="nav-item"
                onClick={() => navigate("/admin/patient-research")}
              >
                <span className="nav-icon">⌕</span>
                <span>Patient Research</span>
              </button>
            </nav>

            <div className="sidebar-bottom">
              <div className="admin-profile">
                <div className="admin-avatar">
                  {adminName.charAt(0).toUpperCase()}
                </div>

                <div className="admin-profile-text">
                  <strong>{adminName}</strong>
                  <span>Administrator</span>
                </div>
              </div>

              <button className="logout-button" onClick={handleLogout}>
                <span>↪</span>
                Logout
              </button>
            </div>
          </aside>

          <main className="admin-main">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading doctor requests...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================
  return (
    <>
      <style>{styles}</style>

      <div className="admin-page">
        {/* =====================================================
            SIDEBAR
        ====================================================== */}
        <aside className="admin-sidebar">
          <div className="brand-section">
            <div className="brand-logo">HC</div>

            <div className="brand-text">
              <h2>Hemophilia Care</h2>
              <p>Clinical Platform</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className="nav-item"
              onClick={() => navigate("/admin/dashboard")}
            >
              <span className="nav-icon">▦</span>
              <span>Dashboard</span>
            </button>

            <button
              className="nav-item active"
              onClick={() => navigate("/admin/doctor-requests")}
            >
              <span className="nav-icon">♙</span>
              <span>Doctor Requests</span>

              {requests.length > 0 && (
                <span className="nav-badge">{requests.length}</span>
              )}
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/admin/doctors")}
            >
              <span className="nav-icon">♟</span>
              <span>Doctors</span>
            </button>

            <button
              className="nav-item"
              onClick={() => navigate("/admin/patient-research")}
            >
              <span className="nav-icon">⌕</span>
              <span>Patient Research</span>
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="admin-profile">
              <div className="admin-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="admin-profile-text">
                <strong>{adminName}</strong>
                <span>Administrator</span>
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              <span>↪</span>
              Logout
            </button>
          </div>
        </aside>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}
        <main className="admin-main">
          {/* TOP HEADER */}
          <header className="page-header">
            <div>
              <div className="breadcrumb">
                Admin <span>/</span> Doctor Requests
              </div>

              <h1>Doctor Registration Requests</h1>

              <p>
                Review and manage doctor registration applications submitted
                to the platform.
              </p>
            </div>

            <button className="refresh-button" onClick={fetchRequests}>
              <span>↻</span>
              Refresh
            </button>
          </header>

          {/* ERROR */}
          {error && (
            <div className="error-alert">
              <div className="alert-icon">!</div>

              <div>
                <strong>Unable to load requests</strong>
                <p>{error}</p>
              </div>

              <button onClick={fetchRequests}>Try Again</button>
            </div>
          )}

          {/* ===================================================
              SUMMARY CARDS
          ==================================================== */}
          <section className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon blue-icon">♙</div>

              <div>
                <span className="summary-label">Pending Requests</span>
                <strong className="summary-number">
                  {requests.length}
                </strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon purple-icon">⌕</div>

              <div>
                <span className="summary-label">Showing</span>
                <strong className="summary-number">
                  {filteredRequests.length}
                </strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon green-icon">✓</div>

              <div>
                <span className="summary-label">Status</span>
                <strong className="summary-status">Needs Review</strong>
              </div>
            </div>
          </section>

          {/* ===================================================
              REQUESTS CARD
          ==================================================== */}
          <section className="requests-card">
            <div className="card-header">
              <div>
                <h2>Pending Applications</h2>
                <p>
                  Doctors waiting for administrator verification and approval.
                </p>
              </div>

              <div className="card-count">
                {requests.length}{" "}
                {requests.length === 1 ? "Application" : "Applications"}
              </div>
            </div>

            {/* SEARCH / FILTER */}
            <div className="toolbar">
              <div className="search-wrapper">
                <span className="search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search by name, email, specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button
                    className="clear-search"
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">All Requests</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* =================================================
                EMPTY STATE
            ================================================== */}
            {filteredRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>

                {requests.length === 0 ? (
                  <>
                    <h3>No pending doctor requests</h3>
                    <p>
                      There are currently no doctor registration applications
                      waiting for review.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>No matching requests</h3>
                    <p>
                      Try changing your search text or filter to find an
                      application.
                    </p>

                    <button
                      className="reset-button"
                      onClick={() => {
                        setSearch("");
                        setFilter("ALL");
                      }}
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* =================================================
                    DESKTOP TABLE
                ================================================== */}
                <div className="table-wrapper">
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialization</th>
                        <th>Hospital / Organization</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <div className="doctor-cell">
                              <div className="doctor-avatar">
                                {request.fullName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "D"}
                              </div>

                              <div className="doctor-info">
                                <strong>
                                  {request.fullName || "Unknown Doctor"}
                                </strong>

                                <span>{request.email || "—"}</span>

                                {request.professionalId && (
                                  <small>
                                    ID: {request.professionalId}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="specialization-text">
                              {request.specialization || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="hospital-text">
                              {request.hospital || "—"}
                            </span>
                          </td>

                          <td>
                            <span className="date-text">
                              {formatDate(request.createdAt)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-pill ${getStatusClass(
                                request.status
                              )}`}
                            >
                              <span className="status-dot"></span>
                              {request.status || "PENDING"}
                            </span>
                          </td>

                          <td>
                            <button
                              className="view-button"
                              onClick={() =>
                                navigate(
                                  `/admin/doctor-requests/${request._id}`
                                )
                              }
                            >
                              View Application
                              <span>→</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* =================================================
                    MOBILE CARDS
                ================================================== */}
                <div className="mobile-request-list">
                  {filteredRequests.map((request) => (
                    <div className="mobile-request-card" key={request._id}>
                      <div className="mobile-card-top">
                        <div className="doctor-cell">
                          <div className="doctor-avatar">
                            {request.fullName
                              ?.charAt(0)
                              ?.toUpperCase() || "D"}
                          </div>

                          <div className="doctor-info">
                            <strong>
                              {request.fullName || "Unknown Doctor"}
                            </strong>

                            <span>{request.email || "—"}</span>
                          </div>
                        </div>

                        <span
                          className={`status-pill ${getStatusClass(
                            request.status
                          )}`}
                        >
                          <span className="status-dot"></span>
                          {request.status || "PENDING"}
                        </span>
                      </div>

                      <div className="mobile-details">
                        <div className="mobile-detail">
                          <span>Specialization</span>
                          <strong>
                            {request.specialization || "—"}
                          </strong>
                        </div>

                        <div className="mobile-detail">
                          <span>Hospital / Organization</span>
                          <strong>{request.hospital || "—"}</strong>
                        </div>

                        <div className="mobile-detail">
                          <span>Submitted</span>
                          <strong>
                            {formatDate(request.createdAt)}
                          </strong>
                        </div>

                        {request.professionalId && (
                          <div className="mobile-detail">
                            <span>Professional ID</span>
                            <strong>{request.professionalId}</strong>
                          </div>
                        )}
                      </div>

                      <button
                        className="mobile-view-button"
                        onClick={() =>
                          navigate(
                            `/admin/doctor-requests/${request._id}`
                          )
                        }
                      >
                        View Application
                        <span>→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

// =============================================================
// STYLES
// =============================================================

const styles = `
  * {
    box-sizing: border-box;
  }

  .admin-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    background: #f4f6fa;
    color: #1f2937;
    font-family:
      Inter,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif;
  }

  /* =========================================================
     SIDEBAR
  ========================================================== */

  .admin-sidebar {
    width: 245px;
    min-width: 245px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    background: #ffffff;
    border-right: 1px solid #e7eaf0;
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  .brand-section {
    height: 86px;
    display: flex;
    align-items: center;
    padding: 0 22px;
    border-bottom: 1px solid #eef0f4;
  }

  .brand-logo {
    width: 43px;
    height: 43px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 15px;
    font-weight: 800;
    box-shadow: 0 5px 14px rgba(37, 99, 235, 0.22);
    flex-shrink: 0;
  }

  .brand-text {
    margin-left: 11px;
    min-width: 0;
  }

  .brand-text h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 750;
    color: #172033;
    white-space: nowrap;
  }

  .brand-text p {
    margin: 3px 0 0;
    color: #8a93a5;
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
  }

  .sidebar-nav {
    padding: 22px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .nav-item {
    width: 100%;
    border: none;
    background: transparent;
    color: #697386;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 12px 13px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
    position: relative;
  }

  .nav-item:hover {
    background: #f5f7ff;
    color: #315fcb;
  }

  .nav-item.active {
    background: #eef3ff;
    color: #2d5dcc;
  }

  .nav-icon {
    width: 25px;
    margin-right: 8px;
    font-size: 18px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav-badge {
    margin-left: auto;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 11px;
    background: #e53935;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
  }

  .sidebar-bottom {
    margin-top: auto;
    padding: 15px 13px 18px;
    border-top: 1px solid #eef0f4;
  }

  .admin-profile {
    display: flex;
    align-items: center;
    padding: 5px 5px 13px;
  }

  .admin-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #eef3ff;
    color: #315fcb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    flex-shrink: 0;
  }

  .admin-profile-text {
    margin-left: 9px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .admin-profile-text strong {
    font-size: 11px;
    color: #303847;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160px;
  }

  .admin-profile-text span {
    font-size: 9px;
    color: #929aaa;
    margin-top: 2px;
  }

  .logout-button {
    width: 100%;
    border: none;
    background: #f8f9fb;
    color: #70798a;
    border-radius: 8px;
    padding: 9px 11px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .logout-button:hover {
    background: #fff0f0;
    color: #d13b3b;
  }

  /* =========================================================
     MAIN
  ========================================================== */

  .admin-main {
    margin-left: 245px;
    width: calc(100% - 245px);
    min-height: 100vh;
    padding: 30px 34px 45px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 25px;
  }

  .breadcrumb {
    color: #929aaa;
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 7px;
  }

  .breadcrumb span {
    padding: 0 6px;
    color: #c3c8d1;
  }

  .page-header h1 {
    margin: 0;
    color: #202838;
    font-size: 25px;
    font-weight: 750;
    letter-spacing: -0.4px;
  }

  .page-header p {
    margin: 7px 0 0;
    color: #858e9f;
    font-size: 12px;
    line-height: 1.6;
  }

  .refresh-button {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #445066;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 650;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: 0.2s ease;
    box-shadow: 0 2px 7px rgba(20, 30, 50, 0.025);
  }

  .refresh-button:hover {
    border-color: #c5d2f5;
    color: #315fcb;
    background: #f9faff;
  }

  .refresh-button span {
    font-size: 16px;
  }

  /* =========================================================
     ERROR
  ========================================================== */

  .error-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 15px;
    background: #fff5f5;
    border: 1px solid #ffdada;
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .alert-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }

  .error-alert strong {
    display: block;
    font-size: 12px;
    color: #b42318;
  }

  .error-alert p {
    margin: 3px 0 0;
    color: #9b5757;
    font-size: 10px;
  }

  .error-alert button {
    margin-left: auto;
    border: none;
    background: #dc2626;
    color: white;
    padding: 8px 12px;
    border-radius: 7px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  /* =========================================================
     SUMMARY
  ========================================================== */

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 22px;
  }

  .summary-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    padding: 17px;
    display: flex;
    align-items: center;
    min-height: 82px;
    box-shadow: 0 2px 9px rgba(20, 30, 50, 0.025);
  }

  .summary-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-right: 12px;
  }

  .blue-icon {
    background: #edf3ff;
    color: #3266d5;
  }

  .purple-icon {
    background: #f1edff;
    color: #7056ce;
  }

  .green-icon {
    background: #eaf9f0;
    color: #219653;
  }

  .summary-label {
    display: block;
    color: #8c95a5;
    font-size: 10px;
    font-weight: 550;
    margin-bottom: 3px;
  }

  .summary-number {
    display: block;
    color: #202838;
    font-size: 20px;
    font-weight: 750;
  }

  .summary-status {
    display: block;
    color: #d97706;
    font-size: 13px;
    font-weight: 750;
    margin-top: 4px;
  }

  /* =========================================================
     REQUESTS CARD
  ========================================================== */

  .requests-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    box-shadow: 0 2px 10px rgba(20, 30, 50, 0.025);
    overflow: hidden;
  }

  .card-header {
    padding: 20px 21px 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    border-bottom: 1px solid #edf0f4;
  }

  .card-header h2 {
    margin: 0;
    color: #252d3d;
    font-size: 15px;
    font-weight: 750;
  }

  .card-header p {
    margin: 5px 0 0;
    color: #9098a7;
    font-size: 10px;
  }

  .card-count {
    background: #f1f4fb;
    color: #657087;
    padding: 7px 10px;
    border-radius: 7px;
    font-size: 10px;
    font-weight: 650;
    white-space: nowrap;
  }

  /* =========================================================
     TOOLBAR
  ========================================================== */

  .toolbar {
    padding: 14px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid #edf0f4;
    background: #fcfdff;
  }

  .search-wrapper {
    position: relative;
    width: 380px;
    max-width: 100%;
  }

  .search-wrapper input {
    width: 100%;
    height: 38px;
    border: 1px solid #e0e4eb;
    border-radius: 8px;
    background: #ffffff;
    padding: 0 34px 0 35px;
    outline: none;
    color: #354052;
    font-size: 11px;
    transition: 0.2s ease;
  }

  .search-wrapper input::placeholder {
    color: #a5acb8;
  }

  .search-wrapper input:focus {
    border-color: #9bb5f1;
    box-shadow: 0 0 0 3px rgba(49, 95, 203, 0.07);
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #8993a4;
    font-size: 17px;
    z-index: 2;
  }

  .clear-search {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 23px;
    height: 23px;
    border: none;
    border-radius: 50%;
    background: #f0f2f6;
    color: #7b8494;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  }

  .filter-select {
    height: 38px;
    min-width: 135px;
    border: 1px solid #e0e4eb;
    border-radius: 8px;
    background: #ffffff;
    padding: 0 11px;
    color: #586276;
    outline: none;
    font-size: 11px;
    cursor: pointer;
  }

  .filter-select:focus {
    border-color: #9bb5f1;
  }

  /* =========================================================
     TABLE
  ========================================================== */

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .requests-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }

  .requests-table th {
    text-align: left;
    padding: 12px 18px;
    background: #fafbfc;
    color: #8992a2;
    border-bottom: 1px solid #edf0f4;
    font-size: 9px;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.45px;
    white-space: nowrap;
  }

  .requests-table td {
    padding: 14px 18px;
    border-bottom: 1px solid #f0f2f5;
    vertical-align: middle;
  }

  .requests-table tbody tr {
    transition: background 0.15s ease;
  }

  .requests-table tbody tr:hover {
    background: #fbfcff;
  }

  .requests-table tbody tr:last-child td {
    border-bottom: none;
  }

  /* =========================================================
     DOCTOR CELL
  ========================================================== */

  .doctor-cell {
    display: flex;
    align-items: center;
    min-width: 205px;
  }

  .doctor-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #edf3ff, #e5eaff);
    color: #315fcb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .doctor-info {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .doctor-info strong {
    color: #303847;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .doctor-info span {
    color: #8e97a6;
    font-size: 9px;
    margin-top: 3px;
    white-space: nowrap;
  }

  .doctor-info small {
    color: #a2a9b5;
    font-size: 8px;
    margin-top: 2px;
  }

  .specialization-text,
  .hospital-text,
  .date-text {
    color: #626d7e;
    font-size: 10px;
    line-height: 1.4;
  }

  .hospital-text {
    max-width: 170px;
    display: block;
  }

  /* =========================================================
     STATUS
  ========================================================== */

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 20px;
    font-size: 8px;
    font-weight: 750;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .status-pending {
    color: #b76a00;
    background: #fff7e6;
  }

  .status-approved {
    color: #168044;
    background: #eaf8ef;
  }

  .status-rejected {
    color: #c53030;
    background: #fff0f0;
  }

  /* =========================================================
     VIEW BUTTON
  ========================================================== */

  .view-button {
    border: 1px solid #dbe3f7;
    background: #f7f9ff;
    color: #315fcb;
    border-radius: 7px;
    padding: 8px 10px;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    transition: 0.2s ease;
  }

  .view-button:hover {
    background: #edf3ff;
    border-color: #c9d7f5;
    transform: translateY(-1px);
  }

  .view-button span {
    font-size: 13px;
  }

  /* =========================================================
     EMPTY STATE
  ========================================================== */

  .empty-state {
    padding: 65px 25px;
    text-align: center;
  }

  .empty-icon {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    margin: 0 auto 14px;
    background: #eaf8ef;
    color: #249455;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 23px;
    font-weight: 800;
  }

  .empty-state h3 {
    margin: 0;
    color: #303847;
    font-size: 14px;
    font-weight: 750;
  }

  .empty-state p {
    max-width: 420px;
    margin: 7px auto 0;
    color: #929aaa;
    font-size: 10px;
    line-height: 1.6;
  }

  .reset-button {
    margin-top: 15px;
    border: 1px solid #dce3f2;
    background: #f7f9ff;
    color: #315fcb;
    border-radius: 7px;
    padding: 8px 13px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  /* =========================================================
     MOBILE REQUEST CARDS
  ========================================================== */

  .mobile-request-list {
    display: none;
  }

  /* =========================================================
     LOADING
  ========================================================== */

  .loading-container {
    min-height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .loading-container p {
    margin-top: 13px;
    color: #8790a0;
    font-size: 11px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e9f1;
    border-top-color: #315fcb;
    border-radius: 50%;
    animation: adminSpin 0.8s linear infinite;
  }

  @keyframes adminSpin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =========================================================
     TABLET
  ========================================================== */

  @media (max-width: 1000px) {
    .admin-main {
      padding: 25px 22px 40px;
    }

    .summary-grid {
      gap: 10px;
    }

    .summary-card {
      padding: 14px;
    }

    .requests-table th,
    .requests-table td {
      padding-left: 13px;
      padding-right: 13px;
    }
  }

  /* =========================================================
     MOBILE
  ========================================================== */

  @media (max-width: 760px) {
    .admin-page {
      display: block;
    }

    .admin-sidebar {
      position: relative;
      width: 100%;
      min-width: 0;
      height: auto;
      border-right: none;
      border-bottom: 1px solid #e7eaf0;
    }

    .brand-section {
      height: 70px;
      padding: 0 17px;
    }

    .brand-logo {
      width: 39px;
      height: 39px;
      border-radius: 10px;
    }

    .brand-text h2 {
      font-size: 14px;
    }

    .brand-text p {
      font-size: 9px;
    }

    .sidebar-nav {
      padding: 9px 10px 11px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
    }

    .nav-item {
      padding: 10px 9px;
      font-size: 10px;
    }

    .nav-icon {
      width: 21px;
      margin-right: 5px;
      font-size: 15px;
    }

    .nav-badge {
      min-width: 18px;
      height: 18px;
      font-size: 8px;
    }

    .sidebar-bottom {
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .admin-profile {
      padding: 0;
      flex: 1;
      min-width: 0;
    }

    .logout-button {
      width: auto;
      padding: 8px 11px;
      flex-shrink: 0;
    }

    .admin-main {
      margin-left: 0;
      width: 100%;
      padding: 20px 13px 35px;
    }

    .page-header {
      flex-direction: column;
      margin-bottom: 18px;
      gap: 12px;
    }

    .page-header h1 {
      font-size: 21px;
    }

    .page-header p {
      font-size: 10px;
    }

    .refresh-button {
      width: 100%;
      justify-content: center;
    }

    .summary-grid {
      grid-template-columns: 1fr;
      gap: 9px;
      margin-bottom: 15px;
    }

    .summary-card {
      min-height: 70px;
    }

    .card-header {
      padding: 16px 14px;
      align-items: flex-start;
    }

    .card-header h2 {
      font-size: 13px;
    }

    .card-header p {
      line-height: 1.5;
    }

    .card-count {
      font-size: 8px;
      padding: 6px 8px;
    }

    .toolbar {
      padding: 11px 13px;
      flex-direction: column;
      align-items: stretch;
    }

    .search-wrapper {
      width: 100%;
    }

    .filter-select {
      width: 100%;
    }

    .table-wrapper {
      display: none;
    }

    .mobile-request-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      background: #fafbfc;
    }

    .mobile-request-card {
      background: #ffffff;
      border: 1px solid #e7eaf0;
      border-radius: 10px;
      padding: 14px;
      box-shadow: 0 2px 7px rgba(20, 30, 50, 0.025);
    }

    .mobile-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .mobile-card-top .doctor-cell {
      min-width: 0;
      flex: 1;
    }

    .mobile-card-top .doctor-info {
      min-width: 0;
    }

    .mobile-card-top .doctor-info strong,
    .mobile-card-top .doctor-info span {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .mobile-details {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #eef0f4;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .mobile-detail {
      min-width: 0;
    }

    .mobile-detail span {
      display: block;
      color: #9aa2af;
      font-size: 8px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .mobile-detail strong {
      display: block;
      color: #596476;
      font-size: 9px;
      font-weight: 650;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    .mobile-view-button {
      width: 100%;
      margin-top: 14px;
      height: 37px;
      border: 1px solid #dbe3f7;
      background: #f7f9ff;
      color: #315fcb;
      border-radius: 7px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }

    .mobile-view-button span {
      font-size: 13px;
    }

    .empty-state {
      padding: 45px 18px;
    }

    .error-alert {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .error-alert button {
      margin-left: 42px;
    }
  }

  /* =========================================================
     SMALL MOBILE
  ========================================================== */

  @media (max-width: 420px) {
    .sidebar-nav {
      grid-template-columns: 1fr 1fr;
    }

    .nav-item {
      font-size: 9px;
      padding: 9px 7px;
    }

    .nav-icon {
      font-size: 14px;
      width: 18px;
    }

    .admin-main {
      padding-left: 10px;
      padding-right: 10px;
    }

    .page-header h1 {
      font-size: 19px;
    }

    .mobile-details {
      grid-template-columns: 1fr;
      gap: 9px;
    }

    .mobile-card-top {
      align-items: flex-start;
    }

    .status-pill {
      font-size: 7px;
      padding: 4px 6px;
    }
  }
`;

export default AdminDoctorRequests;