
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../apiClient";

const AdminDoctorRequestDetails = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");

  // =========================================================
  // FETCH REQUEST DETAILS
  // =========================================================

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.get(
        `/admin/doctor-requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRequest(response.data?.request || response.data);
    } catch (err) {
      console.error("Error fetching doctor request:", err);

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
          "Unable to load this doctor registration request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin-login");
  };

  // =========================================================
  // APPROVE DOCTOR
  // =========================================================

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.post(
        `/admin/doctor-requests/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowApproveModal(false);

      setSuccess(
        response.data?.message ||
          "Doctor registration request approved successfully."
      );

      await fetchRequest();
    } catch (err) {
      console.error("Error approving doctor:", err);

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
          "Unable to approve this doctor registration request."
      );

      setShowApproveModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // REJECT DOCTOR
  // =========================================================

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      setError("Please enter a reason for rejecting the application.");
      return;
    }

    if (reason.length < 5) {
      setError("Please provide a more detailed rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.post(
        `/admin/doctor-requests/${requestId}/reject`,
        {
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowRejectModal(false);
      setRejectionReason("");

      setSuccess(
        response.data?.message ||
          "Doctor registration request rejected successfully."
      );

      await fetchRequest();
    } catch (err) {
      console.error("Error rejecting doctor:", err);

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
          "Unable to reject this doctor registration request."
      );

      setShowRejectModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // VIEW CERTIFICATE
  // =========================================================

  const handleViewCertificate = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.get(
        `/admin/doctor-requests/${requestId}/certificate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] || "application/pdf";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      console.error("Error opening certificate:", err);

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
          "Unable to open the certificate."
      );
    }
  };

  // =========================================================
  // VIEW PROFESSIONAL ID
  // =========================================================

  const handleViewProfessionalId = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin-login");
        return;
      }

      const response = await api.get(
        `/admin/doctor-requests/${requestId}/professional-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] || "application/pdf";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      console.error("Error opening professional ID:", err);

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
          "Unable to open the professional ID."
      );
    }
  };

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
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // SAFE VALUE HELPER
  // =========================================================

  const displayValue = (value) => {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return "—";
    }

    return value;
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    const normalized = status?.toUpperCase();

    if (normalized === "APPROVED") {
      return "status-approved";
    }

    if (normalized === "REJECTED") {
      return "status-rejected";
    }

    return "status-pending";
  };

  // =========================================================
  // ADMIN NAME
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
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="admin-page">
          <AdminSidebar
            navigate={navigate}
            adminName={adminName}
            handleLogout={handleLogout}
          />

          <main className="admin-main">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading doctor application...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <>
      <style>{styles}</style>

      <div className="admin-page">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <AdminSidebar
          navigate={navigate}
          adminName={adminName}
          handleLogout={handleLogout}
        />

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="admin-main">

          {/* HEADER */}

          <header className="page-header">
            <div>
              <div className="breadcrumb">
                Admin
                <span>/</span>
                Doctor Requests
                <span>/</span>
                Application Details
              </div>

              <h1>Doctor Application Details</h1>

              <p>
                Review the submitted information and verify the
                doctor's registration application.
              </p>
            </div>

            <button
              className="back-button"
              onClick={() =>
                navigate("/admin/doctor-requests")
              }
            >
              <span>←</span>
              Back to Requests
            </button>
          </header>

          {/* SUCCESS MESSAGE */}

          {success && (
            <div className="success-alert">
              <div className="alert-icon success-icon">
                ✓
              </div>

              <div>
                <strong>Success</strong>
                <p>{success}</p>
              </div>

              <button onClick={() => setSuccess("")}>
                ×
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="error-alert">
              <div className="alert-icon error-icon">
                !
              </div>

              <div>
                <strong>
                  Action could not be completed
                </strong>

                <p>{error}</p>
              </div>

              <button onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {!request ? (
            <div className="not-found-card">
              <div className="not-found-icon">
                !
              </div>

              <h2>Application not found</h2>

              <p>
                This doctor registration request could not
                be found.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/admin/doctor-requests")
                }
              >
                Back to Requests
              </button>
            </div>
          ) : (
            <>
              {/* =================================================
                  APPLICATION STATUS
              ================================================== */}

              <section className="status-banner">
                <div className="status-banner-left">

                  <div className="large-doctor-avatar">
                    {request.fullName
                      ?.charAt(0)
                      ?.toUpperCase() || "D"}
                  </div>

                  <div>
                    <span className="application-label">
                      Doctor Registration Application
                    </span>

                    <h2>
                      {request.fullName ||
                        "Unknown Doctor"}
                    </h2>

                    <p>
                      Submitted on{" "}
                      {formatDateTime(
                        request.createdAt
                      )}
                    </p>
                  </div>

                </div>

                <div
                  className={`large-status ${getStatusClass(
                    request.status
                  )}`}
                >
                  <span className="status-dot"></span>

                  {request.status || "PENDING"}
                </div>
              </section>

              {/* =================================================
                  PROFESSIONAL INFORMATION
              ================================================== */}

              <section className="details-card">

                <div className="section-heading">
                  <div>
                    <h2>
                      Professional Information
                    </h2>

                    <p>
                      Information provided by the doctor
                      during registration.
                    </p>
                  </div>
                </div>

                <div className="details-grid">

                  {/* ROW 1 */}

                  <InfoItem
                    label="Full Name"
                    value={displayValue(
                      request.fullName
                    )}
                  />

                  <InfoItem
                    label="Email Address"
                    value={displayValue(
                      request.email
                    )}
                  />

                  <InfoItem
                    label="Mobile Number"
                    value={displayValue(
                      request.mobileNumber ||
                        request.mobile ||
                        request.phone
                    )}
                  />

                  {/* ROW 2 */}

                  <InfoItem
                    label="Medical Registration Number"
                    value={displayValue(
                      request.medicalRegistrationNumber ||
                        request.professionalRegistrationNumber
                    )}
                  />

                  <InfoItem
                    label="Medical Council"
                    value={displayValue(
                      request.medicalCouncil
                    )}
                  />

                  <InfoItem
                    label="Qualification"
                    value={displayValue(
                      request.qualification
                    )}
                  />

                  {/* ROW 3 */}

                  <InfoItem
                    label="Specialization"
                    value={displayValue(
                      request.specialization
                    )}
                  />

                  <InfoItem
                    label="Years of Experience"
                    value={
                      request.yearsOfExperience !==
                        undefined &&
                      request.yearsOfExperience !==
                        null &&
                      String(
                        request.yearsOfExperience
                      ).trim() !== ""
                        ? `${request.yearsOfExperience} years`
                        : "—"
                    }
                  />

                  <InfoItem
                    label="Hospital / Organization"
                    value={displayValue(
                      request.hospitalName ||
                        request.hospital ||
                        request.organization
                    )}
                  />

                  {/* ROW 4 */}

                  <InfoItem
                    label="Country"
                    value={displayValue(
                      request.country ||
                        request.countryName
                    )}
                  />

                  <InfoItem
                    label="State / Province"
                    value={displayValue(
                      request.stateProvince ||
                        request.state ||
                        request.province
                    )}
                  />

                  <InfoItem
                    label="City"
                    value={displayValue(
                      request.city
                    )}
                  />

                  {/* ROW 5 */}

                  <InfoItem
                    label="Professional ID"
                    value={displayValue(
                      request.professionalId ||
                        request.professionalID ||
                        request.doctorId
                    )}
                  />

                  <InfoItem
                    label="Application Status"
                    value={
                      request.status || "PENDING"
                    }
                    status
                  />

                  <InfoItem
                    label="Application Submitted"
                    value={formatDateTime(
                      request.createdAt
                    )}
                  />

                  {/* REVIEW INFORMATION */}

                  {request.reviewedAt && (
                    <InfoItem
                      label="Reviewed At"
                      value={formatDateTime(
                        request.reviewedAt
                      )}
                    />
                  )}

                  {request.reviewedBy && (
                    <InfoItem
                      label="Reviewed By"
                      value={displayValue(
                        typeof request.reviewedBy ===
                          "object"
                          ? request.reviewedBy?.fullName ||
                              request.reviewedBy?.email ||
                              request.reviewedBy?._id
                          : request.reviewedBy
                      )}
                    />
                  )}

                </div>
              </section>

              {/* =================================================
                  DOCUMENTS
              ================================================== */}

              <section className="details-card">

                <div className="section-heading">
                  <div>
                    <h2>
                      Verification Documents
                    </h2>

                    <p>
                      Review the documents submitted by
                      the doctor.
                    </p>
                  </div>
                </div>

                <div className="documents-grid">

                  {/* CERTIFICATE */}

                  <div className="document-card">

                    <div className="document-icon certificate-icon">
                      PDF
                    </div>

                    <div className="document-content">

                      <h3>
                        Medical Certificate
                      </h3>

                      <p>
                        Submitted professional
                        qualification / registration
                        certificate.
                      </p>

                      {request.registrationCertificateName && (
                        <div className="document-filename">
                          {request.registrationCertificateName}
                        </div>
                      )}

                      <button
                        className="document-button"
                        onClick={
                          handleViewCertificate
                        }
                      >
                        <span>↗</span>
                        View Certificate
                      </button>

                    </div>
                  </div>

                  {/* PROFESSIONAL ID */}

                  <div className="document-card">

                    <div className="document-icon id-icon">
                      ID
                    </div>

                    <div className="document-content">

                      <h3>
                        Professional ID
                      </h3>

                      <p>
                        Submitted professional
                        identification document.
                      </p>

                      {request.professionalIdDocumentName && (
                        <div className="document-filename">
                          {request.professionalIdDocumentName}
                        </div>
                      )}

                      <button
                        className="document-button"
                        onClick={
                          handleViewProfessionalId
                        }
                      >
                        <span>↗</span>
                        View Professional ID
                      </button>

                    </div>
                  </div>

                </div>
              </section>

              {/* =================================================
                  DECLARATION
              ================================================== */}

              <section className="declaration-card">

                <div className="declaration-icon">
                  ✓
                </div>

                <div>
                  <h3>
                    Registration Declaration
                  </h3>

                  <p>
                    The doctor has confirmed that the
                    information and documents submitted
                    during registration are accurate.
                  </p>
                </div>

                <span
                  className={
                    request.declarationAccepted
                      ? "declaration-accepted"
                      : "declaration-not-accepted"
                  }
                >
                  {request.declarationAccepted
                    ? "Accepted"
                    : "Not Accepted"}
                </span>

              </section>

              {/* =================================================
                  REJECTION REASON
              ================================================== */}

              {request.status?.toUpperCase() ===
                "REJECTED" &&
                request.rejectionReason && (
                  <section className="rejection-info-card">

                    <div className="rejection-info-icon">
                      !
                    </div>

                    <div>
                      <h3>
                        Application Rejected
                      </h3>

                      <p>
                        {request.rejectionReason}
                      </p>
                    </div>

                  </section>
                )}

              {/* =================================================
                  ADMIN ACTIONS
              ================================================== */}

              {request.status?.toUpperCase() ===
                "PENDING" && (
                <section className="action-card">

                  <div className="action-text">

                    <h2>
                      Review Application
                    </h2>

                    <p>
                      Verify the submitted information
                      and documents before approving or
                      rejecting this doctor registration
                      request.
                    </p>

                  </div>

                  <div className="action-buttons">

                    <button
                      className="reject-button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setShowRejectModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      Reject Application
                    </button>

                    <button
                      className="approve-button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setShowApproveModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      Approve Application
                    </button>

                  </div>

                </section>
              )}

              {/* =================================================
                  ALREADY REVIEWED
              ================================================== */}

              {request.status?.toUpperCase() !==
                "PENDING" && (
                <section className="reviewed-card">

                  <div className="reviewed-icon">
                    {request.status?.toUpperCase() ===
                    "APPROVED"
                      ? "✓"
                      : "!"}
                  </div>

                  <div>
                    <h3>
                      Application{" "}
                      {request.status?.toLowerCase()}
                    </h3>

                    <p>
                      This application has already been
                      reviewed and no further action is
                      required.
                    </p>
                  </div>

                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* =======================================================
          APPROVE MODAL
      ======================================================== */}

      {showApproveModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => {
            if (!actionLoading) {
              setShowApproveModal(false);
            }
          }}
        >
          <div
            className="modal-card"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-icon approve-modal-icon">
              ✓
            </div>

            <h2>
              Approve Doctor Application?
            </h2>

            <p>
              Are you sure you want to approve the
              registration application for{" "}
              <strong>
                {request?.fullName}
              </strong>
              ?
            </p>

            <div className="modal-note">

              <strong>
                What happens next?
              </strong>

              <ul>
                <li>
                  A doctor account will be created.
                </li>

                <li>
                  The doctor will receive login
                  credentials by email.
                </li>

                <li>
                  The doctor will be required to change
                  the temporary password after first
                  login.
                </li>
              </ul>

            </div>

            <div className="modal-buttons">

              <button
                className="modal-cancel"
                onClick={() =>
                  setShowApproveModal(false)
                }
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="modal-confirm-approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="button-spinner"></span>
                    Approving...
                  </>
                ) : (
                  "Yes, Approve"
                )}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          REJECT MODAL
      ======================================================== */}

      {showRejectModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => {
            if (!actionLoading) {
              setShowRejectModal(false);
            }
          }}
        >
          <div
            className="modal-card reject-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-icon reject-modal-icon">
              !
            </div>

            <h2>
              Reject Doctor Application?
            </h2>

            <p>
              Please provide a reason for rejecting{" "}
              <strong>
                {request?.fullName}
              </strong>
              's application.
            </p>

            <label className="reason-label">
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(
                  e.target.value
                )
              }
              placeholder="Enter the reason for rejection..."
              rows={5}
              maxLength={1000}
              disabled={actionLoading}
            />

            <div className="character-count">
              {rejectionReason.length}/1000
            </div>

            <div className="modal-buttons">

              <button
                className="modal-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="modal-confirm-reject"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="button-spinner"></span>
                    Rejecting...
                  </>
                ) : (
                  "Reject Application"
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================================
// SIDEBAR COMPONENT
// =============================================================

const AdminSidebar = ({
  navigate,
  adminName,
  handleLogout,
}) => {
  return (
    <aside className="admin-sidebar">

      <div className="brand-section">

        <div className="brand-logo">
          HC
        </div>

        <div className="brand-text">
          <h2>
            Hemophilia Care
          </h2>

          <p>
            Clinical Platform
          </p>
        </div>

      </div>

      <nav className="sidebar-nav">

        <button
          className="nav-item"
          onClick={() =>
            navigate("/admin/dashboard")
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
          className="nav-item active"
          onClick={() =>
            navigate(
              "/admin/doctor-requests"
            )
          }
        >
          <span className="nav-icon">
            ♙
          </span>

          <span>
            Doctor Requests
          </span>
        </button>

        <button
          className="nav-item"
          onClick={() =>
            navigate("/admin/doctors")
          }
        >
          <span className="nav-icon">
            ♟
          </span>

          <span>
            Doctors
          </span>
        </button>

        <button
          className="nav-item"
          onClick={() =>
            navigate(
              "/admin/patient-research"
            )
          }
        >
          <span className="nav-icon">
            ⌕
          </span>

          <span>
            Patient Research
          </span>
        </button>

      </nav>

      <div className="sidebar-bottom">

        <div className="admin-profile">

          <div className="admin-avatar">
            {adminName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="admin-profile-text">

            <strong>
              {adminName}
            </strong>

            <span>
              {JSON.parse(localStorage.getItem("admin") || "{}")?.adminLevel === "SUPER_ADMIN"
                  ? "Super Admin"
                  : "Assistant Admin"}
            </span>

          </div>

        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>
            ↪
          </span>

          Logout
        </button>

      </div>

    </aside>
  );
};

// =============================================================
// INFO ITEM
// =============================================================

const InfoItem = ({
  label,
  value,
  status = false,
}) => {
  return (
    <div className="info-item">

      <span className="info-label">
        {label}
      </span>

      {status ? (
        <span
          className={`status-pill ${getStatusClassStatic(
            value
          )}`}
        >
          <span className="status-dot"></span>

          {value || "PENDING"}
        </span>
      ) : (
        <strong className="info-value">
          {value || "—"}
        </strong>
      )}

    </div>
  );
};

const getStatusClassStatic = (status) => {
  const normalized = status?.toUpperCase();

  if (normalized === "APPROVED") {
    return "status-approved";
  }

  if (normalized === "REJECTED") {
    return "status-rejected";
  }

  return "status-pending";
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
    background: linear-gradient(
      135deg,
      #2563eb,
      #6366f1
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 15px;
    font-weight: 800;
    box-shadow:
      0 5px 14px rgba(
        37,
        99,
        235,
        0.22
      );
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
      color 0.2s ease;
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
    margin-bottom: 23px;
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

  .back-button {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #445066;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 650;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: 0.2s ease;
    white-space: nowrap;
  }

  .back-button:hover {
    border-color: #c5d2f5;
    color: #315fcb;
    background: #f9faff;
  }

  .back-button span {
    font-size: 16px;
  }

  /* =========================================================
     ALERTS
  ========================================================== */

  .success-alert,
  .error-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 15px;
    border-radius: 10px;
    margin-bottom: 18px;
  }

  .success-alert {
    background: #f0fbf4;
    border: 1px solid #ccefd8;
  }

  .error-alert {
    background: #fff5f5;
    border: 1px solid #ffdada;
  }

  .alert-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }

  .success-icon {
    background: #dff5e7;
    color: #198754;
  }

  .error-icon {
    background: #fee2e2;
    color: #dc2626;
  }

  .success-alert strong,
  .error-alert strong {
    display: block;
    font-size: 12px;
  }

  .success-alert strong {
    color: #16723e;
  }

  .error-alert strong {
    color: #b42318;
  }

  .success-alert p,
  .error-alert p {
    margin: 3px 0 0;
    font-size: 10px;
  }

  .success-alert p {
    color: #4e8062;
  }

  .error-alert p {
    color: #9b5757;
  }

  .success-alert > button,
  .error-alert > button {
    margin-left: auto;
    border: none;
    background: transparent;
    color: #8a94a5;
    font-size: 19px;
    cursor: pointer;
    line-height: 1;
  }

  /* =========================================================
     STATUS BANNER
  ========================================================== */

  .status-banner {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    padding: 19px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 17px;
    box-shadow:
      0 2px 9px rgba(
        20,
        30,
        50,
        0.025
      );
  }

  .status-banner-left {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .large-doctor-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      #edf3ff,
      #e5eaff
    );
    color: #315fcb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .status-banner-left > div:last-child {
    margin-left: 13px;
    min-width: 0;
  }

  .application-label {
    color: #8c95a5;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.45px;
  }

  .status-banner h2 {
    margin: 4px 0 0;
    color: #242c3b;
    font-size: 17px;
    font-weight: 750;
  }

  .status-banner p {
    margin: 4px 0 0;
    color: #9199a8;
    font-size: 9px;
  }

  .large-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 11px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 750;
    text-transform: uppercase;
    white-space: nowrap;
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
     DETAILS CARD
  ========================================================== */

  .details-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    margin-bottom: 17px;
    box-shadow:
      0 2px 9px rgba(
        20,
        30,
        50,
        0.025
      );
    overflow: hidden;
  }

  .section-heading {
    padding: 18px 21px 15px;
    border-bottom: 1px solid #edf0f4;
  }

  .section-heading h2 {
    margin: 0;
    color: #252d3d;
    font-size: 15px;
    font-weight: 750;
  }

  .section-heading p {
    margin: 5px 0 0;
    color: #9098a7;
    font-size: 10px;
  }

  .details-grid {
    padding: 4px 21px 9px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    column-gap: 30px;
  }

  .info-item {
    min-width: 0;
    padding: 14px 0;
    border-bottom: 1px solid #f0f2f5;
  }

  .info-label {
    display: block;
    color: #929aaa;
    font-size: 9px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .info-value {
    display: block;
    color: #414b5c;
    font-size: 11px;
    font-weight: 650;
    overflow-wrap: anywhere;
    line-height: 1.5;
  }

  /* =========================================================
     DECLARATION
  ========================================================== */

  .declaration-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    margin-bottom: 17px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .declaration-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #eaf8ef;
    color: #168044;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }

  .declaration-card h3 {
    margin: 0;
    color: #353e4e;
    font-size: 12px;
    font-weight: 750;
  }

  .declaration-card p {
    margin: 4px 0 0;
    color: #929aaa;
    font-size: 10px;
    line-height: 1.45;
  }

  .declaration-accepted,
  .declaration-not-accepted {
    margin-left: auto;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 750;
    white-space: nowrap;
  }

  .declaration-accepted {
    color: #168044;
    background: #eaf8ef;
  }

  .declaration-not-accepted {
    color: #c53030;
    background: #fff0f0;
  }

  /* =========================================================
     DOCUMENTS
  ========================================================== */

  .documents-grid {
    padding: 18px 21px 21px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .document-card {
    border: 1px solid #e7eaf0;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #fcfdff;
  }

  .document-icon {
    width: 43px;
    height: 43px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 850;
    flex-shrink: 0;
  }

  .certificate-icon {
    color: #c13d3d;
    background: #fff0f0;
  }

  .id-icon {
    color: #315fcb;
    background: #edf3ff;
  }

  .document-content {
    min-width: 0;
  }

  .document-content h3 {
    margin: 1px 0 0;
    color: #353e4e;
    font-size: 11px;
    font-weight: 750;
  }

  .document-content p {
    margin: 5px 0 8px;
    color: #929aaa;
    font-size: 9px;
    line-height: 1.45;
  }

  .document-filename {
    margin-bottom: 10px;
    padding: 6px 8px;
    background: #f6f8fc;
    border-radius: 6px;
    color: #626d7e;
    font-size: 8px;
    line-height: 1.4;
    word-break: break-all;
  }

  .document-button {
    border: 1px solid #dbe3f7;
    background: #f7f9ff;
    color: #315fcb;
    border-radius: 7px;
    padding: 7px 9px;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .document-button:hover {
    background: #edf3ff;
  }

  .document-button span {
    font-size: 12px;
  }

  /* =========================================================
     ACTION CARD
  ========================================================== */

  .action-card {
    background: #ffffff;
    border: 1px solid #e0e6f3;
    border-radius: 11px;
    padding: 19px 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    box-shadow:
      0 2px 9px rgba(
        20,
        30,
        50,
        0.025
      );
  }

  .action-text {
    min-width: 0;
  }

  .action-text h2 {
    margin: 0;
    color: #252d3d;
    font-size: 14px;
    font-weight: 750;
  }

  .action-text p {
    max-width: 650px;
    margin: 5px 0 0;
    color: #8e97a6;
    font-size: 10px;
    line-height: 1.55;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .reject-button,
  .approve-button {
    border-radius: 7px;
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .reject-button {
    border: 1px solid #f1caca;
    background: #fff7f7;
    color: #c53030;
  }

  .reject-button:hover {
    background: #fff0f0;
  }

  .approve-button {
    border: 1px solid #2f66d5;
    background: linear-gradient(
      135deg,
      #2563eb,
      #536fe0
    );
    color: #ffffff;
    box-shadow:
      0 4px 10px rgba(
        37,
        99,
        235,
        0.15
      );
  }

  .approve-button:hover {
    transform: translateY(-1px);
  }

  .reject-button:disabled,
  .approve-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  /* =========================================================
     REJECTION INFO
  ========================================================== */

  .rejection-info-card {
    background: #fff8f8;
    border: 1px solid #f5d4d4;
    border-radius: 11px;
    padding: 17px 19px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 17px;
  }

  .rejection-info-icon {
    width: 31px;
    height: 31px;
    border-radius: 50%;
    background: #fee7e7;
    color: #c53030;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }

  .rejection-info-card h3 {
    margin: 0;
    color: #a83232;
    font-size: 12px;
  }

  .rejection-info-card p {
    margin: 4px 0 0;
    color: #906464;
    font-size: 10px;
    line-height: 1.5;
  }

  /* =========================================================
     REVIEWED
  ========================================================== */

  .reviewed-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    padding: 17px 19px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 17px;
  }

  .reviewed-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #eaf8ef;
    color: #198754;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 850;
  }

  .reviewed-card h3 {
    margin: 0;
    color: #353e4e;
    font-size: 12px;
  }

  .reviewed-card p {
    margin: 4px 0 0;
    color: #929aaa;
    font-size: 10px;
  }

  /* =========================================================
     NOT FOUND
  ========================================================== */

  .not-found-card {
    background: #ffffff;
    border: 1px solid #e7eaf0;
    border-radius: 11px;
    padding: 60px 25px;
    text-align: center;
  }

  .not-found-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #fff5e8;
    color: #c87800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 13px;
    font-size: 20px;
    font-weight: 800;
  }

  .not-found-card h2 {
    margin: 0;
    color: #303847;
    font-size: 15px;
  }

  .not-found-card p {
    margin: 6px 0 15px;
    color: #929aaa;
    font-size: 10px;
  }

  .primary-button {
    border: none;
    background: #315fcb;
    color: white;
    border-radius: 7px;
    padding: 9px 14px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
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
     MODAL
  ========================================================== */

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(
      22,
      29,
      43,
      0.48
    );
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1000;
  }

  .modal-card {
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 14px;
    padding: 27px;
    box-shadow:
      0 22px 60px rgba(
        15,
        23,
        42,
        0.2
      );
    animation: modalIn 0.18s ease-out;
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform:
        translateY(8px)
        scale(0.98);
    }

    to {
      opacity: 1;
      transform:
        translateY(0)
        scale(1);
    }
  }

  .modal-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    font-weight: 850;
    margin-bottom: 15px;
  }

  .approve-modal-icon {
    color: #168044;
    background: #eaf8ef;
  }

  .reject-modal-icon {
    color: #c53030;
    background: #fff0f0;
  }

  .modal-card h2 {
    margin: 0;
    color: #252d3d;
    font-size: 17px;
    font-weight: 750;
  }

  .modal-card > p {
    margin: 8px 0 0;
    color: #778193;
    font-size: 11px;
    line-height: 1.6;
  }

  .modal-card > p strong {
    color: #303847;
  }

  .modal-note {
    margin-top: 17px;
    padding: 13px 14px;
    border-radius: 9px;
    background: #f7f9fc;
    border: 1px solid #e9edf3;
  }

  .modal-note strong {
    color: #4b5668;
    font-size: 10px;
  }

  .modal-note ul {
    margin: 7px 0 0;
    padding-left: 17px;
  }

  .modal-note li {
    color: #7e8797;
    font-size: 9px;
    line-height: 1.6;
    margin-bottom: 2px;
  }

  .reason-label {
    display: block;
    margin-top: 18px;
    margin-bottom: 6px;
    color: #4a5568;
    font-size: 10px;
    font-weight: 700;
  }

  .reject-modal textarea {
    width: 100%;
    resize: vertical;
    min-height: 110px;
    border: 1px solid #dfe4ed;
    border-radius: 8px;
    padding: 11px;
    outline: none;
    color: #394456;
    font-family: inherit;
    font-size: 11px;
    line-height: 1.5;
  }

  .reject-modal textarea::placeholder {
    color: #a4abb7;
  }

  .reject-modal textarea:focus {
    border-color: #e0a3a3;
    box-shadow:
      0 0 0 3px rgba(
        197,
        48,
        48,
        0.06
      );
  }

  .character-count {
    text-align: right;
    color: #a0a7b3;
    font-size: 8px;
    margin-top: 4px;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  .modal-cancel,
  .modal-confirm-approve,
  .modal-confirm-reject {
    border-radius: 7px;
    padding: 9px 13px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
  }

  .modal-cancel {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #687386;
  }

  .modal-cancel:hover {
    background: #f8f9fb;
  }

  .modal-confirm-approve {
    border: none;
    background: #248451;
    color: #ffffff;
  }

  .modal-confirm-reject {
    border: none;
    background: #c53030;
    color: #ffffff;
  }

  .modal-cancel:disabled,
  .modal-confirm-approve:disabled,
  .modal-confirm-reject:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-spinner {
    display: inline-block;
    width: 11px;
    height: 11px;
    border: 2px solid rgba(
      255,
      255,
      255,
      0.45
    );
    border-top-color: #ffffff;
    border-radius: 50%;
    animation:
      adminSpin 0.7s linear infinite;
    margin-right: 5px;
    vertical-align: -1px;
  }

  /* =========================================================
     TABLET
  ========================================================== */

  @media (max-width: 1000px) {

    .admin-main {
      padding: 25px 22px 40px;
    }

    .details-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      column-gap: 25px;
    }

    .documents-grid {
      gap: 10px;
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
      grid-template-columns:
        repeat(2, 1fr);
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

    .back-button {
      width: 100%;
      justify-content: center;
    }

    .status-banner {
      padding: 15px;
      align-items: flex-start;
      flex-direction: column;
    }

    .status-banner-left {
      width: 100%;
    }

    .large-doctor-avatar {
      width: 46px;
      height: 46px;
      font-size: 15px;
    }

    .status-banner h2 {
      font-size: 15px;
    }

    .large-status {
      align-self: flex-start;
    }

    .details-grid {
      grid-template-columns: 1fr;
      padding: 3px 15px 8px;
    }

    .section-heading {
      padding: 16px 15px 13px;
    }

    .documents-grid {
      grid-template-columns: 1fr;
      padding: 13px 15px 16px;
    }

    .declaration-card {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .declaration-card > span {
      margin-left: 46px;
    }

    .action-card {
      flex-direction: column;
      align-items: stretch;
      padding: 16px;
    }

    .action-buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .reject-button,
    .approve-button {
      width: 100%;
    }

    .modal-overlay {
      padding: 12px;
      align-items: flex-end;
    }

    .modal-card {
      max-height: 90vh;
      overflow-y: auto;
      padding: 21px;
      border-radius: 14px;
    }

    .modal-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .modal-buttons button {
      width: 100%;
    }

    .success-alert,
    .error-alert {
      align-items: flex-start;
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

    .status-banner h2 {
      font-size: 14px;
    }

    .action-buttons {
      grid-template-columns: 1fr;
    }

    .modal-buttons {
      grid-template-columns: 1fr;
    }

    .declaration-card > span {
      margin-left: 0;
    }
  }
`;

export default AdminDoctorRequestDetails;
