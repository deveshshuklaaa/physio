// // import React, { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import api from "../apiClient";
// // import {
// //   PieChart,
// //   Pie,
// //   Cell,
// //   BarChart,
// //   Bar,
// //   LineChart,
// //   Line,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// // } from "recharts";

// // /* ============================================================================
// //    DoctorDashboard.jsx
// //    Hemophilia Clinical Management Platform — Clinician Dashboard (UI ONLY)

// //    - No mock/fake patient data anywhere in this file.
// //    - All clinical data is sourced from `dashboardData` below, which is
// //      intentionally null / empty until wired to a real backend.
// //    - Search for "// BACKEND:" comments to find every integration point.
// //    ========================================================================== */

// // /* ----------------------------------------------------------------------------
// //    AUTH / IDENTITY DATA SLOT
// //    BACKEND: replace with the authenticated clinician's name from your auth
// //    context / session (e.g. useAuth().user.name). Do not hardcode.
// // ---------------------------------------------------------------------------- */


// // /* ----------------------------------------------------------------------------
// //    THEME TOKENS
// // ---------------------------------------------------------------------------- */
// // const CHART_COLORS = ["#2C5CE0", "#0BA5A0", "#7C9CF0", "#9FD8D5", "#C6D4EA"];

// // /* ============================================================================
// //    SHARED SUBCOMPONENTS
// //    ========================================================================== */

// // function SectionHeader({ eyebrow, title, description }) {
// //   return (
// //     <div className="section-header">
// //       <div className="section-header-top">
// //         {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
// //         <svg
// //           className="pulse-line"
// //           viewBox="0 0 120 24"
// //           preserveAspectRatio="none"
// //           aria-hidden="true"
// //         >
// //           <polyline
// //             points="0,12 28,12 34,3 40,21 46,12 120,12"
// //             fill="none"
// //             stroke="currentColor"
// //             strokeWidth="2"
// //             strokeLinecap="round"
// //             strokeLinejoin="round"
// //           />
// //         </svg>
// //       </div>
// //       <h2 className="section-title">{title}</h2>
// //       {description && <p className="section-description">{description}</p>}
// //     </div>
// //   );
// // }

// // function EmptyState({ message = "No data available", hint }) {
// //   return (
// //     <div className="empty-state" role="status">
// //       <svg
// //         className="empty-state-icon"
// //         viewBox="0 0 48 48"
// //         fill="none"
// //         aria-hidden="true"
// //       >
// //         <rect
// //           x="6"
// //           y="10"
// //           width="36"
// //           height="28"
// //           rx="4"
// //           stroke="currentColor"
// //           strokeWidth="2"
// //         />
// //         <path
// //           d="M13 30l7-8 6 6 9-11"
// //           stroke="currentColor"
// //           strokeWidth="2"
// //           strokeLinecap="round"
// //           strokeLinejoin="round"
// //         />
// //       </svg>
// //       <p className="empty-state-message">{message}</p>
// //       {hint && <p className="empty-state-hint">{hint}</p>}
// //     </div>
// //   );
// // }

// // function StatCard({ label, value, description, icon }) {
// //   const displayValue =
// //     value === null || value === undefined || value === "" ? "--" : value;
// //   return (
// //     <div className="stat-card">
// //       <div className="stat-card-top">
// //         <span className="stat-icon" aria-hidden="true">
// //           {icon}
// //         </span>
// //         <span className="stat-label">{label}</span>
// //       </div>
// //       <div className="stat-value">{displayValue}</div>
// //       {description && <p className="stat-description">{description}</p>}
// //     </div>
// //   );
// // }

// // function ChartCard({ title, subtitle, footnote, children, wide }) {
// //   return (
// //     <div className={`chart-card ${wide ? "chart-card-wide" : ""}`}>
// //       <div className="chart-card-header">
// //         <h3 className="chart-card-title">{title}</h3>
// //         {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
// //       </div>
// //       <div className="chart-card-body">{children}</div>
// //       {footnote && <p className="chart-card-footnote">{footnote}</p>}
// //     </div>
// //   );
// // }

// // /* Simple inline icon set (no external icon dependency) */
// // const Icon = {
// //   Users: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <circle cx="9" cy="8" r="3.2" />
// //       <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
// //       <circle cx="17" cy="9" r="2.6" />
// //       <path d="M15.8 13.6c2.9.4 5.2 2.9 5.2 6" />
// //     </svg>
// //   ),
// //   DropletA: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 2s7 8.2 7 13a7 7 0 1 1-14 0c0-4.8 7-13 7-13z" />
// //     </svg>
// //   ),
// //   Severity: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M3 20h18M6 20V10M12 20V4M18 20v-7" />
// //     </svg>
// //   ),
// //   Therapy: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <rect x="4" y="9" width="16" height="9" rx="2" />
// //       <path d="M9 9V6a3 3 0 0 1 6 0v3" />
// //     </svg>
// //   ),
// //   FollowUp: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <circle cx="12" cy="12" r="9" />
// //       <path d="M12 7v5l3.2 2" />
// //     </svg>
// //   ),
// //   Logout: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
// //       <path d="M14 15l4-4-4-4M18 11H9" />
// //     </svg>
// //   ),
// //   Cross: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 3v18M3 12h18" strokeLinecap="round" />
// //     </svg>
// //   ),
// //   Alert: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 4l9 16H3l9-16z" strokeLinejoin="round" />
// //       <path d="M12 10v4M12 17.5v.01" strokeLinecap="round" />
// //     </svg>
// //   ),
// // };

// // /* ============================================================================
// //    MAIN COMPONENT
// //    ========================================================================== */

// // function DoctorDashboard() {
// //      const navigate = useNavigate();

// //     const [dashboardData, setDashboardData] = useState(null);
// // const [loading, setLoading] = useState(true);
// // const [error, setError] = useState("");

// // const fetchDashboard = async () => {
// //   try {
// //     setLoading(true);
// //     setError("");

// //     const token =
// //       localStorage.getItem("staffAuthToken");

// //     if (!token) {
// //       setError("Doctor authentication required");
// //       return;
// //     }

// //     const response = await api.get(
// //       "/doctor/dashboard",
// //       {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       }
// //     );

// //     setDashboardData(response.data);
// //   } catch (error) {
// //     console.error(
// //       "Dashboard API error:",
// //       error
// //     );

// //     setError(
// //       error.response?.data?.message ||
// //         "Unable to load dashboard"
// //     );
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// // useEffect(() => {
// //   fetchDashboard();
// // }, []);

// // // useEffect(() => {
// // //   const fetchDashboard = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError("");

// // //       const token = localStorage.getItem("staffAuthToken");

// // //       if (!token) {
// // //         setError("Doctor authentication required");
// // //         return;
// // //       }

// // //       const response = await api.get("/doctor/dashboard", {
// // //         headers: {
// // //           Authorization: `Bearer ${token}`,
// // //         },
// // //       });

// // //       console.log("DOCTOR DASHBOARD DATA:", response.data);

// // //       setDashboardData(response.data);
// // //     } catch (err) {
// // //       console.error("Dashboard API error:", err);

// // //       setError(
// // //         err.response?.data?.message ||
// // //           "Unable to load dashboard data"
// // //       );
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   fetchDashboard();
// // // }, []);

// // // =====================================================
// // // DOCTOR
// // // =====================================================

// // const doctorName = dashboardData?.doctor?.fullName || "";
// // const roleName = dashboardData?.doctor?.role || "Clinician";


// // // =====================================================
// // // OVERVIEW
// // // =====================================================

// // const overview = dashboardData?.overview || {};

// // const totalPatients =
// //   Number(overview.totalPatients) || 0;

// // const totalHemophiliaRecords =
// //   Number(overview.totalHemophiliaRecords) || 0;

// // const totalAssessments =
// //   Number(overview.totalAssessments) || 0;

// // const patientsWithBleedingHistory =
// //   Number(overview.patientsWithBleedingHistory) || 0;


// // // =====================================================
// // // DISTRIBUTIONS
// // // =====================================================

// // const distributions =
// //   dashboardData?.distributions || {};


// // // =====================================================
// // // HEMOPHILIA TYPE
// // //
// // // Backend:
// // // {
// // //   hemophiliaType: {
// // //     A: 0,
// // //     B: 2,
// // //     C: 0,
// // //     Unknown: 0
// // //   }
// // // }
// // //
// // // Frontend/Recharts:
// // // [
// // //   { name: "A", value: 0 },
// // //   { name: "B", value: 2 },
// // //   ...
// // // ]
// // // =====================================================

// // const hemophiliaTypeObject =
// //   distributions.hemophiliaType ||
// //   distributions.hemophiliaTypes ||
// //   {};

// // const hemophiliaTypeA =
// //   Number(hemophiliaTypeObject.A) || 0;

// // const hemophiliaTypeB =
// //   Number(hemophiliaTypeObject.B) || 0;

// // const hemophiliaTypeC =
// //   Number(hemophiliaTypeObject.C) || 0;

// // const hemophiliaTypeUnknown =
// //   Number(hemophiliaTypeObject.Unknown) || 0;

// // const hemophiliaTypes = Array.isArray(
// //   hemophiliaTypeObject
// // )
// //   ? hemophiliaTypeObject
// //   : Object.entries(hemophiliaTypeObject).map(
// //       ([name, value]) => ({
// //         name,
// //         value: Number(value) || 0,
// //       })
// //     );


// // // =====================================================
// // // SEVERITY
// // //
// // // Backend:
// // // {
// // //   Mild: 0,
// // //   Moderate: 2,
// // //   Severe: 0,
// // //   Unknown: 0
// // // }
// // // =====================================================

// // const severityObject =
// //   distributions.severity || {};

// // const mildCases =
// //   Number(severityObject.Mild) || 0;

// // const moderateCases =
// //   Number(severityObject.Moderate) || 0;

// // const severeCases =
// //   Number(severityObject.Severe) || 0;

// // const unknownSeverity =
// //   Number(severityObject.Unknown) || 0;

// // const severity = Array.isArray(severityObject)
// //   ? severityObject
// //   : Object.entries(severityObject).map(
// //       ([name, value]) => ({
// //         name,
// //         value: Number(value) || 0,
// //       })
// //     );


// // // =====================================================
// // // AGE DISTRIBUTION
// // //
// // // Backend should return:
// // // [
// // //   { name: "0-10", value: 1 },
// // //   { name: "11-20", value: 2 },
// // //   ...
// // // ]
// // //
// // // We safely normalize it here.
// // // =====================================================

// // const rawAgeDistribution =
// //   distributions.ageDistribution;

// // const ageDistribution = Array.isArray(
// //   rawAgeDistribution
// // )
// //   ? rawAgeDistribution.map((item) => ({
// //       name:
// //         item.name ??
// //         item.ageGroup ??
// //         item.label ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // AFFECTED JOINTS
// // //
// // // Backend:
// // // [
// // //   { joint: "Elbow", count: 2 },
// // //   { joint: "Shoulder", count: 2 }
// // // ]
// // //
// // // Recharts needs:
// // // [
// // //   { name: "Elbow", value: 2 },
// // //   ...
// // // ]
// // // =====================================================

// // const rawAffectedJoints =
// //   distributions.affectedJoints ||
// //   dashboardData?.clinicalBackground?.jointDistribution ||
// //   [];

// // const affectedJoints = Array.isArray(
// //   rawAffectedJoints
// // )
// //   ? rawAffectedJoints.map((item) => ({
// //       name:
// //         item.name ??
// //         item.joint ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // FACTOR THERAPY
// // //
// // // Backend:
// // // {
// // //   active: 2,
// // //   none: 0,
// // //   unknown: 0
// // // }
// // // =====================================================

// // const factorTherapyObject =
// //   distributions.factorTherapy || {
// //     active: 0,
// //     none: 0,
// //     unknown: 0,
// //   };

// // const onFactorTherapy =
// //   Number(factorTherapyObject.active) || 0;

// // const factorTherapy = [
// //   {
// //     name: "Active Therapy",
// //     value:
// //       Number(factorTherapyObject.active) || 0,
// //   },
// //   {
// //     name: "No Therapy",
// //     value:
// //       Number(factorTherapyObject.none) || 0,
// //   },
// //   {
// //     name: "Unknown",
// //     value:
// //       Number(factorTherapyObject.unknown) || 0,
// //   },
// // ];


// // // =====================================================
// // // FAMILY HISTORY
// // //
// // // Backend:
// // // {
// // //   yes: 0,
// // //   no: 0,
// // //   unknown: 2
// // // }
// // // =====================================================

// // const familyHistory =
// //   distributions.familyHistory || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };


// // // =====================================================
// // // GENETIC TESTING
// // //
// // // Backend:
// // // {
// // //   yes: 0,
// // //   no: 0,
// // //   unknown: 2
// // // }
// // //
// // // Convert to the names your frontend can use.
// // // =====================================================

// // const geneticTestingBackend =
// //   distributions.geneticTesting || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };

// // const geneticTesting = {
// //   done:
// //     Number(geneticTestingBackend.yes) || 0,

// //   notDone:
// //     Number(geneticTestingBackend.no) || 0,

// //   unknown:
// //     Number(geneticTestingBackend.unknown) || 0,
// // };


// // // =====================================================
// // // PHYSIOTHERAPY
// // //
// // // Backend:
// // // {
// // //   yes: 1,
// // //   no: 1,
// // //   unknown: 0
// // // }
// // //
// // // Convert to names used by frontend.
// // // =====================================================

// // const physiotherapyBackend =
// //   distributions.physiotherapy || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };

// // const physiotherapy = {
// //   current:
// //     Number(physiotherapyBackend.yes) || 0,

// //   notCurrent:
// //     Number(physiotherapyBackend.no) || 0,

// //   unknown:
// //     Number(physiotherapyBackend.unknown) || 0,
// // };


// // // =====================================================
// // // BLEEDING FREQUENCY
// // //
// // // Backend puts this under:
// // // clinicalBackground.bleedingFrequencyDistribution
// // //
// // // Example:
// // // [
// // //   { frequency: "2-3 times", count: 2 }
// // // ]
// // // =====================================================

// // const rawBleedingFrequency =
// //   dashboardData?.clinicalBackground
// //     ?.bleedingFrequencyDistribution || [];

// // const bleedingFrequency = Array.isArray(
// //   rawBleedingFrequency
// // )
// //   ? rawBleedingFrequency.map((item) => ({
// //       name:
// //         item.name ??
// //         item.frequency ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // BLEEDING TRENDS
// // //
// // // Currently backend does not return this,
// // // so keep it safely empty.
// // // =====================================================

// // const bleedingTrends =
// //   Array.isArray(
// //     dashboardData?.bleedingTrends
// //   )
// //     ? dashboardData.bleedingTrends
// //     : [];


// // // =====================================================
// // // CLINICAL ALERTS
// // //
// // // Currently backend does not return this,
// // // so keep it safely empty.
// // // =====================================================

// // const clinicalAlerts =
// //   Array.isArray(
// //     dashboardData?.clinicalAlerts
// //   )
// //     ? dashboardData.clinicalAlerts
// //     : [];


// // // =====================================================
// // // FOLLOW-UP
// // //
// // // Your current backend does not provide a
// // // requiringFollowUp value.
// // //
// // // For now use bleeding-history count as
// // // the closest available indicator.
// // // =====================================================

// // const requiringFollowUp =
// //   patientsWithBleedingHistory;

// //   const initials = doctorName
// //     ? doctorName
// //         .replace(/^Dr\.?\s*/i, "")
// //         .split(" ")
// //         .filter(Boolean)
// //         .map((p) => p[0])
// //         .slice(0, 2)
// //         .join("")
// //         .toUpperCase()
// //     : "--";

 
// //     const handleLogout = () => {
// //     localStorage.removeItem("staffAuthToken");
// //     localStorage.removeItem("staffUser");

// //     delete api.defaults.headers.common["Authorization"];

// //     navigate("/doctor-login");
// //     };
// //     // Intentionally left as an integration point — no auth logic here.
  
// // if (loading) {
// //   return (
// //     <div
// //       style={{
// //         minHeight: "100vh",
// //         display: "flex",
// //         alignItems: "center",
// //         justifyContent: "center",
// //       }}
// //     >
// //       Loading clinical dashboard...
// //     </div>
// //   );
// // }

// // if (error) {
// //   return (
// //     <div
// //       style={{
// //         minHeight: "100vh",
// //         display: "flex",
// //         flexDirection: "column",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         gap: "12px",
// //       }}
// //     >
// //       <h2>Unable to load dashboard</h2>
// //       <p>{error}</p>

// //       <button
// //         onClick={fetchDashboard}
// //         className="main-btn"
// //       >
// //         Retry
// //       </button>
// //     </div>
// //   );
// // }
// //   return (
// //     <div className="dd-root">
// //       <style>{`
// //         .dd-root {
// //           --color-bg: #F5F8FC;
// //           --color-surface: #FFFFFF;
// //           --color-primary: #2C5CE0;
// //           --color-primary-dark: #163B85;
// //           --color-primary-soft: #EAF0FE;
// //           --color-accent: #0BA5A0;
// //           --color-accent-soft: #E4F6F5;
// //           --color-border: #DCE6F2;
// //           --color-text: #10233F;
// //           --color-text-secondary: #5B7291;
// //           --color-text-faint: #93A6C2;
// //           --shadow-card: 0 1px 2px rgba(16, 35, 63, 0.04), 0 6px 20px rgba(16, 35, 63, 0.05);
// //           --radius-lg: 16px;
// //           --radius-md: 12px;

// //           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
// //           background: var(--color-bg);
// //           color: var(--color-text);
// //           min-height: 100vh;
// //         }

// //         .dd-root * { box-sizing: border-box; }

// //         .dd-root .font-display {
// //           font-family: 'Manrope', 'Inter', sans-serif;
// //         }

// //         .dd-root .font-data {
// //           font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
// //           font-variant-numeric: tabular-nums;
// //         }

// //         /* ---------------- Navbar ---------------- */
// //         .dd-navbar {
// //           position: sticky;
// //           top: 0;
// //           z-index: 20;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           padding: 14px 28px;
// //           background: var(--color-surface);
// //           border-bottom: 1px solid var(--color-border);
// //         }
// //         .dd-navbar-left {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }
// //         .dd-logo-mark {
// //           width: 34px;
// //           height: 34px;
// //           border-radius: 9px;
// //           background: linear-gradient(145deg, var(--color-primary), var(--color-primary-dark));
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           color: #fff;
// //         }
// //         .dd-logo-mark svg { width: 18px; height: 18px; }
// //         .dd-app-name {
// //           font-weight: 700;
// //           font-size: 16px;
// //           letter-spacing: -0.01em;
// //           color: var(--color-text);
// //         }
// //         .dd-navbar-right {
// //           display: flex;
// //           align-items: center;
// //           gap: 16px;
// //         }
// //         .pr-dashboard-btn,
// //         .pr-logout-btn {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;

// //           padding: 8px 12px;

// //           border-radius: 9px;

// //           border: 1px solid var(--color-border);

// //           background: var(--color-surface);

// //           color: var(--color-text-secondary);

// //           font-size: 12.5px;
// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all 0.15s ease;
// //         }

// //         .pr-dashboard-btn:hover,
// //         .pr-logout-btn:hover {
// //           border-color: var(--color-primary);

// //           color: var(--color-primary-dark);

// //           background: var(--color-primary-soft);
// //         }

// //         .pr-dashboard-btn svg {
// //           width: 15px;
// //           height: 15px;
// //         }
// //         .dd-doctor-block {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }
// //         .dd-avatar {
// //           width: 34px;
// //           height: 34px;
// //           border-radius: 50%;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           font-size: 12px;
// //           font-weight: 700;
// //           font-family: 'Manrope', sans-serif;
// //           border: 1px solid var(--color-border);
// //         }
// //         .dd-doctor-name {
// //           font-size: 13.5px;
// //           font-weight: 600;
// //           color: var(--color-text);
// //           line-height: 1.2;
// //         }
// //         .dd-doctor-role {
// //           font-size: 11.5px;
// //           color: var(--color-text-secondary);
// //         }
// //         .dd-logout-btn {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;
// //           padding: 8px 12px;
// //           border-radius: 9px;
// //           border: 1px solid var(--color-border);
// //           background: var(--color-surface);
// //           color: var(--color-text-secondary);
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           cursor: pointer;
// //           transition: all 0.15s ease;
// //         }
// //         .dd-logout-btn:hover {
// //           border-color: var(--color-primary);
// //           color: var(--color-primary-dark);
// //           background: var(--color-primary-soft);
// //         }
// //         .dd-logout-btn svg { width: 15px; height: 15px; }
// //         .dd-logout-btn:focus-visible,
// //         .stat-card:focus-visible {
// //           outline: 2px solid var(--color-primary);
// //           outline-offset: 2px;
// //         }

// //         /* ---------------- Layout ---------------- */
// //         .dd-main {
// //           max-width: 1240px;
// //           margin: 0 auto;
// //           padding: 32px 28px 64px;
// //         }

// //         .dd-welcome {
// //           margin-bottom: 28px;
// //         }
// //         .dd-welcome-title {
// //           font-size: 26px;
// //           font-weight: 800;
// //           letter-spacing: -0.015em;
// //           margin: 0 0 6px;
// //         }
// //         .dd-welcome-subtitle {
// //           font-size: 14.5px;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //         }
// //         .dd-welcome-doctor {
// //           color: var(--color-primary-dark);
// //           font-weight: 700;
// //         }

// //         /* ---------------- Section header w/ signature pulse-line ---------------- */
// //         .section-header {
// //           margin: 44px 0 16px;
// //         }
// //         .section-header-top {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           margin-bottom: 4px;
// //         }
// //         .section-eyebrow {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 11px;
// //           font-weight: 700;
// //           letter-spacing: 0.08em;
// //           text-transform: uppercase;
// //           color: var(--color-primary);
// //         }
// //         .pulse-line {
// //           flex: 1;
// //           height: 16px;
// //           color: var(--color-border);
// //           max-width: 220px;
// //         }
// //         .section-title {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 18px;
// //           font-weight: 700;
// //           margin: 0;
// //           color: var(--color-text);
// //         }
// //         .section-description {
// //           font-size: 13px;
// //           color: var(--color-text-secondary);
// //           margin: 6px 0 0;
// //           max-width: 620px;
// //         }

// //         /* ---------------- KPI grid ---------------- */
// //         .stat-grid {
// //           display: grid;
// //           grid-template-columns: repeat(4, 1fr);
// //           gap: 16px;
// //         }
// //         .stat-card {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           padding: 18px;
// //           box-shadow: var(--shadow-card);
// //         }
// //         .stat-card-top {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           margin-bottom: 12px;
// //         }
// //         .stat-icon {
// //           width: 30px;
// //           height: 30px;
// //           border-radius: 8px;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           flex-shrink: 0;
// //         }
// //         .stat-icon svg { width: 16px; height: 16px; }
// //         .stat-label {
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           color: var(--color-text-secondary);
// //         }
// //         .stat-value {
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-variant-numeric: tabular-nums;
// //           font-size: 26px;
// //           font-weight: 700;
// //           color: var(--color-text);
// //           line-height: 1;
// //         }
// //         .stat-description {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 8px 0 0;
// //           line-height: 1.4;
// //         }

// //         /* ---------------- Charts grid ---------------- */
// //         .chart-grid {
// //           display: grid;
// //           grid-template-columns: repeat(3, 1fr);
// //           gap: 16px;
// //         }
// //         .chart-grid-2 {
// //           display: grid;
// //           grid-template-columns: repeat(2, 1fr);
// //           gap: 16px;
// //         }
// //         .chart-card {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           padding: 18px;
// //           box-shadow: var(--shadow-card);
// //           display: flex;
// //           flex-direction: column;
// //         }
// //         .chart-card-wide {
// //           grid-column: 1 / -1;
// //         }
// //         .chart-card-header {
// //           margin-bottom: 12px;
// //         }
// //         .chart-card-title {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 14.5px;
// //           font-weight: 700;
// //           margin: 0 0 2px;
// //         }
// //         .chart-card-subtitle {
// //           font-size: 12px;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //         }
// //         .chart-card-body {
// //           flex: 1;
// //           min-height: 220px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //         }
// //         .chart-card-footnote {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 12px 0 0;
// //           padding-top: 12px;
// //           border-top: 1px solid var(--color-border);
// //           line-height: 1.5;
// //         }

// //         /* ---------------- Empty states ---------------- */
// //         .empty-state {
// //           width: 100%;
// //           display: flex;
// //           flex-direction: column;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 8px;
// //           padding: 24px 12px;
// //           color: var(--color-text-faint);
// //         }
// //         .empty-state-icon {
// //           width: 34px;
// //           height: 34px;
// //           color: var(--color-text-faint);
// //         }
// //         .empty-state-message {
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //           text-align: center;
// //         }
// //         .empty-state-hint {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 0;
// //           text-align: center;
// //           max-width: 220px;
// //         }

// //         /* ---------------- Small stat rows (family/genetic/physio) ---------------- */
// //         .mini-stat-row {
// //           display: flex;
// //           flex-direction: column;
// //           gap: 10px;
// //           width: 100%;
// //         }
// //         .mini-stat {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           padding: 10px 12px;
// //           border-radius: 9px;
// //           background: var(--color-bg);
// //           border: 1px solid var(--color-border);
// //         }
// //         .mini-stat-label {
// //           font-size: 12.5px;
// //           color: var(--color-text-secondary);
// //           font-weight: 600;
// //         }
// //         .mini-stat-value {
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-size: 14px;
// //           font-weight: 700;
// //           color: var(--color-text);
// //         }

// //         /* ---------------- Clinical attention ---------------- */
// //         .attention-panel {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           box-shadow: var(--shadow-card);
// //           padding: 24px;
// //         }

// //         /* ---------------- Privacy note ---------------- */
// //         .privacy-note {
// //           margin-top: 40px;
// //           display: flex;
// //           gap: 10px;
// //           align-items: flex-start;
// //           padding: 14px 16px;
// //           border-radius: var(--radius-md);
// //           background: var(--color-accent-soft);
// //           border: 1px solid #C7EAE8;
// //         }
// //         .privacy-note svg {
// //           width: 16px;
// //           height: 16px;
// //           color: var(--color-accent);
// //           flex-shrink: 0;
// //           margin-top: 2px;
// //         }
// //         .privacy-note p {
// //           margin: 0;
// //           font-size: 12px;
// //           color: var(--color-text-secondary);
// //           line-height: 1.5;
// //         }

// //         /* ---------------- Responsive ---------------- */
// //         @media (max-width: 1080px) {
// //           .stat-grid { grid-template-columns: repeat(2, 1fr); }
// //           .chart-grid { grid-template-columns: repeat(2, 1fr); }
// //         }
// //         @media (max-width: 720px) {
// //           .dd-main { padding: 24px 16px 48px; }
// //           .stat-grid { grid-template-columns: 1fr; }
// //           .chart-grid { grid-template-columns: 1fr; }
// //           .chart-grid-2 { grid-template-columns: 1fr; }
// //           .dd-doctor-role { display: none; }
// //           .dd-navbar { padding: 12px 16px; }
// //         }

// //         @media (prefers-reduced-motion: reduce) {
// //           .dd-root * { transition: none !important; animation: none !important; }
// //         }
// //       `}</style>

// //       {/* ============================ NAVBAR ============================ */}
// //       <header className="dd-navbar">
// //         <div className="dd-navbar-left">
// //           <div className="dd-logo-mark">{Icon.Cross}</div>
// //           <span className="dd-app-name font-display">Hemophilia Care</span>
// //         </div>
        

// //         <div className="dd-navbar-right">
// //           <button
// //             className="pr-dashboard-btn"
// //             onClick={() => navigate("/doctor/patient-research")}
// //           >
// //             Patient Research
// //           </button>
// //           <div className="dd-doctor-block">
// //             <div className="dd-avatar font-display">{initials}</div>
// //             <div>
// //               {/* BACKEND: doctorName comes from authenticated session — see top of file */}
// //               <div className="dd-doctor-name">{doctorName || "--"}</div>
// //               <div className="dd-doctor-role">{roleName}</div>
// //             </div>
// //           </div>
          
// //           <button className="dd-logout-btn" onClick={handleLogout} type="button">
// //             {Icon.Logout}
// //             Log out
// //           </button>
// //         </div>
// //       </header>

// //       <main className="dd-main">
// //         {/* ============================ WELCOME ============================ */}
// //         <div className="dd-welcome">
// //           <h1 className="dd-welcome-title font-display">Clinical Dashboard</h1>
// //           <p className="dd-welcome-subtitle">
// //             {doctorName ? (
// //               <>
// //                 Welcome back, <span className="dd-welcome-doctor">{doctorName}</span>. Overview of hemophilia care, patient population and clinical trends.
// //               </>
// //             ) : (
// //               "Overview of hemophilia care, patient population and clinical trends."
// //             )}
// //           </p>
// //         </div>

// //         {/* ============================ 1. KPI CARDS ============================ */}
// //         <SectionHeader
// //           eyebrow="Population Overview"
// //           title="Overall Hemophilia Insights"
// //         />
// //         <div className="stat-grid">
// //           <StatCard
// //             label="Total Patients"
// //             value={totalPatients}
// //             description="All patients currently enrolled in the program."
// //             icon={Icon.Users}
// //           />
// //           <StatCard
// //             label="Hemophilia Type A"
// //             value={hemophiliaTypeA}
// //             description="Patients diagnosed with Factor VIII deficiency."
// //             icon={Icon.DropletA}
// //           />
// //           <StatCard
// //             label="Hemophilia Type B"
// //             value={hemophiliaTypeB}
// //             description="Patients diagnosed with Factor IX deficiency."
// //             icon={Icon.DropletA}
// //           />
// //           <StatCard
// //             label="Severe Cases"
// //             value={severeCases}
// //             description="Patients classified with severe disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="Moderate Cases"
// //             value={moderateCases}
// //             description="Patients classified with moderate disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="Mild Cases"
// //             value={mildCases}
// //             description="Patients classified with mild disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="On Factor Therapy"
// //             value={onFactorTherapy}
// //             description="Patients currently receiving factor replacement therapy."
// //             icon={Icon.Therapy}
// //           />
// //           <StatCard
// //             label="Requiring Follow-up"
// //             value={requiringFollowUp}
// //             description="Patients flagged for clinical follow-up."
// //             icon={Icon.FollowUp}
// //           />
// //         </div>

// //         {/* ============================ 2 & 3. TYPE + SEVERITY ============================ */}
// //         <SectionHeader
// //           eyebrow="Distribution"
// //           title="Hemophilia Type & Severity Distribution"
// //           description="Aggregated, anonymized breakdowns across the monitored population — no individual patient data is shown."
// //         />
// //         <div className="chart-grid">
// //           <ChartCard title="Hemophilia Type Distribution" subtitle="Type A · Type B · Type C · Unknown">
// //             {hemophiliaTypes.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once type data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <PieChart>
// //                   <Pie
// //                     data={hemophiliaTypes}
// //                     dataKey="value"
// //                     nameKey="name"
// //                     innerRadius={55}
// //                     outerRadius={80}
// //                     paddingAngle={2}
// //                     >
// //                     {hemophiliaTypes.map((_, i) => (
// //                         <Cell
// //                         key={i}
// //                         fill={
// //                             CHART_COLORS[
// //                             i % CHART_COLORS.length
// //                             ]
// //                         }
// //                         />
// //                     ))}
// //                     </Pie>
// //                   <Tooltip />
// //                 </PieChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>

// //           <ChartCard title="Severity Distribution" subtitle="Mild · Moderate · Severe · Unknown">
// //             {severity.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once severity data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <BarChart data={severity}>
// //                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                   <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <Tooltip />
// //                   <Bar dataKey="value" fill="#2C5CE0" radius={[6, 6, 0, 0]} />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>

// //           <ChartCard title="Age Distribution" subtitle="Aggregated age groups only — no individual DOBs">
// //             {ageDistribution.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once demographic data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <BarChart data={ageDistribution}>
// //                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                   <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <Tooltip />
// //                   <Bar dataKey="value" fill="#0BA5A0" radius={[6, 6, 0, 0]} />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>
// //         </div>

// //         {/* ============================ 4. BLEEDING TRENDS ============================ */}
// //         {/* <SectionHeader
// //           eyebrow="Trends"
// //           title="Bleeding Trend Insights"
// //         />
// //         <ChartCard
// //           title="Bleeding Events Over Time"
// //           subtitle="Monthly aggregated bleeding-event count"
// //           wide
// //           footnote="Tracks aggregated bleeding-event trends over time to help clinicians identify changes in bleeding frequency."
// //         >
// //           {bleedingTrends.length === 0 ? (
// //             <EmptyState
// //               message="Clinical data will appear here once available."
// //               hint="Connect bleeding-event data to populate this trend line."
// //             />
// //           ) : (
// //             <ResponsiveContainer width="100%" height={260}>
// //               <LineChart data={bleedingTrends}>
// //                 <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                 <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <Tooltip />
// //                 <Line
// //                   type="monotone"
// //                   dataKey="events"
// //                   stroke="#2C5CE0"
// //                   strokeWidth={2.5}
// //                   dot={{ r: 3, fill: "#2C5CE0" }}
// //                 />
// //               </LineChart>
// //             </ResponsiveContainer>
// //           )}
// //         </ChartCard> */}

// //         {/* ============================ 5. AFFECTED JOINTS ============================ */}
// //         <SectionHeader
// //           eyebrow="Musculoskeletal"
// //           title="Affected Joint Insights"
// //           description="Aggregate trends across commonly affected joints — individual patient-to-joint mapping is not displayed here."
// //         />
// //         <ChartCard title="Commonly Affected Joints" subtitle="Knee · Elbow · Ankle · Hip · Other" wide>
// //           {affectedJoints.length === 0 ? (
// //             <EmptyState
// //               message="No data available"
// //               hint="Chart will populate once joint-involvement data is connected."
// //             />
// //           ) : (
// //             <ResponsiveContainer width="100%" height={240}>
// //               <BarChart data={affectedJoints} layout="vertical">
// //                 <CartesianGrid stroke="#EEF3FA" horizontal={false} />
// //                 <XAxis type="number" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} width={60} />
// //                 <Tooltip />
// //                 <Bar dataKey="value" fill="#7C9CF0" radius={[0, 6, 6, 0]} />
// //               </BarChart>
// //             </ResponsiveContainer>
// //           )}
// //         </ChartCard>

// //         {/* ============================ 6. FACTOR THERAPY ============================ */}
// //         <SectionHeader eyebrow="Treatment" title="Factor Therapy Insights" />
// //         <ChartCard
// //             title="Factor Therapy Status"
// //             subtitle="Currently on therapy · Not currently · Unknown"
// //             wide
// //             >
// //             {factorTherapy.length === 0 ? (
// //                 <EmptyState
// //                 message="Data unavailable"
// //                 hint="Connect treatment-status data to populate this chart."
// //                 />
// //             ) : (
// //                 <ResponsiveContainer
// //                 width="100%"
// //                 height={220}
// //                 >
// //                 <PieChart>
// //                     <Pie
// //                     data={factorTherapy}
// //                     dataKey="value"
// //                     nameKey="name"
// //                     innerRadius={55}
// //                     outerRadius={80}
// //                     paddingAngle={2}
// //                     >
// //                     {factorTherapy.map((_, i) => (
// //                         <Cell
// //                         key={i}
// //                         fill={
// //                             CHART_COLORS[
// //                             i % CHART_COLORS.length
// //                             ]
// //                         }
// //                         />
// //                     ))}
// //                     </Pie>

// //                     <Tooltip />
// //                 </PieChart>
// //                 </ResponsiveContainer>
// //             )}
// //             </ChartCard>

// //         {/* ============================ 7. FAMILY HISTORY / GENETIC / PHYSIO ============================ */}
// //         <SectionHeader
// //           eyebrow="Clinical Background"
// //           title="Family History, Genetic Testing & Physiotherapy"
// //           description="Aggregated family-history and testing information can help clinicians understand hereditary patterns across the monitored population."
// //         />
// //         <div className="chart-grid-2">
// //           <ChartCard title="Family History" subtitle="Aggregated across population">
// //             <div className="mini-stat-row">
// //               <MiniStat label="Family history present" value={familyHistory.yes} />
// //               <MiniStat label="No family history" value={familyHistory.no} />
// //               <MiniStat label="Unknown" value={familyHistory.unknown} />
// //             </div>
// //           </ChartCard>

// //           <ChartCard title="Genetic Testing" subtitle="Aggregated across population">
// //             <div className="mini-stat-row">
// //               <MiniStat label="Testing completed" value={geneticTesting.done} />
// //               <MiniStat label="Not completed" value={geneticTesting.notDone} />
// //               <MiniStat label="Unknown" value={geneticTesting.unknown} />
// //             </div>
// //           </ChartCard>
// //         </div>

// //         <ChartCard title="Physiotherapy Status" subtitle="Currently under physiotherapy · Not currently · Unknown" wide>
// //           <div className="mini-stat-row">
// //             <MiniStat label="Currently under physiotherapy" value={physiotherapy.current} />
// //             <MiniStat label="Not currently under physiotherapy" value={physiotherapy.notCurrent} />
// //             <MiniStat label="Unknown" value={physiotherapy.unknown} />
// //           </div>
// //         </ChartCard>

// //         {/* ============================ 8. CLINICAL ATTENTION ============================ */}
// //         <SectionHeader
// //           eyebrow="Alerts"
// //           title="Clinical Attention"
// //           description="Authorized, aggregated indicators requiring clinician review. Individual patient records are never rendered on this dashboard."
// //         />
// //         <div className="attention-panel">
// //           {clinicalAlerts.length === 0 ? (
// //             <EmptyState
// //               message="No clinical alerts available"
// //               hint="Follow-up flags, frequent-bleeding indicators and target-joint concerns will appear here once connected."
// //             />
// //           ) : (
// //             // BACKEND: render authorized alert objects here — never construct
// //             // or invent alert entries on the frontend.
// //             <div className="mini-stat-row">
// //               {clinicalAlerts.map((alert, i) => (
// //                 <div className="mini-stat" key={i}>
// //                     <span className="mini-stat-label">
// //                     {alert.title}
// //                     </span>

// //                     <span className="mini-stat-value font-data">
// //                     {alert.count}
// //                     </span>

// //                     {alert.description && (
// //                     <span className="mini-stat-description">
// //                         {alert.description}
// //                     </span>
// //                     )}
// //                 </div>
// //                 ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* ============================ PRIVACY NOTE ============================ */}
// //         <div className="privacy-note">
// //           {Icon.Alert}
// //           <p>
// //             This dashboard displays aggregated, anonymized clinical insights only.
// //             Patient names, IDs, dates of birth and contact details are intentionally
// //             excluded from this view and must not be added to frontend state,
// //             localStorage, console logs, or URLs.
// //           </p>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }

// // function MiniStat({ label, value }) {
// //   const display = value === null || value === undefined ? "--" : value;
// //   return (
// //     <div className="mini-stat">
// //       <span className="mini-stat-label">{label}</span>
// //       <span className="mini-stat-value font-data">{display}</span>
// //     </div>
// //   );
// // }

// // export default DoctorDashboard;



// // import React, { useEffect, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import api from "../apiClient";
// // import {
// //   PieChart,
// //   Pie,
// //   Cell,
// //   BarChart,
// //   Bar,
// //   LineChart,
// //   Line,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// // } from "recharts";

// // /* ============================================================================
// //    DoctorDashboard.jsx
// //    Hemophilia Clinical Management Platform — Clinician Dashboard (UI ONLY)

// //    - No mock/fake patient data anywhere in this file.
// //    - All clinical data is sourced from `dashboardData` below, which is
// //      intentionally null / empty until wired to a real backend.
// //    - Search for "// BACKEND:" comments to find every integration point.
// //    ========================================================================== */

// // /* ----------------------------------------------------------------------------
// //    AUTH / IDENTITY DATA SLOT
// //    BACKEND: replace with the authenticated clinician's name from your auth
// //    context / session (e.g. useAuth().user.name). Do not hardcode.
// // ---------------------------------------------------------------------------- */


// // /* ----------------------------------------------------------------------------
// //    THEME TOKENS
// // ---------------------------------------------------------------------------- */
// // const CHART_COLORS = ["#2C5CE0", "#0BA5A0", "#7C9CF0", "#9FD8D5", "#C6D4EA"];

// // /* ============================================================================
// //    SHARED SUBCOMPONENTS
// //    ========================================================================== */

// // function SectionHeader({ eyebrow, title, description }) {
// //   return (
// //     <div className="section-header">
// //       <div className="section-header-top">
// //         {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
// //         <svg
// //           className="pulse-line"
// //           viewBox="0 0 120 24"
// //           preserveAspectRatio="none"
// //           aria-hidden="true"
// //         >
// //           <polyline
// //             points="0,12 28,12 34,3 40,21 46,12 120,12"
// //             fill="none"
// //             stroke="currentColor"
// //             strokeWidth="2"
// //             strokeLinecap="round"
// //             strokeLinejoin="round"
// //           />
// //         </svg>
// //       </div>
// //       <h2 className="section-title">{title}</h2>
// //       {description && <p className="section-description">{description}</p>}
// //     </div>
// //   );
// // }

// // function EmptyState({ message = "No data available", hint }) {
// //   return (
// //     <div className="empty-state" role="status">
// //       <svg
// //         className="empty-state-icon"
// //         viewBox="0 0 48 48"
// //         fill="none"
// //         aria-hidden="true"
// //       >
// //         <rect
// //           x="6"
// //           y="10"
// //           width="36"
// //           height="28"
// //           rx="4"
// //           stroke="currentColor"
// //           strokeWidth="2"
// //         />
// //         <path
// //           d="M13 30l7-8 6 6 9-11"
// //           stroke="currentColor"
// //           strokeWidth="2"
// //           strokeLinecap="round"
// //           strokeLinejoin="round"
// //         />
// //       </svg>
// //       <p className="empty-state-message">{message}</p>
// //       {hint && <p className="empty-state-hint">{hint}</p>}
// //     </div>
// //   );
// // }

// // function StatCard({ label, value, description, icon }) {
// //   const displayValue =
// //     value === null || value === undefined || value === "" ? "--" : value;
// //   return (
// //     <div className="stat-card">
// //       <div className="stat-card-top">
// //         <span className="stat-icon" aria-hidden="true">
// //           {icon}
// //         </span>
// //         <span className="stat-label">{label}</span>
// //       </div>
// //       <div className="stat-value">{displayValue}</div>
// //       {description && <p className="stat-description">{description}</p>}
// //     </div>
// //   );
// // }

// // function ChartCard({ title, subtitle, footnote, children, wide }) {
// //   return (
// //     <div className={`chart-card ${wide ? "chart-card-wide" : ""}`}>
// //       <div className="chart-card-header">
// //         <h3 className="chart-card-title">{title}</h3>
// //         {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
// //       </div>
// //       <div className="chart-card-body">{children}</div>
// //       {footnote && <p className="chart-card-footnote">{footnote}</p>}
// //     </div>
// //   );
// // }

// // /* Simple inline icon set (no external icon dependency) */
// // const Icon = {
// //   Users: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <circle cx="9" cy="8" r="3.2" />
// //       <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
// //       <circle cx="17" cy="9" r="2.6" />
// //       <path d="M15.8 13.6c2.9.4 5.2 2.9 5.2 6" />
// //     </svg>
// //   ),
// //   DropletA: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 2s7 8.2 7 13a7 7 0 1 1-14 0c0-4.8 7-13 7-13z" />
// //     </svg>
// //   ),
// //   Severity: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M3 20h18M6 20V10M12 20V4M18 20v-7" />
// //     </svg>
// //   ),
// //   Therapy: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <rect x="4" y="9" width="16" height="9" rx="2" />
// //       <path d="M9 9V6a3 3 0 0 1 6 0v3" />
// //     </svg>
// //   ),
// //   FollowUp: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <circle cx="12" cy="12" r="9" />
// //       <path d="M12 7v5l3.2 2" />
// //     </svg>
// //   ),
// //   Logout: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
// //       <path d="M14 15l4-4-4-4M18 11H9" />
// //     </svg>
// //   ),
// //   Cross: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 3v18M3 12h18" strokeLinecap="round" />
// //     </svg>
// //   ),
// //   Alert: (
// //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
// //       <path d="M12 4l9 16H3l9-16z" strokeLinejoin="round" />
// //       <path d="M12 10v4M12 17.5v.01" strokeLinecap="round" />
// //     </svg>
// //   ),
// // };

// // /* ============================================================================
// //    MAIN COMPONENT
// //    ========================================================================== */

// // function DoctorDashboard() {
// //      const navigate = useNavigate();

// //     const [dashboardData, setDashboardData] = useState(null);
// // const [loading, setLoading] = useState(true);
// // const [error, setError] = useState("");
// // const [patientSearch, setPatientSearch] = useState("");

// // const fetchDashboard = async () => {
// //   try {
// //     setLoading(true);
// //     setError("");

// //     const token =
// //       localStorage.getItem("staffAuthToken");

// //     if (!token) {
// //       setError("Doctor authentication required");
// //       return;
// //     }

// //     const response = await api.get(
// //       "/doctor/dashboard",
// //       {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       }
// //     );

// //     setDashboardData(response.data);
// //   } catch (error) {
// //     console.error(
// //       "Dashboard API error:",
// //       error
// //     );

// //     setError(
// //       error.response?.data?.message ||
// //         "Unable to load dashboard"
// //     );
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// // useEffect(() => {
// //   fetchDashboard();
// // }, []);

// // const pendingChangeRequests = Array.isArray(
// //   dashboardData?.changeRequests
// // )
// //   ? dashboardData.changeRequests
// //   : [];

// // const releasePatient = async (requestId) => {
// //   if (!requestId) return;

// //   const confirmed = window.confirm(
// //     "Release this patient? After release, the patient can select a new consulting doctor."
// //   );

// //   if (!confirmed) return;

// //   try {
// //     const token = localStorage.getItem("staffAuthToken");

// //     await api.post(
// //       `/doctor/doctor-change-requests/${requestId}/release`,
// //       {},
// //       {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       }
// //     );

// //     await fetchDashboard();
// //   } catch (err) {
// //     window.alert(
// //       err.response?.data?.message ||
// //         "Unable to release the patient."
// //     );
// //   }
// // };

// // // useEffect(() => {
// // //   const fetchDashboard = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError("");

// // //       const token = localStorage.getItem("staffAuthToken");

// // //       if (!token) {
// // //         setError("Doctor authentication required");
// // //         return;
// // //       }

// // //       const response = await api.get("/doctor/dashboard", {
// // //         headers: {
// // //           Authorization: `Bearer ${token}`,
// // //         },
// // //       });

// // //       console.log("DOCTOR DASHBOARD DATA:", response.data);

// // //       setDashboardData(response.data);
// // //     } catch (err) {
// // //       console.error("Dashboard API error:", err);

// // //       setError(
// // //         err.response?.data?.message ||
// // //           "Unable to load dashboard data"
// // //       );
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   fetchDashboard();
// // // }, []);

// // // =====================================================
// // // DOCTOR
// // // =====================================================

// // const doctorName = dashboardData?.doctor?.fullName || "";
// // const roleName = dashboardData?.doctor?.role || "Clinician";


// // // =====================================================
// // // OVERVIEW
// // // =====================================================

// // const overview = dashboardData?.overview || {};

// // const totalPatients =
// //   Number(overview.totalPatients) || 0;

// // const totalHemophiliaRecords =
// //   Number(overview.totalHemophiliaRecords) || 0;

// // const totalAssessments =
// //   Number(overview.totalAssessments) || 0;

// // const patientsWithBleedingHistory =
// //   Number(overview.patientsWithBleedingHistory) || 0;

// // const patients = Array.isArray(dashboardData?.patients)
// //   ? dashboardData.patients
// //   : [];

// // const filteredPatients = patients.filter((patient) => {
// //   const query = patientSearch.trim().toLowerCase();
// //   if (!query) return true;

// //   return [
// //     patient.fullName,
// //     patient.patientId,
// //     patient.type,
// //     patient.severity,
// //   ]
// //     .filter(Boolean)
// //     .some((value) =>
// //       String(value).toLowerCase().includes(query)
// //     );
// // });


// // // =====================================================
// // // DISTRIBUTIONS
// // // =====================================================

// // const distributions =
// //   dashboardData?.distributions || {};


// // // =====================================================
// // // HEMOPHILIA TYPE
// // //
// // // Backend:
// // // {
// // //   hemophiliaType: {
// // //     A: 0,
// // //     B: 2,
// // //     C: 0,
// // //     Unknown: 0
// // //   }
// // // }
// // //
// // // Frontend/Recharts:
// // // [
// // //   { name: "A", value: 0 },
// // //   { name: "B", value: 2 },
// // //   ...
// // // ]
// // // =====================================================

// // const hemophiliaTypeObject =
// //   distributions.hemophiliaType ||
// //   distributions.hemophiliaTypes ||
// //   {};

// // const hemophiliaTypeA =
// //   Number(hemophiliaTypeObject.A) || 0;

// // const hemophiliaTypeB =
// //   Number(hemophiliaTypeObject.B) || 0;

// // const hemophiliaTypeC =
// //   Number(hemophiliaTypeObject.C) || 0;

// // const hemophiliaTypeUnknown =
// //   Number(hemophiliaTypeObject.Unknown) || 0;

// // const hemophiliaTypes = Array.isArray(
// //   hemophiliaTypeObject
// // )
// //   ? hemophiliaTypeObject
// //   : Object.entries(hemophiliaTypeObject).map(
// //       ([name, value]) => ({
// //         name,
// //         value: Number(value) || 0,
// //       })
// //     );


// // // =====================================================
// // // SEVERITY
// // //
// // // Backend:
// // // {
// // //   Mild: 0,
// // //   Moderate: 2,
// // //   Severe: 0,
// // //   Unknown: 0
// // // }
// // // =====================================================

// // const severityObject =
// //   distributions.severity || {};

// // const mildCases =
// //   Number(severityObject.Mild) || 0;

// // const moderateCases =
// //   Number(severityObject.Moderate) || 0;

// // const severeCases =
// //   Number(severityObject.Severe) || 0;

// // const unknownSeverity =
// //   Number(severityObject.Unknown) || 0;

// // const severity = Array.isArray(severityObject)
// //   ? severityObject
// //   : Object.entries(severityObject).map(
// //       ([name, value]) => ({
// //         name,
// //         value: Number(value) || 0,
// //       })
// //     );


// // // =====================================================
// // // AGE DISTRIBUTION
// // //
// // // Backend should return:
// // // [
// // //   { name: "0-10", value: 1 },
// // //   { name: "11-20", value: 2 },
// // //   ...
// // // ]
// // //
// // // We safely normalize it here.
// // // =====================================================

// // const rawAgeDistribution =
// //   distributions.ageDistribution;

// // const ageDistribution = Array.isArray(
// //   rawAgeDistribution
// // )
// //   ? rawAgeDistribution.map((item) => ({
// //       name:
// //         item.name ??
// //         item.ageGroup ??
// //         item.label ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // AFFECTED JOINTS
// // //
// // // Backend:
// // // [
// // //   { joint: "Elbow", count: 2 },
// // //   { joint: "Shoulder", count: 2 }
// // // ]
// // //
// // // Recharts needs:
// // // [
// // //   { name: "Elbow", value: 2 },
// // //   ...
// // // ]
// // // =====================================================

// // const rawAffectedJoints =
// //   distributions.affectedJoints ||
// //   dashboardData?.clinicalBackground?.jointDistribution ||
// //   [];

// // const affectedJoints = Array.isArray(
// //   rawAffectedJoints
// // )
// //   ? rawAffectedJoints.map((item) => ({
// //       name:
// //         item.name ??
// //         item.joint ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // FACTOR THERAPY
// // //
// // // Backend:
// // // {
// // //   active: 2,
// // //   none: 0,
// // //   unknown: 0
// // // }
// // // =====================================================

// // const factorTherapyObject =
// //   distributions.factorTherapy || {
// //     active: 0,
// //     none: 0,
// //     unknown: 0,
// //   };

// // const onFactorTherapy =
// //   Number(factorTherapyObject.active) || 0;

// // const factorTherapy = [
// //   {
// //     name: "Active Therapy",
// //     value:
// //       Number(factorTherapyObject.active) || 0,
// //   },
// //   {
// //     name: "No Therapy",
// //     value:
// //       Number(factorTherapyObject.none) || 0,
// //   },
// //   {
// //     name: "Unknown",
// //     value:
// //       Number(factorTherapyObject.unknown) || 0,
// //   },
// // ];


// // // =====================================================
// // // FAMILY HISTORY
// // //
// // // Backend:
// // // {
// // //   yes: 0,
// // //   no: 0,
// // //   unknown: 2
// // // }
// // // =====================================================

// // const familyHistory =
// //   distributions.familyHistory || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };


// // // =====================================================
// // // GENETIC TESTING
// // //
// // // Backend:
// // // {
// // //   yes: 0,
// // //   no: 0,
// // //   unknown: 2
// // // }
// // //
// // // Convert to the names your frontend can use.
// // // =====================================================

// // const geneticTestingBackend =
// //   distributions.geneticTesting || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };

// // const geneticTesting = {
// //   done:
// //     Number(geneticTestingBackend.yes) || 0,

// //   notDone:
// //     Number(geneticTestingBackend.no) || 0,

// //   unknown:
// //     Number(geneticTestingBackend.unknown) || 0,
// // };


// // // =====================================================
// // // PHYSIOTHERAPY
// // //
// // // Backend:
// // // {
// // //   yes: 1,
// // //   no: 1,
// // //   unknown: 0
// // // }
// // //
// // // Convert to names used by frontend.
// // // =====================================================

// // const physiotherapyBackend =
// //   distributions.physiotherapy || {
// //     yes: 0,
// //     no: 0,
// //     unknown: 0,
// //   };

// // const physiotherapy = {
// //   current:
// //     Number(physiotherapyBackend.yes) || 0,

// //   notCurrent:
// //     Number(physiotherapyBackend.no) || 0,

// //   unknown:
// //     Number(physiotherapyBackend.unknown) || 0,
// // };


// // // =====================================================
// // // BLEEDING FREQUENCY
// // //
// // // Backend puts this under:
// // // clinicalBackground.bleedingFrequencyDistribution
// // //
// // // Example:
// // // [
// // //   { frequency: "2-3 times", count: 2 }
// // // ]
// // // =====================================================

// // const rawBleedingFrequency =
// //   dashboardData?.clinicalBackground
// //     ?.bleedingFrequencyDistribution || [];

// // const bleedingFrequency = Array.isArray(
// //   rawBleedingFrequency
// // )
// //   ? rawBleedingFrequency.map((item) => ({
// //       name:
// //         item.name ??
// //         item.frequency ??
// //         "Unknown",

// //       value:
// //         Number(
// //           item.value ??
// //           item.count ??
// //           0
// //         ) || 0,
// //     }))
// //   : [];


// // // =====================================================
// // // BLEEDING TRENDS
// // //
// // // Currently backend does not return this,
// // // so keep it safely empty.
// // // =====================================================

// // const bleedingTrends =
// //   Array.isArray(
// //     dashboardData?.bleedingTrends
// //   )
// //     ? dashboardData.bleedingTrends
// //     : [];


// // // =====================================================
// // // CLINICAL ALERTS
// // //
// // // Currently backend does not return this,
// // // so keep it safely empty.
// // // =====================================================

// // const clinicalAlerts =
// //   Array.isArray(
// //     dashboardData?.clinicalAlerts
// //   )
// //     ? dashboardData.clinicalAlerts
// //     : [];


// // // =====================================================
// // // FOLLOW-UP
// // //
// // // Your current backend does not provide a
// // // requiringFollowUp value.
// // //
// // // For now use bleeding-history count as
// // // the closest available indicator.
// // // =====================================================

// // const requiringFollowUp =
// //   patientsWithBleedingHistory;

// //   const initials = doctorName
// //     ? doctorName
// //         .replace(/^Dr\.?\s*/i, "")
// //         .split(" ")
// //         .filter(Boolean)
// //         .map((p) => p[0])
// //         .slice(0, 2)
// //         .join("")
// //         .toUpperCase()
// //     : "--";

 
// //     const handleLogout = () => {
// //     localStorage.removeItem("staffAuthToken");
// //     localStorage.removeItem("staffUser");

// //     delete api.defaults.headers.common["Authorization"];

// //     navigate("/doctor-login");
// //     };
// //     // Intentionally left as an integration point — no auth logic here.
  
// // if (loading) {
// //   return (
// //     <div
// //       style={{
// //         minHeight: "100vh",
// //         display: "flex",
// //         alignItems: "center",
// //         justifyContent: "center",
// //       }}
// //     >
// //       Loading clinical dashboard...
// //     </div>
// //   );
// // }

// // if (error) {
// //   return (
// //     <div
// //       style={{
// //         minHeight: "100vh",
// //         display: "flex",
// //         flexDirection: "column",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         gap: "12px",
// //       }}
// //     >
// //       <h2>Unable to load dashboard</h2>
// //       <p>{error}</p>

// //       <button
// //         onClick={fetchDashboard}
// //         className="main-btn"
// //       >
// //         Retry
// //       </button>
// //     </div>
// //   );
// // }
// //   return (
// //     <div className="dd-root">
// //       <style>{`
// //         .dd-root {
// //           --color-bg: #F5F8FC;
// //           --color-surface: #FFFFFF;
// //           --color-primary: #2C5CE0;
// //           --color-primary-dark: #163B85;
// //           --color-primary-soft: #EAF0FE;
// //           --color-accent: #0BA5A0;
// //           --color-accent-soft: #E4F6F5;
// //           --color-border: #DCE6F2;
// //           --color-text: #10233F;
// //           --color-text-secondary: #5B7291;
// //           --color-text-faint: #93A6C2;
// //           --shadow-card: 0 1px 2px rgba(16, 35, 63, 0.04), 0 6px 20px rgba(16, 35, 63, 0.05);
// //           --radius-lg: 16px;
// //           --radius-md: 12px;

// //           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
// //           background: var(--color-bg);
// //           color: var(--color-text);
// //           min-height: 100vh;
// //         }

// //         .dd-root * { box-sizing: border-box; }

// //         .dd-root .font-display {
// //           font-family: 'Manrope', 'Inter', sans-serif;
// //         }

// //         .dd-root .font-data {
// //           font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
// //           font-variant-numeric: tabular-nums;
// //         }

// //         /* ---------------- Navbar ---------------- */
// //         .dd-navbar {
// //           position: sticky;
// //           top: 0;
// //           z-index: 20;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           padding: 14px 28px;
// //           background: var(--color-surface);
// //           border-bottom: 1px solid var(--color-border);
// //         }
// //         .dd-navbar-left {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }
// //         .dd-logo-mark {
// //           width: 34px;
// //           height: 34px;
// //           border-radius: 9px;
// //           background: linear-gradient(145deg, var(--color-primary), var(--color-primary-dark));
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           color: #fff;
// //         }
// //         .dd-logo-mark svg { width: 18px; height: 18px; }
// //         .dd-app-name {
// //           font-weight: 700;
// //           font-size: 16px;
// //           letter-spacing: -0.01em;
// //           color: var(--color-text);
// //         }
// //         .dd-navbar-right {
// //           display: flex;
// //           align-items: center;
// //           gap: 16px;
// //         }
// //         .pr-dashboard-btn,
// //         .pr-logout-btn {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;

// //           padding: 8px 12px;

// //           border-radius: 9px;

// //           border: 1px solid var(--color-border);

// //           background: var(--color-surface);

// //           color: var(--color-text-secondary);

// //           font-size: 12.5px;
// //           font-weight: 600;

// //           cursor: pointer;

// //           transition: all 0.15s ease;
// //         }

// //         .pr-dashboard-btn:hover,
// //         .pr-logout-btn:hover {
// //           border-color: var(--color-primary);

// //           color: var(--color-primary-dark);

// //           background: var(--color-primary-soft);
// //         }

// //         .pr-dashboard-btn svg {
// //           width: 15px;
// //           height: 15px;
// //         }
// //         .dd-doctor-block {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }
// //         .dd-avatar {
// //           width: 34px;
// //           height: 34px;
// //           border-radius: 50%;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           font-size: 12px;
// //           font-weight: 700;
// //           font-family: 'Manrope', sans-serif;
// //           border: 1px solid var(--color-border);
// //         }
// //         .dd-doctor-name {
// //           font-size: 13.5px;
// //           font-weight: 600;
// //           color: var(--color-text);
// //           line-height: 1.2;
// //         }
// //         .dd-doctor-role {
// //           font-size: 11.5px;
// //           color: var(--color-text-secondary);
// //         }
// //         .dd-logout-btn {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;
// //           padding: 8px 12px;
// //           border-radius: 9px;
// //           border: 1px solid var(--color-border);
// //           background: var(--color-surface);
// //           color: var(--color-text-secondary);
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           cursor: pointer;
// //           transition: all 0.15s ease;
// //         }
// //         .dd-logout-btn:hover {
// //           border-color: var(--color-primary);
// //           color: var(--color-primary-dark);
// //           background: var(--color-primary-soft);
// //         }
// //         .dd-logout-btn svg { width: 15px; height: 15px; }
// //         .dd-logout-btn:focus-visible,
// //         .stat-card:focus-visible {
// //           outline: 2px solid var(--color-primary);
// //           outline-offset: 2px;
// //         }

// //         /* ---------------- Layout ---------------- */
// //         .dd-main {
// //           max-width: 1240px;
// //           margin: 0 auto;
// //           padding: 32px 28px 64px;
// //         }

// //         .dd-welcome {
// //           margin-bottom: 28px;
// //         }
// //         .dd-welcome-title {
// //           font-size: 26px;
// //           font-weight: 800;
// //           letter-spacing: -0.015em;
// //           margin: 0 0 6px;
// //         }
// //         .dd-welcome-subtitle {
// //           font-size: 14.5px;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //         }
// //         .dd-welcome-doctor {
// //           color: var(--color-primary-dark);
// //           font-weight: 700;
// //         }

// //         /* ---------------- Section header w/ signature pulse-line ---------------- */
// //         .section-header {
// //           margin: 44px 0 16px;
// //         }
// //         .section-header-top {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           margin-bottom: 4px;
// //         }
// //         .section-eyebrow {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 11px;
// //           font-weight: 700;
// //           letter-spacing: 0.08em;
// //           text-transform: uppercase;
// //           color: var(--color-primary);
// //         }
// //         .pulse-line {
// //           flex: 1;
// //           height: 16px;
// //           color: var(--color-border);
// //           max-width: 220px;
// //         }
// //         .section-title {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 18px;
// //           font-weight: 700;
// //           margin: 0;
// //           color: var(--color-text);
// //         }
// //         .section-description {
// //           font-size: 13px;
// //           color: var(--color-text-secondary);
// //           margin: 6px 0 0;
// //           max-width: 620px;
// //         }

// //         /* ---------------- KPI grid ---------------- */
// //         .stat-grid {
// //           display: grid;
// //           grid-template-columns: repeat(4, 1fr);
// //           gap: 16px;
// //         }
// //         .stat-card {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           padding: 18px;
// //           box-shadow: var(--shadow-card);
// //         }
// //         .stat-card-top {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           margin-bottom: 12px;
// //         }
// //         .stat-icon {
// //           width: 30px;
// //           height: 30px;
// //           border-radius: 8px;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           flex-shrink: 0;
// //         }
// //         .stat-icon svg { width: 16px; height: 16px; }
// //         .stat-label {
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           color: var(--color-text-secondary);
// //         }
// //         .stat-value {
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-variant-numeric: tabular-nums;
// //           font-size: 26px;
// //           font-weight: 700;
// //           color: var(--color-text);
// //           line-height: 1;
// //         }
// //         .stat-description {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 8px 0 0;
// //           line-height: 1.4;
// //         }

// //         /* ---------------- Charts grid ---------------- */
// //         .chart-grid {
// //           display: grid;
// //           grid-template-columns: repeat(3, 1fr);
// //           gap: 16px;
// //         }
// //         .chart-grid-2 {
// //           display: grid;
// //           grid-template-columns: repeat(2, 1fr);
// //           gap: 16px;
// //         }
// //         .chart-card {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           padding: 18px;
// //           box-shadow: var(--shadow-card);
// //           display: flex;
// //           flex-direction: column;
// //         }
// //         .chart-card-wide {
// //           grid-column: 1 / -1;
// //         }
// //         .chart-card-header {
// //           margin-bottom: 12px;
// //         }
// //         .chart-card-title {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 14.5px;
// //           font-weight: 700;
// //           margin: 0 0 2px;
// //         }
// //         .chart-card-subtitle {
// //           font-size: 12px;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //         }
// //         .chart-card-body {
// //           flex: 1;
// //           min-height: 220px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //         }
// //         .chart-card-footnote {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 12px 0 0;
// //           padding-top: 12px;
// //           border-top: 1px solid var(--color-border);
// //           line-height: 1.5;
// //         }

// //         /* ---------------- Empty states ---------------- */
// //         .empty-state {
// //           width: 100%;
// //           display: flex;
// //           flex-direction: column;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 8px;
// //           padding: 24px 12px;
// //           color: var(--color-text-faint);
// //         }
// //         .empty-state-icon {
// //           width: 34px;
// //           height: 34px;
// //           color: var(--color-text-faint);
// //         }
// //         .empty-state-message {
// //           font-size: 12.5px;
// //           font-weight: 600;
// //           color: var(--color-text-secondary);
// //           margin: 0;
// //           text-align: center;
// //         }
// //         .empty-state-hint {
// //           font-size: 11.5px;
// //           color: var(--color-text-faint);
// //           margin: 0;
// //           text-align: center;
// //           max-width: 220px;
// //         }

// //         /* ---------------- Small stat rows (family/genetic/physio) ---------------- */
// //         .mini-stat-row {
// //           display: flex;
// //           flex-direction: column;
// //           gap: 10px;
// //           width: 100%;
// //         }
// //         .mini-stat {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           padding: 10px 12px;
// //           border-radius: 9px;
// //           background: var(--color-bg);
// //           border: 1px solid var(--color-border);
// //         }
// //         .mini-stat-label {
// //           font-size: 12.5px;
// //           color: var(--color-text-secondary);
// //           font-weight: 600;
// //         }
// //         .mini-stat-value {
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-size: 14px;
// //           font-weight: 700;
// //           color: var(--color-text);
// //         }

// //         /* ---------------- Clinical attention ---------------- */
// //         .attention-panel {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           box-shadow: var(--shadow-card);
// //           padding: 24px;
// //         }

// //         /* ---------------- Privacy note ---------------- */
// //         .privacy-note {
// //           margin-top: 40px;
// //           display: flex;
// //           gap: 10px;
// //           align-items: flex-start;
// //           padding: 14px 16px;
// //           border-radius: var(--radius-md);
// //           background: var(--color-accent-soft);
// //           border: 1px solid #C7EAE8;
// //         }
// //         .privacy-note svg {
// //           width: 16px;
// //           height: 16px;
// //           color: var(--color-accent);
// //           flex-shrink: 0;
// //           margin-top: 2px;
// //         }
// //         .privacy-note p {
// //           margin: 0;
// //           font-size: 12px;
// //           color: var(--color-text-secondary);
// //           line-height: 1.5;
// //         }

// //         /* ---------------- Assigned patients ---------------- */
// //         .patients-panel {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           box-shadow: var(--shadow-card);
// //           overflow: hidden;
// //           margin-bottom: 42px;
// //         }
// //         .patients-panel-top {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 20px;
// //           padding: 20px 22px;
// //           border-bottom: 1px solid var(--color-border);
// //         }
// //         .patients-count {
// //           font-family: 'Manrope', sans-serif;
// //           font-size: 20px;
// //           font-weight: 800;
// //           color: var(--color-text);
// //         }
// //         .patients-count span {
// //           font-family: 'Inter', sans-serif;
// //           font-size: 12px;
// //           font-weight: 600;
// //           color: var(--color-text-secondary);
// //         }
// //         .patients-panel-hint {
// //           margin: 4px 0 0;
// //           font-size: 11.5px;
// //           color: var(--color-text-secondary);
// //         }
// //         .patient-search-wrap {
// //           width: min(360px, 100%);
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           border: 1px solid var(--color-border);
// //           background: var(--color-bg);
// //           border-radius: 10px;
// //           padding: 0 12px;
// //         }
// //         .patient-search-icon {
// //           color: var(--color-text-faint);
// //           font-size: 20px;
// //           line-height: 1;
// //         }
// //         .patient-search-wrap input {
// //           width: 100%;
// //           border: 0;
// //           outline: 0;
// //           background: transparent;
// //           color: var(--color-text);
// //           padding: 11px 0;
// //           font-size: 12px;
// //         }
// //         .patients-table-wrap {
// //           overflow-x: auto;
// //         }
// //         .patients-table {
// //           width: 100%;
// //           border-collapse: collapse;
// //           min-width: 1080px;
// //         }
// //         .patients-table th {
// //           padding: 12px 14px;
// //           text-align: left;
// //           font-size: 10.5px;
// //           text-transform: uppercase;
// //           letter-spacing: .06em;
// //           color: var(--color-text-faint);
// //           background: #F9FBFE;
// //           border-bottom: 1px solid var(--color-border);
// //           white-space: nowrap;
// //         }
// //         .patients-table td {
// //           padding: 13px 14px;
// //           border-bottom: 1px solid #EDF2F8;
// //           font-size: 12px;
// //           color: var(--color-text-secondary);
// //           white-space: nowrap;
// //         }
// //         .patients-table tbody tr:hover { background: #FBFDFF; }
// //         .patient-name-cell {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //           min-width: 180px;
// //         }
// //         .patient-mini-avatar {
// //           width: 34px;
// //           height: 34px;
// //           flex: 0 0 34px;
// //           border-radius: 50%;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           border: 1px solid var(--color-border);
// //           font-size: 10px;
// //           font-weight: 800;
// //         }
// //         .patient-name-cell strong,
// //         .patient-name-cell span {
// //           display: block;
// //         }
// //         .patient-name-cell strong {
// //           color: var(--color-text);
// //           font-size: 12.5px;
// //           margin-bottom: 2px;
// //         }
// //         .patient-name-cell span {
// //           color: var(--color-text-faint);
// //           font-size: 10.5px;
// //         }
// //         .patient-id-badge {
// //           display: inline-flex;
// //           padding: 5px 7px;
// //           border-radius: 7px;
// //           background: var(--color-bg);
// //           border: 1px solid var(--color-border);
// //           color: var(--color-text);
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-size: 10.5px;
// //           font-weight: 700;
// //         }
// //         .clinical-pill {
// //           display: inline-flex;
// //           align-items: center;
// //           padding: 5px 8px;
// //           border-radius: 999px;
// //           border: 1px solid var(--color-border);
// //           background: var(--color-bg);
// //           color: var(--color-text-secondary);
// //           font-size: 10px;
// //           font-weight: 700;
// //           text-transform: capitalize;
// //         }
// //         .severity-severe, .risk-emergency {
// //           background: #FFF1F1;
// //           border-color: #F2C9C9;
// //           color: #A52B2B;
// //         }
// //         .severity-moderate, .risk-high {
// //           background: #FFF7E8;
// //           border-color: #F0D7A5;
// //           color: #8A5A00;
// //         }
// //         .severity-mild, .risk-low {
// //           background: #EDF9F7;
// //           border-color: #BDE8E2;
// //           color: #16746F;
// //         }
// //         .view-patient-btn {
// //           border: 0;
// //           background: transparent;
// //           color: var(--color-primary);
// //           font-size: 11px;
// //           font-weight: 800;
// //           cursor: pointer;
// //           padding: 6px 0;
// //         }
// //         .view-patient-btn:hover { color: var(--color-primary-dark); }
// //         .muted-value { color: var(--color-text-faint); }

// //         /* ---------------- Doctor change requests ---------------- */
// //         .change-requests-panel {
// //           background: var(--color-surface);
// //           border: 1px solid var(--color-border);
// //           border-radius: var(--radius-lg);
// //           box-shadow: var(--shadow-card);
// //           padding: 4px 20px;
// //           margin-bottom: 42px;
// //         }
// //         .change-request-list {
// //           display: flex;
// //           flex-direction: column;
// //         }
// //         .change-request-item {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 20px;
// //           padding: 16px 2px;
// //           border-bottom: 1px solid #EDF2F8;
// //         }
// //         .change-request-item:last-child { border-bottom: 0; }
// //         .change-request-main {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           min-width: 0;
// //         }
// //         .change-request-avatar {
// //           width: 38px;
// //           height: 38px;
// //           flex: 0 0 38px;
// //           border-radius: 50%;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           background: var(--color-primary-soft);
// //           color: var(--color-primary-dark);
// //           font-size: 10px;
// //           font-weight: 800;
// //           border: 1px solid var(--color-border);
// //         }
// //         .change-request-main strong,
// //         .change-request-main span,
// //         .change-request-main p {
// //           display: block;
// //         }
// //         .change-request-main strong {
// //           color: var(--color-text);
// //           font-size: 13px;
// //         }
// //         .change-request-main span {
// //           margin-top: 2px;
// //           color: var(--color-text-faint);
// //           font-family: 'IBM Plex Mono', monospace;
// //           font-size: 10px;
// //         }
// //         .change-request-main p {
// //           margin: 5px 0 0;
// //           color: var(--color-text-secondary);
// //           font-size: 11px;
// //           max-width: 600px;
// //           white-space: normal;
// //         }
// //         .change-request-actions {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //           flex-shrink: 0;
// //         }
// //         .request-pending-pill {
// //           padding: 5px 8px;
// //           border-radius: 999px;
// //           background: #FFF7E8;
// //           border: 1px solid #F0D7A5;
// //           color: #8A5A00 !important;
// //           font-family: 'Inter', sans-serif !important;
// //           font-size: 10px !important;
// //           font-weight: 700;
// //         }
// //         .release-patient-btn {
// //           border: 1px solid #D8A9A9;
// //           background: #FFF7F7;
// //           color: #9B3030;
// //           border-radius: 9px;
// //           padding: 8px 11px;
// //           font-size: 11px;
// //           font-weight: 800;
// //           cursor: pointer;
// //         }
// //         .release-patient-btn:hover {
// //           background: #FFF0F0;
// //           border-color: #C98484;
// //         }

// //         /* ---------------- Responsive ---------------- */
// //         @media (max-width: 1080px) {
// //           .stat-grid { grid-template-columns: repeat(2, 1fr); }
// //           .chart-grid { grid-template-columns: repeat(2, 1fr); }
// //         }
// //         @media (max-width: 720px) {
// //           .dd-main { padding: 24px 16px 48px; }
// //           .stat-grid { grid-template-columns: 1fr; }
// //           .chart-grid { grid-template-columns: 1fr; }
// //           .chart-grid-2 { grid-template-columns: 1fr; }
// //           .dd-doctor-role { display: none; }
// //           .dd-navbar { padding: 12px 16px; }
// //         }

// //         @media (prefers-reduced-motion: reduce) {
// //           .dd-root * { transition: none !important; animation: none !important; }
// //         }
// //       `}</style>

// //       {/* ============================ NAVBAR ============================ */}
// //       <header className="dd-navbar">
// //         <div className="dd-navbar-left">
// //           <div className="dd-logo-mark">{Icon.Cross}</div>
// //           <span className="dd-app-name font-display">Hemophilia Care</span>
// //         </div>
        

// //         <div className="dd-navbar-right">
// //           <button
// //             className="pr-dashboard-btn"
// //             onClick={() => navigate("/doctor/patient-research")}
// //           >
// //             Patient Research
// //           </button>
// //           <div className="dd-doctor-block">
// //             <div className="dd-avatar font-display">{initials}</div>
// //             <div>
// //               {/* BACKEND: doctorName comes from authenticated session — see top of file */}
// //               <div className="dd-doctor-name">{doctorName || "--"}</div>
// //               <div className="dd-doctor-role">{roleName}</div>
// //             </div>
// //           </div>
          
// //           <button className="dd-logout-btn" onClick={handleLogout} type="button">
// //             {Icon.Logout}
// //             Log out
// //           </button>
// //         </div>
// //       </header>

// //       <main className="dd-main">
// //         {/* ============================ WELCOME ============================ */}
// //         <div className="dd-welcome">
// //           <h1 className="dd-welcome-title font-display">Clinical Dashboard</h1>
// //           <p className="dd-welcome-subtitle">
// //             {doctorName ? (
// //               <>
// //                 Welcome back, <span className="dd-welcome-doctor">{doctorName}</span>. Overview of hemophilia care, patient population and clinical trends.
// //               </>
// //             ) : (
// //               "Overview of hemophilia care, patient population and clinical trends."
// //             )}
// //           </p>
// //         </div>

// //         {/* ============================ MY PATIENTS ============================ */}
// //         <SectionHeader
// //           eyebrow="Assigned Care"
// //           title="My Patients"
// //           description="Patients currently assigned to you as their consulting doctor. Select a patient to open the complete clinical research record."
// //         />

// //         <section className="patients-panel">
// //           <div className="patients-panel-top">
// //             <div>
// //               <div className="patients-count">
// //                 {patients.length} <span>assigned patient{patients.length === 1 ? "" : "s"}</span>
// //               </div>
// //               <p className="patients-panel-hint">
// //                 Only patients whose current consulting doctor is you are shown here.
// //               </p>
// //             </div>

// //             <div className="patient-search-wrap">
// //               <span className="patient-search-icon">⌕</span>
// //               <input
// //                 type="search"
// //                 value={patientSearch}
// //                 onChange={(e) => setPatientSearch(e.target.value)}
// //                 placeholder="Search name, Patient ID, type..."
// //                 aria-label="Search assigned patients"
// //               />
// //             </div>
// //           </div>

// //           {filteredPatients.length === 0 ? (
// //             <EmptyState
// //               message={patients.length === 0 ? "No patients are currently assigned to you." : "No matching patients found."}
// //               hint={patients.length === 0 ? "Patients will appear here after they select you as their consulting doctor." : "Try searching by patient name or Patient ID."}
// //             />
// //           ) : (
// //             <div className="patients-table-wrap">
// //               <table className="patients-table">
// //                 <thead>
// //                   <tr>
// //                     <th>Patient</th>
// //                     <th>Patient ID</th>
// //                     <th>Age</th>
// //                     <th>Type</th>
// //                     <th>Severity</th>
// //                     <th>Last Bleed</th>
// //                     <th>Target Joint</th>
// //                     <th>Assessment</th>
// //                     <th></th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {filteredPatients.map((patient) => {
// //                     const assessment = patient.latestAssessment;
// //                     return (
// //                       <tr key={String(patient.userId || patient.patientId)}>
// //                         <td>
// //                           <div className="patient-name-cell">
// //                             <div className="patient-mini-avatar">
// //                               {(patient.fullName || patient.patientId || "P")
// //                                 .split(" ")
// //                                 .filter(Boolean)
// //                                 .map((part) => part[0])
// //                                 .slice(0, 2)
// //                                 .join("")
// //                                 .toUpperCase()}
// //                             </div>
// //                             <div>
// //                               <strong>{patient.fullName || "Unnamed patient"}</strong>
// //                               <span>{patient.gender || "Gender not recorded"}</span>
// //                             </div>
// //                           </div>
// //                         </td>
// //                         <td><span className="patient-id-badge">{patient.patientId || "--"}</span></td>
// //                         <td>{patient.age ?? "--"}</td>
// //                         <td>{patient.type || "--"}</td>
// //                         <td>
// //                           <span className={`clinical-pill severity-${String(patient.severity || "unknown").toLowerCase()}`}>
// //                             {patient.severity || "Unknown"}
// //                           </span>
// //                         </td>
// //                         <td>{patient.lastBleedDate ? new Date(patient.lastBleedDate).toLocaleDateString() : "Not recorded"}</td>
// //                         <td>{patient.targetJoint || "None recorded"}</td>
// //                         <td>
// //                           {assessment ? (
// //                             <span className={`clinical-pill risk-${String(assessment.riskLevel || "unknown").toLowerCase()}`}>
// //                               {assessment.riskLevel || "Unknown"}
// //                             </span>
// //                           ) : (
// //                             <span className="muted-value">No assessment</span>
// //                           )}
// //                         </td>
// //                         <td>
// //                           <button
// //                             type="button"
// //                             className="view-patient-btn"
// //                             onClick={() =>
// //                               navigate(`/doctor/patient-research?patientId=${encodeURIComponent(patient.patientId || "")}`)
// //                             }
// //                           >
// //                             View Record →
// //                           </button>
// //                         </td>
// //                       </tr>
// //                     );
// //                   })}
// //                 </tbody>
// //               </table>
// //             </div>
// //           )}
// //         </section>

// //         {/* ============================ CHANGE REQUESTS ============================ */}
// //         <SectionHeader
// //           eyebrow="Doctor Action"
// //           title="Doctor Change Requests"
// //           description="Patients currently assigned to you who have requested to change their consulting doctor."
// //         />

// //         <section className="change-requests-panel">
// //           {pendingChangeRequests.length === 0 ? (
// //             <EmptyState
// //               message="No pending doctor-change requests."
// //               hint="New requests from your assigned patients will appear here."
// //             />
// //           ) : (
// //             <div className="change-request-list">
// //               {pendingChangeRequests.map((request) => (
// //                 <div className="change-request-item" key={String(request.id)}>
// //                   <div className="change-request-main">
// //                     <div className="change-request-avatar">
// //                       {(request.patientName || request.patientId || "P")
// //                         .split(" ")
// //                         .filter(Boolean)
// //                         .map((part) => part[0])
// //                         .slice(0, 2)
// //                         .join("")
// //                         .toUpperCase()}
// //                     </div>
// //                     <div>
// //                       <strong>{request.patientName || "Unnamed patient"}</strong>
// //                       <span>{request.patientId || "Patient ID unavailable"}</span>
// //                       {request.reason && (
// //                         <p>Reason: {request.reason}</p>
// //                       )}
// //                     </div>
// //                   </div>
// //                   <div className="change-request-actions">
// //                     <span className="request-pending-pill">Pending</span>
// //                     <button
// //                       type="button"
// //                       className="release-patient-btn"
// //                       onClick={() => releasePatient(request.id)}
// //                     >
// //                       Release Patient
// //                     </button>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           )}
// //         </section>

// //         {/* ============================ 1. KPI CARDS ============================ */}
// //         <SectionHeader
// //           eyebrow="Population Overview"
// //           title="Overall Hemophilia Insights"
// //         />
// //         <div className="stat-grid">
// //           <StatCard
// //             label="Total Patients"
// //             value={totalPatients}
// //             description="All patients currently enrolled in the program."
// //             icon={Icon.Users}
// //           />
// //           <StatCard
// //             label="Hemophilia Type A"
// //             value={hemophiliaTypeA}
// //             description="Patients diagnosed with Factor VIII deficiency."
// //             icon={Icon.DropletA}
// //           />
// //           <StatCard
// //             label="Hemophilia Type B"
// //             value={hemophiliaTypeB}
// //             description="Patients diagnosed with Factor IX deficiency."
// //             icon={Icon.DropletA}
// //           />
// //           <StatCard
// //             label="Severe Cases"
// //             value={severeCases}
// //             description="Patients classified with severe disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="Moderate Cases"
// //             value={moderateCases}
// //             description="Patients classified with moderate disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="Mild Cases"
// //             value={mildCases}
// //             description="Patients classified with mild disease severity."
// //             icon={Icon.Severity}
// //           />
// //           <StatCard
// //             label="On Factor Therapy"
// //             value={onFactorTherapy}
// //             description="Patients currently receiving factor replacement therapy."
// //             icon={Icon.Therapy}
// //           />
// //           <StatCard
// //             label="Requiring Follow-up"
// //             value={requiringFollowUp}
// //             description="Patients flagged for clinical follow-up."
// //             icon={Icon.FollowUp}
// //           />
// //         </div>

// //         {/* ============================ 2 & 3. TYPE + SEVERITY ============================ */}
// //         <SectionHeader
// //           eyebrow="Distribution"
// //           title="Hemophilia Type & Severity Distribution"
// //           description="Aggregated breakdowns across your currently assigned patient population."
// //         />
// //         <div className="chart-grid">
// //           <ChartCard title="Hemophilia Type Distribution" subtitle="Type A · Type B · Type C · Unknown">
// //             {hemophiliaTypes.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once type data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <PieChart>
// //                   <Pie
// //                     data={hemophiliaTypes}
// //                     dataKey="value"
// //                     nameKey="name"
// //                     innerRadius={55}
// //                     outerRadius={80}
// //                     paddingAngle={2}
// //                     >
// //                     {hemophiliaTypes.map((_, i) => (
// //                         <Cell
// //                         key={i}
// //                         fill={
// //                             CHART_COLORS[
// //                             i % CHART_COLORS.length
// //                             ]
// //                         }
// //                         />
// //                     ))}
// //                     </Pie>
// //                   <Tooltip />
// //                 </PieChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>

// //           <ChartCard title="Severity Distribution" subtitle="Mild · Moderate · Severe · Unknown">
// //             {severity.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once severity data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <BarChart data={severity}>
// //                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                   <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <Tooltip />
// //                   <Bar dataKey="value" fill="#2C5CE0" radius={[6, 6, 0, 0]} />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>

// //           <ChartCard title="Age Distribution" subtitle="Aggregated age groups only — no individual DOBs">
// //             {ageDistribution.length === 0 ? (
// //               <EmptyState
// //                 message="No clinical data available"
// //                 hint="Chart will populate once demographic data is connected."
// //               />
// //             ) : (
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <BarChart data={ageDistribution}>
// //                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                   <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                   <Tooltip />
// //                   <Bar dataKey="value" fill="#0BA5A0" radius={[6, 6, 0, 0]} />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             )}
// //           </ChartCard>
// //         </div>

// //         {/* ============================ 4. BLEEDING TRENDS ============================ */}
// //         {/* <SectionHeader
// //           eyebrow="Trends"
// //           title="Bleeding Trend Insights"
// //         />
// //         <ChartCard
// //           title="Bleeding Events Over Time"
// //           subtitle="Monthly aggregated bleeding-event count"
// //           wide
// //           footnote="Tracks aggregated bleeding-event trends over time to help clinicians identify changes in bleeding frequency."
// //         >
// //           {bleedingTrends.length === 0 ? (
// //             <EmptyState
// //               message="Clinical data will appear here once available."
// //               hint="Connect bleeding-event data to populate this trend line."
// //             />
// //           ) : (
// //             <ResponsiveContainer width="100%" height={260}>
// //               <LineChart data={bleedingTrends}>
// //                 <CartesianGrid stroke="#EEF3FA" vertical={false} />
// //                 <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <Tooltip />
// //                 <Line
// //                   type="monotone"
// //                   dataKey="events"
// //                   stroke="#2C5CE0"
// //                   strokeWidth={2.5}
// //                   dot={{ r: 3, fill: "#2C5CE0" }}
// //                 />
// //               </LineChart>
// //             </ResponsiveContainer>
// //           )}
// //         </ChartCard> */}

// //         {/* ============================ 5. AFFECTED JOINTS ============================ */}
// //         <SectionHeader
// //           eyebrow="Musculoskeletal"
// //           title="Affected Joint Insights"
// //           description="Aggregate trends across commonly affected joints for your currently assigned patients."
// //         />
// //         <ChartCard title="Commonly Affected Joints" subtitle="Knee · Elbow · Ankle · Hip · Other" wide>
// //           {affectedJoints.length === 0 ? (
// //             <EmptyState
// //               message="No data available"
// //               hint="Chart will populate once joint-involvement data is connected."
// //             />
// //           ) : (
// //             <ResponsiveContainer width="100%" height={240}>
// //               <BarChart data={affectedJoints} layout="vertical">
// //                 <CartesianGrid stroke="#EEF3FA" horizontal={false} />
// //                 <XAxis type="number" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
// //                 <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} width={60} />
// //                 <Tooltip />
// //                 <Bar dataKey="value" fill="#7C9CF0" radius={[0, 6, 6, 0]} />
// //               </BarChart>
// //             </ResponsiveContainer>
// //           )}
// //         </ChartCard>

// //         {/* ============================ 6. FACTOR THERAPY ============================ */}
// //         <SectionHeader eyebrow="Treatment" title="Factor Therapy Insights" />
// //         <ChartCard
// //             title="Factor Therapy Status"
// //             subtitle="Currently on therapy · Not currently · Unknown"
// //             wide
// //             >
// //             {factorTherapy.length === 0 ? (
// //                 <EmptyState
// //                 message="Data unavailable"
// //                 hint="Connect treatment-status data to populate this chart."
// //                 />
// //             ) : (
// //                 <ResponsiveContainer
// //                 width="100%"
// //                 height={220}
// //                 >
// //                 <PieChart>
// //                     <Pie
// //                     data={factorTherapy}
// //                     dataKey="value"
// //                     nameKey="name"
// //                     innerRadius={55}
// //                     outerRadius={80}
// //                     paddingAngle={2}
// //                     >
// //                     {factorTherapy.map((_, i) => (
// //                         <Cell
// //                         key={i}
// //                         fill={
// //                             CHART_COLORS[
// //                             i % CHART_COLORS.length
// //                             ]
// //                         }
// //                         />
// //                     ))}
// //                     </Pie>

// //                     <Tooltip />
// //                 </PieChart>
// //                 </ResponsiveContainer>
// //             )}
// //             </ChartCard>

// //         {/* ============================ 7. FAMILY HISTORY / GENETIC / PHYSIO ============================ */}
// //         <SectionHeader
// //           eyebrow="Clinical Background"
// //           title="Family History, Genetic Testing & Physiotherapy"
// //           description="Aggregated family-history and testing information for your currently assigned patients."
// //         />
// //         <div className="chart-grid-2">
// //           <ChartCard title="Family History" subtitle="Aggregated across population">
// //             <div className="mini-stat-row">
// //               <MiniStat label="Family history present" value={familyHistory.yes} />
// //               <MiniStat label="No family history" value={familyHistory.no} />
// //               <MiniStat label="Unknown" value={familyHistory.unknown} />
// //             </div>
// //           </ChartCard>

// //           <ChartCard title="Genetic Testing" subtitle="Aggregated across population">
// //             <div className="mini-stat-row">
// //               <MiniStat label="Testing completed" value={geneticTesting.done} />
// //               <MiniStat label="Not completed" value={geneticTesting.notDone} />
// //               <MiniStat label="Unknown" value={geneticTesting.unknown} />
// //             </div>
// //           </ChartCard>
// //         </div>

// //         <ChartCard title="Physiotherapy Status" subtitle="Currently under physiotherapy · Not currently · Unknown" wide>
// //           <div className="mini-stat-row">
// //             <MiniStat label="Currently under physiotherapy" value={physiotherapy.current} />
// //             <MiniStat label="Not currently under physiotherapy" value={physiotherapy.notCurrent} />
// //             <MiniStat label="Unknown" value={physiotherapy.unknown} />
// //           </div>
// //         </ChartCard>

// //         {/* ============================ 8. CLINICAL ATTENTION ============================ */}
// //         <SectionHeader
// //           eyebrow="Alerts"
// //           title="Clinical Attention"
// //           description="Authorized, aggregated indicators requiring clinician review. Individual patient records are never rendered on this dashboard."
// //         />
// //         <div className="attention-panel">
// //           {clinicalAlerts.length === 0 ? (
// //             <EmptyState
// //               message="No clinical alerts available"
// //               hint="Follow-up flags, frequent-bleeding indicators and target-joint concerns will appear here once connected."
// //             />
// //           ) : (
// //             // BACKEND: render authorized alert objects here — never construct
// //             // or invent alert entries on the frontend.
// //             <div className="mini-stat-row">
// //               {clinicalAlerts.map((alert, i) => (
// //                 <div className="mini-stat" key={i}>
// //                     <span className="mini-stat-label">
// //                     {alert.title}
// //                     </span>

// //                     <span className="mini-stat-value font-data">
// //                     {alert.count}
// //                     </span>

// //                     {alert.description && (
// //                     <span className="mini-stat-description">
// //                         {alert.description}
// //                     </span>
// //                     )}
// //                 </div>
// //                 ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* ============================ PRIVACY NOTE ============================ */}
// //         <div className="privacy-note">
// //           {Icon.Alert}
// //           <p>
// //             Patient-level information on the My Patients table is shown only for patients
// //             currently assigned to the authenticated doctor. The research view is also
// //             server-authorized against the current doctor-patient assignment.
// //           </p>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // }

// // function MiniStat({ label, value }) {
// //   const display = value === null || value === undefined ? "--" : value;
// //   return (
// //     <div className="mini-stat">
// //       <span className="mini-stat-label">{label}</span>
// //       <span className="mini-stat-value font-data">{display}</span>
// //     </div>
// //   );
// // }

// // export default DoctorDashboard;






// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../apiClient";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// /* ============================================================================
//    DoctorDashboard.jsx
//    Hemophilia Clinical Management Platform — Clinician Dashboard (UI ONLY)

//    - No mock/fake patient data anywhere in this file.
//    - All clinical data is sourced from `dashboardData` below, which is
//      intentionally null / empty until wired to a real backend.
//    - Search for "// BACKEND:" comments to find every integration point.
//    ========================================================================== */

// /* ----------------------------------------------------------------------------
//    AUTH / IDENTITY DATA SLOT
//    BACKEND: replace with the authenticated clinician's name from your auth
//    context / session (e.g. useAuth().user.name). Do not hardcode.
// ---------------------------------------------------------------------------- */


// /* ----------------------------------------------------------------------------
//    THEME TOKENS
// ---------------------------------------------------------------------------- */
// const CHART_COLORS = ["#2C5CE0", "#0BA5A0", "#7C9CF0", "#9FD8D5", "#C6D4EA"];

// /* ============================================================================
//    SHARED SUBCOMPONENTS
//    ========================================================================== */

// function SectionHeader({ eyebrow, title, description }) {
//   return (
//     <div className="section-header">
//       <div className="section-header-top">
//         {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
//         <svg
//           className="pulse-line"
//           viewBox="0 0 120 24"
//           preserveAspectRatio="none"
//           aria-hidden="true"
//         >
//           <polyline
//             points="0,12 28,12 34,3 40,21 46,12 120,12"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </div>
//       <h2 className="section-title">{title}</h2>
//       {description && <p className="section-description">{description}</p>}
//     </div>
//   );
// }

// function EmptyState({ message = "No data available", hint }) {
//   return (
//     <div className="empty-state" role="status">
//       <svg
//         className="empty-state-icon"
//         viewBox="0 0 48 48"
//         fill="none"
//         aria-hidden="true"
//       >
//         <rect
//           x="6"
//           y="10"
//           width="36"
//           height="28"
//           rx="4"
//           stroke="currentColor"
//           strokeWidth="2"
//         />
//         <path
//           d="M13 30l7-8 6 6 9-11"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//       </svg>
//       <p className="empty-state-message">{message}</p>
//       {hint && <p className="empty-state-hint">{hint}</p>}
//     </div>
//   );
// }

// function StatCard({ label, value, description, icon }) {
//   const displayValue =
//     value === null || value === undefined || value === "" ? "--" : value;
//   return (
//     <div className="stat-card">
//       <div className="stat-card-top">
//         <span className="stat-icon" aria-hidden="true">
//           {icon}
//         </span>
//         <span className="stat-label">{label}</span>
//       </div>
//       <div className="stat-value">{displayValue}</div>
//       {description && <p className="stat-description">{description}</p>}
//     </div>
//   );
// }

// function ChartCard({ title, subtitle, footnote, children, wide }) {
//   return (
//     <div className={`chart-card ${wide ? "chart-card-wide" : ""}`}>
//       <div className="chart-card-header">
//         <h3 className="chart-card-title">{title}</h3>
//         {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
//       </div>
//       <div className="chart-card-body">{children}</div>
//       {footnote && <p className="chart-card-footnote">{footnote}</p>}
//     </div>
//   );
// }

// /* Simple inline icon set (no external icon dependency) */
// const Icon = {
//   Users: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <circle cx="9" cy="8" r="3.2" />
//       <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
//       <circle cx="17" cy="9" r="2.6" />
//       <path d="M15.8 13.6c2.9.4 5.2 2.9 5.2 6" />
//     </svg>
//   ),
//   DropletA: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <path d="M12 2s7 8.2 7 13a7 7 0 1 1-14 0c0-4.8 7-13 7-13z" />
//     </svg>
//   ),
//   Severity: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <path d="M3 20h18M6 20V10M12 20V4M18 20v-7" />
//     </svg>
//   ),
//   Therapy: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <rect x="4" y="9" width="16" height="9" rx="2" />
//       <path d="M9 9V6a3 3 0 0 1 6 0v3" />
//     </svg>
//   ),
//   FollowUp: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <circle cx="12" cy="12" r="9" />
//       <path d="M12 7v5l3.2 2" />
//     </svg>
//   ),
//   Logout: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
//       <path d="M14 15l4-4-4-4M18 11H9" />
//     </svg>
//   ),
//   Cross: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <path d="M12 3v18M3 12h18" strokeLinecap="round" />
//     </svg>
//   ),
//   Alert: (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//       <path d="M12 4l9 16H3l9-16z" strokeLinejoin="round" />
//       <path d="M12 10v4M12 17.5v.01" strokeLinecap="round" />
//     </svg>
//   ),
// };

// /* ============================================================================
//    MAIN COMPONENT
//    ========================================================================== */

// function DoctorDashboard() {
//      const navigate = useNavigate();

//     const [dashboardData, setDashboardData] = useState(null);
// const [loading, setLoading] = useState(true);
// const [error, setError] = useState("");
// const [patientSearch, setPatientSearch] = useState("");
// const [releaseRequest, setReleaseRequest] = useState(null);
// const [releaseLoading, setReleaseLoading] = useState(false);
// const [releaseSuccess, setReleaseSuccess] = useState("");

// const fetchDashboard = async () => {
//   try {
//     setLoading(true);
//     setError("");

//     const token =
//       localStorage.getItem("staffAuthToken");

//     if (!token) {
//       setError("Doctor authentication required");
//       return;
//     }

//     const response = await api.get(
//       "/doctor/dashboard",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     setDashboardData(response.data);
//   } catch (error) {
//     console.error(
//       "Dashboard API error:",
//       error
//     );

//     setError(
//       error.response?.data?.message ||
//         "Unable to load dashboard"
//     );
//   } finally {
//     setLoading(false);
//   }
// };
// useEffect(() => {
//   fetchDashboard();
// }, []);

// const pendingChangeRequests = Array.isArray(
//   dashboardData?.changeRequests
// )
//   ? dashboardData.changeRequests
//   : [];

// const openReleaseModal = (request) => {
//   setError("");
//   setReleaseSuccess("");
//   setReleaseRequest(request);
// };

// const closeReleaseModal = () => {
//   if (releaseLoading) return;
//   setReleaseRequest(null);
// };

// const releasePatient = async () => {
//   const requestId = releaseRequest?.id;
//   if (!requestId || releaseLoading) return;

//   try {
//     setReleaseLoading(true);
//     setError("");
//     setReleaseSuccess("");

//     const token = localStorage.getItem("staffAuthToken");

//     const response = await api.post(
//       `/doctor/doctor-change-requests/${requestId}/release`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     setReleaseRequest(null);
//     setReleaseSuccess(
//       response.data?.message ||
//         "Patient released successfully. The patient can now select a new consulting doctor."
//     );

//     await fetchDashboard();

//     window.setTimeout(() => {
//       setReleaseSuccess("");
//     }, 3500);
//   } catch (err) {
//     console.error("Release patient error:", err);
//     setError(
//       err.response?.data?.message ||
//         "Unable to release the patient. Please try again."
//     );
//     setReleaseRequest(null);
//   } finally {
//     setReleaseLoading(false);
//   }
// };

// // useEffect(() => {
// //   const fetchDashboard = async () => {
// //     try {
// //       setLoading(true);
// //       setError("");

// //       const token = localStorage.getItem("staffAuthToken");

// //       if (!token) {
// //         setError("Doctor authentication required");
// //         return;
// //       }

// //       const response = await api.get("/doctor/dashboard", {
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //       });

// //       console.log("DOCTOR DASHBOARD DATA:", response.data);

// //       setDashboardData(response.data);
// //     } catch (err) {
// //       console.error("Dashboard API error:", err);

// //       setError(
// //         err.response?.data?.message ||
// //           "Unable to load dashboard data"
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   fetchDashboard();
// // }, []);

// // =====================================================
// // DOCTOR
// // =====================================================

// const doctorName = dashboardData?.doctor?.fullName || "";
// const roleName = dashboardData?.doctor?.role || "Clinician";


// // =====================================================
// // OVERVIEW
// // =====================================================

// const overview = dashboardData?.overview || {};

// const totalPatients =
//   Number(overview.totalPatients) || 0;

// const totalHemophiliaRecords =
//   Number(overview.totalHemophiliaRecords) || 0;

// const totalAssessments =
//   Number(overview.totalAssessments) || 0;

// const patientsWithBleedingHistory =
//   Number(overview.patientsWithBleedingHistory) || 0;

// const patients = Array.isArray(dashboardData?.patients)
//   ? dashboardData.patients
//   : [];

// const filteredPatients = patients.filter((patient) => {
//   const query = patientSearch.trim().toLowerCase();
//   if (!query) return true;

//   return [
//     patient.fullName,
//     patient.patientId,
//     patient.type,
//     patient.severity,
//   ]
//     .filter(Boolean)
//     .some((value) =>
//       String(value).toLowerCase().includes(query)
//     );
// });


// // =====================================================
// // DISTRIBUTIONS
// // =====================================================

// const distributions =
//   dashboardData?.distributions || {};


// // =====================================================
// // HEMOPHILIA TYPE
// //
// // Backend:
// // {
// //   hemophiliaType: {
// //     A: 0,
// //     B: 2,
// //     C: 0,
// //     Unknown: 0
// //   }
// // }
// //
// // Frontend/Recharts:
// // [
// //   { name: "A", value: 0 },
// //   { name: "B", value: 2 },
// //   ...
// // ]
// // =====================================================

// const hemophiliaTypeObject =
//   distributions.hemophiliaType ||
//   distributions.hemophiliaTypes ||
//   {};

// const hemophiliaTypeA =
//   Number(hemophiliaTypeObject.A) || 0;

// const hemophiliaTypeB =
//   Number(hemophiliaTypeObject.B) || 0;

// const hemophiliaTypeC =
//   Number(hemophiliaTypeObject.C) || 0;

// const hemophiliaTypeUnknown =
//   Number(hemophiliaTypeObject.Unknown) || 0;

// const hemophiliaTypes = Array.isArray(
//   hemophiliaTypeObject
// )
//   ? hemophiliaTypeObject
//   : Object.entries(hemophiliaTypeObject).map(
//       ([name, value]) => ({
//         name,
//         value: Number(value) || 0,
//       })
//     );


// // =====================================================
// // SEVERITY
// //
// // Backend:
// // {
// //   Mild: 0,
// //   Moderate: 2,
// //   Severe: 0,
// //   Unknown: 0
// // }
// // =====================================================

// const severityObject =
//   distributions.severity || {};

// const mildCases =
//   Number(severityObject.Mild) || 0;

// const moderateCases =
//   Number(severityObject.Moderate) || 0;

// const severeCases =
//   Number(severityObject.Severe) || 0;

// const unknownSeverity =
//   Number(severityObject.Unknown) || 0;

// const severity = Array.isArray(severityObject)
//   ? severityObject
//   : Object.entries(severityObject).map(
//       ([name, value]) => ({
//         name,
//         value: Number(value) || 0,
//       })
//     );


// // =====================================================
// // AGE DISTRIBUTION
// //
// // Backend should return:
// // [
// //   { name: "0-10", value: 1 },
// //   { name: "11-20", value: 2 },
// //   ...
// // ]
// //
// // We safely normalize it here.
// // =====================================================

// const rawAgeDistribution =
//   distributions.ageDistribution;

// const ageDistribution = Array.isArray(
//   rawAgeDistribution
// )
//   ? rawAgeDistribution.map((item) => ({
//       name:
//         item.name ??
//         item.ageGroup ??
//         item.label ??
//         "Unknown",

//       value:
//         Number(
//           item.value ??
//           item.count ??
//           0
//         ) || 0,
//     }))
//   : [];


// // =====================================================
// // AFFECTED JOINTS
// //
// // Backend:
// // [
// //   { joint: "Elbow", count: 2 },
// //   { joint: "Shoulder", count: 2 }
// // ]
// //
// // Recharts needs:
// // [
// //   { name: "Elbow", value: 2 },
// //   ...
// // ]
// // =====================================================

// const rawAffectedJoints =
//   distributions.affectedJoints ||
//   dashboardData?.clinicalBackground?.jointDistribution ||
//   [];

// const affectedJoints = Array.isArray(
//   rawAffectedJoints
// )
//   ? rawAffectedJoints.map((item) => ({
//       name:
//         item.name ??
//         item.joint ??
//         "Unknown",

//       value:
//         Number(
//           item.value ??
//           item.count ??
//           0
//         ) || 0,
//     }))
//   : [];


// // =====================================================
// // FACTOR THERAPY
// //
// // Backend:
// // {
// //   active: 2,
// //   none: 0,
// //   unknown: 0
// // }
// // =====================================================

// const factorTherapyObject =
//   distributions.factorTherapy || {
//     active: 0,
//     none: 0,
//     unknown: 0,
//   };

// const onFactorTherapy =
//   Number(factorTherapyObject.active) || 0;

// const factorTherapy = [
//   {
//     name: "Active Therapy",
//     value:
//       Number(factorTherapyObject.active) || 0,
//   },
//   {
//     name: "No Therapy",
//     value:
//       Number(factorTherapyObject.none) || 0,
//   },
//   {
//     name: "Unknown",
//     value:
//       Number(factorTherapyObject.unknown) || 0,
//   },
// ];


// // =====================================================
// // FAMILY HISTORY
// //
// // Backend:
// // {
// //   yes: 0,
// //   no: 0,
// //   unknown: 2
// // }
// // =====================================================

// const familyHistory =
//   distributions.familyHistory || {
//     yes: 0,
//     no: 0,
//     unknown: 0,
//   };


// // =====================================================
// // GENETIC TESTING
// //
// // Backend:
// // {
// //   yes: 0,
// //   no: 0,
// //   unknown: 2
// // }
// //
// // Convert to the names your frontend can use.
// // =====================================================

// const geneticTestingBackend =
//   distributions.geneticTesting || {
//     yes: 0,
//     no: 0,
//     unknown: 0,
//   };

// const geneticTesting = {
//   done:
//     Number(geneticTestingBackend.yes) || 0,

//   notDone:
//     Number(geneticTestingBackend.no) || 0,

//   unknown:
//     Number(geneticTestingBackend.unknown) || 0,
// };


// // =====================================================
// // PHYSIOTHERAPY
// //
// // Backend:
// // {
// //   yes: 1,
// //   no: 1,
// //   unknown: 0
// // }
// //
// // Convert to names used by frontend.
// // =====================================================

// const physiotherapyBackend =
//   distributions.physiotherapy || {
//     yes: 0,
//     no: 0,
//     unknown: 0,
//   };

// const physiotherapy = {
//   current:
//     Number(physiotherapyBackend.yes) || 0,

//   notCurrent:
//     Number(physiotherapyBackend.no) || 0,

//   unknown:
//     Number(physiotherapyBackend.unknown) || 0,
// };


// // =====================================================
// // BLEEDING FREQUENCY
// //
// // Backend puts this under:
// // clinicalBackground.bleedingFrequencyDistribution
// //
// // Example:
// // [
// //   { frequency: "2-3 times", count: 2 }
// // ]
// // =====================================================

// const rawBleedingFrequency =
//   dashboardData?.clinicalBackground
//     ?.bleedingFrequencyDistribution || [];

// const bleedingFrequency = Array.isArray(
//   rawBleedingFrequency
// )
//   ? rawBleedingFrequency.map((item) => ({
//       name:
//         item.name ??
//         item.frequency ??
//         "Unknown",

//       value:
//         Number(
//           item.value ??
//           item.count ??
//           0
//         ) || 0,
//     }))
//   : [];


// // =====================================================
// // BLEEDING TRENDS
// //
// // Currently backend does not return this,
// // so keep it safely empty.
// // =====================================================

// const bleedingTrends =
//   Array.isArray(
//     dashboardData?.bleedingTrends
//   )
//     ? dashboardData.bleedingTrends
//     : [];


// // =====================================================
// // CLINICAL ALERTS
// //
// // Currently backend does not return this,
// // so keep it safely empty.
// // =====================================================

// const clinicalAlerts =
//   Array.isArray(
//     dashboardData?.clinicalAlerts
//   )
//     ? dashboardData.clinicalAlerts
//     : [];


// // =====================================================
// // FOLLOW-UP
// //
// // Your current backend does not provide a
// // requiringFollowUp value.
// //
// // For now use bleeding-history count as
// // the closest available indicator.
// // =====================================================

// const requiringFollowUp =
//   patientsWithBleedingHistory;

//   const initials = doctorName
//     ? doctorName
//         .replace(/^Dr\.?\s*/i, "")
//         .split(" ")
//         .filter(Boolean)
//         .map((p) => p[0])
//         .slice(0, 2)
//         .join("")
//         .toUpperCase()
//     : "--";

 
//     const handleLogout = () => {
//     localStorage.removeItem("staffAuthToken");
//     localStorage.removeItem("staffUser");

//     delete api.defaults.headers.common["Authorization"];

//     navigate("/doctor-login");
//     };
//     // Intentionally left as an integration point — no auth logic here.
  
// if (loading) {
//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       Loading clinical dashboard...
//     </div>
//   );
// }

// if (error) {
//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: "12px",
//       }}
//     >
//       <h2>Unable to load dashboard</h2>
//       <p>{error}</p>

//       <button
//         onClick={fetchDashboard}
//         className="main-btn"
//       >
//         Retry
//       </button>
//     </div>
//   );
// }
//   return (
//     <div className="dd-root">
//       <style>{`
//         .dd-root {
//           --color-bg: #F5F8FC;
//           --color-surface: #FFFFFF;
//           --color-primary: #2C5CE0;
//           --color-primary-dark: #163B85;
//           --color-primary-soft: #EAF0FE;
//           --color-accent: #0BA5A0;
//           --color-accent-soft: #E4F6F5;
//           --color-border: #DCE6F2;
//           --color-text: #10233F;
//           --color-text-secondary: #5B7291;
//           --color-text-faint: #93A6C2;
//           --shadow-card: 0 1px 2px rgba(16, 35, 63, 0.04), 0 6px 20px rgba(16, 35, 63, 0.05);
//           --radius-lg: 16px;
//           --radius-md: 12px;

//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//           background: var(--color-bg);
//           color: var(--color-text);
//           min-height: 100vh;
//         }

//         .dd-root * { box-sizing: border-box; }

//         .dd-root .font-display {
//           font-family: 'Manrope', 'Inter', sans-serif;
//         }

//         .dd-root .font-data {
//           font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
//           font-variant-numeric: tabular-nums;
//         }

//         /* ---------------- Navbar ---------------- */
//         .dd-navbar {
//           position: sticky;
//           top: 0;
//           z-index: 20;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 14px 28px;
//           background: var(--color-surface);
//           border-bottom: 1px solid var(--color-border);
//         }
//         .dd-navbar-left {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }
//         .dd-logo-mark {
//           width: 34px;
//           height: 34px;
//           border-radius: 9px;
//           background: linear-gradient(145deg, var(--color-primary), var(--color-primary-dark));
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #fff;
//         }
//         .dd-logo-mark svg { width: 18px; height: 18px; }
//         .dd-app-name {
//           font-weight: 700;
//           font-size: 16px;
//           letter-spacing: -0.01em;
//           color: var(--color-text);
//         }
//         .dd-navbar-right {
//           display: flex;
//           align-items: center;
//           gap: 16px;
//         }
//         .pr-dashboard-btn,
//         .pr-logout-btn {
//           display: flex;
//           align-items: center;
//           gap: 6px;

//           padding: 8px 12px;

//           border-radius: 9px;

//           border: 1px solid var(--color-border);

//           background: var(--color-surface);

//           color: var(--color-text-secondary);

//           font-size: 12.5px;
//           font-weight: 600;

//           cursor: pointer;

//           transition: all 0.15s ease;
//         }

//         .pr-dashboard-btn:hover,
//         .pr-logout-btn:hover {
//           border-color: var(--color-primary);

//           color: var(--color-primary-dark);

//           background: var(--color-primary-soft);
//         }

//         .pr-dashboard-btn svg {
//           width: 15px;
//           height: 15px;
//         }
//         .dd-doctor-block {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }
//         .dd-avatar {
//           width: 34px;
//           height: 34px;
//           border-radius: 50%;
//           background: var(--color-primary-soft);
//           color: var(--color-primary-dark);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 12px;
//           font-weight: 700;
//           font-family: 'Manrope', sans-serif;
//           border: 1px solid var(--color-border);
//         }
//         .dd-doctor-name {
//           font-size: 13.5px;
//           font-weight: 600;
//           color: var(--color-text);
//           line-height: 1.2;
//         }
//         .dd-doctor-role {
//           font-size: 11.5px;
//           color: var(--color-text-secondary);
//         }
//         .dd-logout-btn {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           padding: 8px 12px;
//           border-radius: 9px;
//           border: 1px solid var(--color-border);
//           background: var(--color-surface);
//           color: var(--color-text-secondary);
//           font-size: 12.5px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }
//         .dd-logout-btn:hover {
//           border-color: var(--color-primary);
//           color: var(--color-primary-dark);
//           background: var(--color-primary-soft);
//         }
//         .dd-logout-btn svg { width: 15px; height: 15px; }
//         .dd-logout-btn:focus-visible,
//         .stat-card:focus-visible {
//           outline: 2px solid var(--color-primary);
//           outline-offset: 2px;
//         }

//         /* ---------------- Layout ---------------- */
//         .dd-main {
//           max-width: 1240px;
//           margin: 0 auto;
//           padding: 32px 28px 64px;
//         }

//         .dd-welcome {
//           margin-bottom: 28px;
//         }
//         .dd-welcome-title {
//           font-size: 26px;
//           font-weight: 800;
//           letter-spacing: -0.015em;
//           margin: 0 0 6px;
//         }
//         .dd-welcome-subtitle {
//           font-size: 14.5px;
//           color: var(--color-text-secondary);
//           margin: 0;
//         }
//         .dd-welcome-doctor {
//           color: var(--color-primary-dark);
//           font-weight: 700;
//         }

//         /* ---------------- Section header w/ signature pulse-line ---------------- */
//         .section-header {
//           margin: 44px 0 16px;
//         }
//         .section-header-top {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           margin-bottom: 4px;
//         }
//         .section-eyebrow {
//           font-family: 'Manrope', sans-serif;
//           font-size: 11px;
//           font-weight: 700;
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           color: var(--color-primary);
//         }
//         .pulse-line {
//           flex: 1;
//           height: 16px;
//           color: var(--color-border);
//           max-width: 220px;
//         }
//         .section-title {
//           font-family: 'Manrope', sans-serif;
//           font-size: 18px;
//           font-weight: 700;
//           margin: 0;
//           color: var(--color-text);
//         }
//         .section-description {
//           font-size: 13px;
//           color: var(--color-text-secondary);
//           margin: 6px 0 0;
//           max-width: 620px;
//         }

//         /* ---------------- KPI grid ---------------- */
//         .stat-grid {
//           display: grid;
//           grid-template-columns: repeat(4, 1fr);
//           gap: 16px;
//         }
//         .stat-card {
//           background: var(--color-surface);
//           border: 1px solid var(--color-border);
//           border-radius: var(--radius-lg);
//           padding: 18px;
//           box-shadow: var(--shadow-card);
//         }
//         .stat-card-top {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           margin-bottom: 12px;
//         }
//         .stat-icon {
//           width: 30px;
//           height: 30px;
//           border-radius: 8px;
//           background: var(--color-primary-soft);
//           color: var(--color-primary-dark);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           flex-shrink: 0;
//         }
//         .stat-icon svg { width: 16px; height: 16px; }
//         .stat-label {
//           font-size: 12.5px;
//           font-weight: 600;
//           color: var(--color-text-secondary);
//         }
//         .stat-value {
//           font-family: 'IBM Plex Mono', monospace;
//           font-variant-numeric: tabular-nums;
//           font-size: 26px;
//           font-weight: 700;
//           color: var(--color-text);
//           line-height: 1;
//         }
//         .stat-description {
//           font-size: 11.5px;
//           color: var(--color-text-faint);
//           margin: 8px 0 0;
//           line-height: 1.4;
//         }

//         /* ---------------- Charts grid ---------------- */
//         .chart-grid {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 16px;
//         }
//         .chart-grid-2 {
//           display: grid;
//           grid-template-columns: repeat(2, 1fr);
//           gap: 16px;
//         }
//         .chart-card {
//           background: var(--color-surface);
//           border: 1px solid var(--color-border);
//           border-radius: var(--radius-lg);
//           padding: 18px;
//           box-shadow: var(--shadow-card);
//           display: flex;
//           flex-direction: column;
//         }
//         .chart-card-wide {
//           grid-column: 1 / -1;
//         }
//         .chart-card-header {
//           margin-bottom: 12px;
//         }
//         .chart-card-title {
//           font-family: 'Manrope', sans-serif;
//           font-size: 14.5px;
//           font-weight: 700;
//           margin: 0 0 2px;
//         }
//         .chart-card-subtitle {
//           font-size: 12px;
//           color: var(--color-text-secondary);
//           margin: 0;
//         }
//         .chart-card-body {
//           flex: 1;
//           min-height: 220px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .chart-card-footnote {
//           font-size: 11.5px;
//           color: var(--color-text-faint);
//           margin: 12px 0 0;
//           padding-top: 12px;
//           border-top: 1px solid var(--color-border);
//           line-height: 1.5;
//         }

//         /* ---------------- Empty states ---------------- */
//         .empty-state {
//           width: 100%;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           padding: 24px 12px;
//           color: var(--color-text-faint);
//         }
//         .empty-state-icon {
//           width: 34px;
//           height: 34px;
//           color: var(--color-text-faint);
//         }
//         .empty-state-message {
//           font-size: 12.5px;
//           font-weight: 600;
//           color: var(--color-text-secondary);
//           margin: 0;
//           text-align: center;
//         }
//         .empty-state-hint {
//           font-size: 11.5px;
//           color: var(--color-text-faint);
//           margin: 0;
//           text-align: center;
//           max-width: 220px;
//         }

//         /* ---------------- Small stat rows (family/genetic/physio) ---------------- */
//         .mini-stat-row {
//           display: flex;
//           flex-direction: column;
//           gap: 10px;
//           width: 100%;
//         }
//         .mini-stat {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 10px 12px;
//           border-radius: 9px;
//           background: var(--color-bg);
//           border: 1px solid var(--color-border);
//         }
//         .mini-stat-label {
//           font-size: 12.5px;
//           color: var(--color-text-secondary);
//           font-weight: 600;
//         }
//         .mini-stat-value {
//           font-family: 'IBM Plex Mono', monospace;
//           font-size: 14px;
//           font-weight: 700;
//           color: var(--color-text);
//         }

//         /* ---------------- Clinical attention ---------------- */
//         .attention-panel {
//           background: var(--color-surface);
//           border: 1px solid var(--color-border);
//           border-radius: var(--radius-lg);
//           box-shadow: var(--shadow-card);
//           padding: 24px;
//         }

//         /* ---------------- Privacy note ---------------- */
//         .privacy-note {
//           margin-top: 40px;
//           display: flex;
//           gap: 10px;
//           align-items: flex-start;
//           padding: 14px 16px;
//           border-radius: var(--radius-md);
//           background: var(--color-accent-soft);
//           border: 1px solid #C7EAE8;
//         }
//         .privacy-note svg {
//           width: 16px;
//           height: 16px;
//           color: var(--color-accent);
//           flex-shrink: 0;
//           margin-top: 2px;
//         }
//         .privacy-note p {
//           margin: 0;
//           font-size: 12px;
//           color: var(--color-text-secondary);
//           line-height: 1.5;
//         }

//         /* ---------------- Assigned patients ---------------- */
//         .patients-panel {
//           background: var(--color-surface);
//           border: 1px solid var(--color-border);
//           border-radius: var(--radius-lg);
//           box-shadow: var(--shadow-card);
//           overflow: hidden;
//           margin-bottom: 42px;
//         }
//         .patients-panel-top {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 20px;
//           padding: 20px 22px;
//           border-bottom: 1px solid var(--color-border);
//         }
//         .patients-count {
//           font-family: 'Manrope', sans-serif;
//           font-size: 20px;
//           font-weight: 800;
//           color: var(--color-text);
//         }
//         .patients-count span {
//           font-family: 'Inter', sans-serif;
//           font-size: 12px;
//           font-weight: 600;
//           color: var(--color-text-secondary);
//         }
//         .patients-panel-hint {
//           margin: 4px 0 0;
//           font-size: 11.5px;
//           color: var(--color-text-secondary);
//         }
//         .patient-search-wrap {
//           width: min(360px, 100%);
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           border: 1px solid var(--color-border);
//           background: var(--color-bg);
//           border-radius: 10px;
//           padding: 0 12px;
//         }
//         .patient-search-icon {
//           color: var(--color-text-faint);
//           font-size: 20px;
//           line-height: 1;
//         }
//         .patient-search-wrap input {
//           width: 100%;
//           border: 0;
//           outline: 0;
//           background: transparent;
//           color: var(--color-text);
//           padding: 11px 0;
//           font-size: 12px;
//         }
//         .patients-table-wrap {
//           overflow-x: auto;
//         }
//         .patients-table {
//           width: 100%;
//           border-collapse: collapse;
//           min-width: 1080px;
//         }
//         .patients-table th {
//           padding: 12px 14px;
//           text-align: left;
//           font-size: 10.5px;
//           text-transform: uppercase;
//           letter-spacing: .06em;
//           color: var(--color-text-faint);
//           background: #F9FBFE;
//           border-bottom: 1px solid var(--color-border);
//           white-space: nowrap;
//         }
//         .patients-table td {
//           padding: 13px 14px;
//           border-bottom: 1px solid #EDF2F8;
//           font-size: 12px;
//           color: var(--color-text-secondary);
//           white-space: nowrap;
//         }
//         .patients-table tbody tr:hover { background: #FBFDFF; }
//         .patient-name-cell {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           min-width: 180px;
//         }
//         .patient-mini-avatar {
//           width: 34px;
//           height: 34px;
//           flex: 0 0 34px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: var(--color-primary-soft);
//           color: var(--color-primary-dark);
//           border: 1px solid var(--color-border);
//           font-size: 10px;
//           font-weight: 800;
//         }
//         .patient-name-cell strong,
//         .patient-name-cell span {
//           display: block;
//         }
//         .patient-name-cell strong {
//           color: var(--color-text);
//           font-size: 12.5px;
//           margin-bottom: 2px;
//         }
//         .patient-name-cell span {
//           color: var(--color-text-faint);
//           font-size: 10.5px;
//         }
//         .patient-id-badge {
//           display: inline-flex;
//           padding: 5px 7px;
//           border-radius: 7px;
//           background: var(--color-bg);
//           border: 1px solid var(--color-border);
//           color: var(--color-text);
//           font-family: 'IBM Plex Mono', monospace;
//           font-size: 10.5px;
//           font-weight: 700;
//         }
//         .clinical-pill {
//           display: inline-flex;
//           align-items: center;
//           padding: 5px 8px;
//           border-radius: 999px;
//           border: 1px solid var(--color-border);
//           background: var(--color-bg);
//           color: var(--color-text-secondary);
//           font-size: 10px;
//           font-weight: 700;
//           text-transform: capitalize;
//         }
//         .severity-severe, .risk-emergency {
//           background: #FFF1F1;
//           border-color: #F2C9C9;
//           color: #A52B2B;
//         }
//         .severity-moderate, .risk-high {
//           background: #FFF7E8;
//           border-color: #F0D7A5;
//           color: #8A5A00;
//         }
//         .severity-mild, .risk-low {
//           background: #EDF9F7;
//           border-color: #BDE8E2;
//           color: #16746F;
//         }
//         .view-patient-btn {
//           border: 0;
//           background: transparent;
//           color: var(--color-primary);
//           font-size: 11px;
//           font-weight: 800;
//           cursor: pointer;
//           padding: 6px 0;
//         }
//         .view-patient-btn:hover { color: var(--color-primary-dark); }
//         .muted-value { color: var(--color-text-faint); }

//         /* ---------------- Doctor change requests ---------------- */
//         .change-requests-panel {
//           background: var(--color-surface);
//           border: 1px solid var(--color-border);
//           border-radius: var(--radius-lg);
//           box-shadow: var(--shadow-card);
//           padding: 4px 20px;
//           margin-bottom: 42px;
//         }
//         .change-request-list {
//           display: flex;
//           flex-direction: column;
//         }
//         .change-request-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 20px;
//           padding: 16px 2px;
//           border-bottom: 1px solid #EDF2F8;
//         }
//         .change-request-item:last-child { border-bottom: 0; }
//         .change-request-main {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           min-width: 0;
//         }
//         .change-request-avatar {
//           width: 38px;
//           height: 38px;
//           flex: 0 0 38px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: var(--color-primary-soft);
//           color: var(--color-primary-dark);
//           font-size: 10px;
//           font-weight: 800;
//           border: 1px solid var(--color-border);
//         }
//         .change-request-main strong,
//         .change-request-main span,
//         .change-request-main p {
//           display: block;
//         }
//         .change-request-main strong {
//           color: var(--color-text);
//           font-size: 13px;
//         }
//         .change-request-main span {
//           margin-top: 2px;
//           color: var(--color-text-faint);
//           font-family: 'IBM Plex Mono', monospace;
//           font-size: 10px;
//         }
//         .change-request-main p {
//           margin: 5px 0 0;
//           color: var(--color-text-secondary);
//           font-size: 11px;
//           max-width: 600px;
//           white-space: normal;
//         }
//         .change-request-actions {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           flex-shrink: 0;
//         }
//         .request-pending-pill {
//           padding: 5px 8px;
//           border-radius: 999px;
//           background: #FFF7E8;
//           border: 1px solid #F0D7A5;
//           color: #8A5A00 !important;
//           font-family: 'Inter', sans-serif !important;
//           font-size: 10px !important;
//           font-weight: 700;
//         }
//         .release-patient-btn {
//           border: 1px solid #D8A9A9;
//           background: #FFF7F7;
//           color: #9B3030;
//           border-radius: 9px;
//           padding: 8px 11px;
//           font-size: 11px;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .release-patient-btn:hover {
//           background: #FFF0F0;
//           border-color: #C98484;
//         }

//         /* ---------------- Release confirmation modal ---------------- */
//         .release-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 9999;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//           background: rgba(15, 23, 42, 0.48);
//           backdrop-filter: blur(4px);
//           -webkit-backdrop-filter: blur(4px);
//           animation: releaseOverlayIn 0.18s ease-out;
//         }
//         .release-modal-card {
//           width: min(460px, 100%);
//           background: #ffffff;
//           border: 1px solid #E4EAF2;
//           border-radius: 18px;
//           box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
//           padding: 28px;
//           animation: releaseModalIn 0.2s ease-out;
//         }
//         .release-modal-icon {
//           width: 52px;
//           height: 52px;
//           margin: 0 auto 16px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #FFF5E8;
//           border: 1px solid #F0D7A5;
//           color: #9A6200;
//           font-size: 25px;
//           font-weight: 800;
//         }
//         .release-modal-card h3 {
//           margin: 0;
//           text-align: center;
//           color: #172033;
//           font-size: 20px;
//           line-height: 1.3;
//         }
//         .release-modal-card > p {
//           margin: 10px auto 0;
//           max-width: 370px;
//           text-align: center;
//           color: #667085;
//           font-size: 13px;
//           line-height: 1.6;
//         }
//         .release-modal-patient {
//           margin: 20px 0;
//           padding: 13px 14px;
//           border: 1px solid #E6EBF2;
//           border-radius: 11px;
//           background: #F8FAFC;
//           text-align: center;
//         }
//         .release-modal-patient strong {
//           display: block;
//           color: #172033;
//           font-size: 14px;
//         }
//         .release-modal-patient span {
//           display: block;
//           margin-top: 4px;
//           color: #8791A1;
//           font-family: 'IBM Plex Mono', monospace;
//           font-size: 10px;
//         }
//         .release-modal-warning {
//           margin: 0 0 22px;
//           padding: 11px 13px;
//           border-left: 3px solid #D49A35;
//           border-radius: 7px;
//           background: #FFFAF0;
//           color: #76551B;
//           font-size: 11px;
//           line-height: 1.55;
//         }
//         .release-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//         }
//         .release-modal-cancel,
//         .release-modal-confirm {
//           min-width: 112px;
//           height: 40px;
//           padding: 0 16px;
//           border-radius: 9px;
//           font-size: 12px;
//           font-weight: 800;
//           cursor: pointer;
//           transition: 0.15s ease;
//         }
//         .release-modal-cancel {
//           border: 1px solid #D9E0E9;
//           background: #ffffff;
//           color: #5D6879;
//         }
//         .release-modal-cancel:hover:not(:disabled) { background: #F7F9FC; }
//         .release-modal-confirm {
//           border: 1px solid #B96D6D;
//           background: #A83A3A;
//           color: #ffffff;
//         }
//         .release-modal-confirm:hover:not(:disabled) { background: #922F2F; }
//         .release-modal-cancel:disabled,
//         .release-modal-confirm:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }
//         .release-success-toast {
//           position: fixed;
//           top: 86px;
//           right: 24px;
//           z-index: 10000;
//           width: min(420px, calc(100vw - 32px));
//           padding: 13px 16px;
//           border: 1px solid #BDE8E2;
//           border-radius: 11px;
//           background: #F2FCFA;
//           color: #176D68;
//           box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
//           font-size: 12px;
//           font-weight: 700;
//           line-height: 1.5;
//           animation: releaseToastIn 0.2s ease-out;
//         }
//         @keyframes releaseOverlayIn { from { opacity: 0; } to { opacity: 1; } }
//         @keyframes releaseModalIn {
//           from { opacity: 0; transform: translateY(8px) scale(0.98); }
//           to { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         @keyframes releaseToastIn {
//           from { opacity: 0; transform: translateY(-8px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         /* ---------------- Responsive ---------------- */
//         @media (max-width: 1080px) {
//           .stat-grid { grid-template-columns: repeat(2, 1fr); }
//           .chart-grid { grid-template-columns: repeat(2, 1fr); }
//         }
//         @media (max-width: 720px) {
//           .dd-main { padding: 24px 16px 48px; }
//           .stat-grid { grid-template-columns: 1fr; }
//           .chart-grid { grid-template-columns: 1fr; }
//           .chart-grid-2 { grid-template-columns: 1fr; }
//           .dd-doctor-role { display: none; }
//           .dd-navbar { padding: 12px 16px; }
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .dd-root * { transition: none !important; animation: none !important; }
//         }
//       `}</style>

//       {/* ============================ NAVBAR ============================ */}
//       <header className="dd-navbar">
//         <div className="dd-navbar-left">
//           <div className="dd-logo-mark">{Icon.Cross}</div>
//           <span className="dd-app-name font-display">Hemophilia Care</span>
//         </div>
        

//         <div className="dd-navbar-right">
//           <button
//             className="pr-dashboard-btn"
//             onClick={() => navigate("/doctor/patient-research")}
//           >
//             Patient Research
//           </button>
//           <div className="dd-doctor-block">
//             <div className="dd-avatar font-display">{initials}</div>
//             <div>
//               {/* BACKEND: doctorName comes from authenticated session — see top of file */}
//               <div className="dd-doctor-name">{doctorName || "--"}</div>
//               <div className="dd-doctor-role">{roleName}</div>
//             </div>
//           </div>
          
//           <button className="dd-logout-btn" onClick={handleLogout} type="button">
//             {Icon.Logout}
//             Log out
//           </button>
//         </div>
//       </header>

//       <main className="dd-main">
//         {/* ============================ WELCOME ============================ */}
//         <div className="dd-welcome">
//           <h1 className="dd-welcome-title font-display">Clinical Dashboard</h1>
//           <p className="dd-welcome-subtitle">
//             {doctorName ? (
//               <>
//                 Welcome back, <span className="dd-welcome-doctor">{doctorName}</span>. Overview of hemophilia care, patient population and clinical trends.
//               </>
//             ) : (
//               "Overview of hemophilia care, patient population and clinical trends."
//             )}
//           </p>
//         </div>

//         {/* ============================ MY PATIENTS ============================ */}
//         <SectionHeader
//           eyebrow="Assigned Care"
//           title="My Patients"
//           description="Patients currently assigned to you as their consulting doctor. Select a patient to open the complete clinical research record."
//         />

//         <section className="patients-panel">
//           <div className="patients-panel-top">
//             <div>
//               <div className="patients-count">
//                 {patients.length} <span>assigned patient{patients.length === 1 ? "" : "s"}</span>
//               </div>
//               <p className="patients-panel-hint">
//                 Only patients whose current consulting doctor is you are shown here.
//               </p>
//             </div>

//             <div className="patient-search-wrap">
//               <span className="patient-search-icon">⌕</span>
//               <input
//                 type="search"
//                 value={patientSearch}
//                 onChange={(e) => setPatientSearch(e.target.value)}
//                 placeholder="Search name, Patient ID, type..."
//                 aria-label="Search assigned patients"
//               />
//             </div>
//           </div>

//           {filteredPatients.length === 0 ? (
//             <EmptyState
//               message={patients.length === 0 ? "No patients are currently assigned to you." : "No matching patients found."}
//               hint={patients.length === 0 ? "Patients will appear here after they select you as their consulting doctor." : "Try searching by patient name or Patient ID."}
//             />
//           ) : (
//             <div className="patients-table-wrap">
//               <table className="patients-table">
//                 <thead>
//                   <tr>
//                     <th>Patient</th>
//                     <th>Patient ID</th>
//                     <th>Age</th>
//                     <th>Type</th>
//                     <th>Severity</th>
//                     <th>Last Bleed</th>
//                     <th>Target Joint</th>
//                     <th>Assessment</th>
//                     <th></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredPatients.map((patient) => {
//                     const assessment = patient.latestAssessment;
//                     return (
//                       <tr key={String(patient.userId || patient.patientId)}>
//                         <td>
//                           <div className="patient-name-cell">
//                             <div className="patient-mini-avatar">
//                               {(patient.fullName || patient.patientId || "P")
//                                 .split(" ")
//                                 .filter(Boolean)
//                                 .map((part) => part[0])
//                                 .slice(0, 2)
//                                 .join("")
//                                 .toUpperCase()}
//                             </div>
//                             <div>
//                               <strong>{patient.fullName || "Unnamed patient"}</strong>
//                               <span>{patient.gender || "Gender not recorded"}</span>
//                             </div>
//                           </div>
//                         </td>
//                         <td><span className="patient-id-badge">{patient.patientId || "--"}</span></td>
//                         <td>{patient.age ?? "--"}</td>
//                         <td>{patient.type || "--"}</td>
//                         <td>
//                           <span className={`clinical-pill severity-${String(patient.severity || "unknown").toLowerCase()}`}>
//                             {patient.severity || "Unknown"}
//                           </span>
//                         </td>
//                         <td>{patient.lastBleedDate ? new Date(patient.lastBleedDate).toLocaleDateString() : "Not recorded"}</td>
//                         <td>{patient.targetJoint || "None recorded"}</td>
//                         <td>
//                           {assessment ? (
//                             <span className={`clinical-pill risk-${String(assessment.riskLevel || "unknown").toLowerCase()}`}>
//                               {assessment.riskLevel || "Unknown"}
//                             </span>
//                           ) : (
//                             <span className="muted-value">No assessment</span>
//                           )}
//                         </td>
//                         <td>
//                           <button
//                             type="button"
//                             className="view-patient-btn"
//                             onClick={() =>
//                               navigate(`/doctor/patient-research?patientId=${encodeURIComponent(patient.patientId || "")}`)
//                             }
//                           >
//                             View Record →
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>

//         {/* ============================ CHANGE REQUESTS ============================ */}
//         <SectionHeader
//           eyebrow="Doctor Action"
//           title="Doctor Change Requests"
//           description="Patients currently assigned to you who have requested to change their consulting doctor."
//         />

//         <section className="change-requests-panel">
//           {pendingChangeRequests.length === 0 ? (
//             <EmptyState
//               message="No pending doctor-change requests."
//               hint="New requests from your assigned patients will appear here."
//             />
//           ) : (
//             <div className="change-request-list">
//               {pendingChangeRequests.map((request) => (
//                 <div className="change-request-item" key={String(request.id)}>
//                   <div className="change-request-main">
//                     <div className="change-request-avatar">
//                       {(request.patientName || request.patientId || "P")
//                         .split(" ")
//                         .filter(Boolean)
//                         .map((part) => part[0])
//                         .slice(0, 2)
//                         .join("")
//                         .toUpperCase()}
//                     </div>
//                     <div>
//                       <strong>{request.patientName || "Unnamed patient"}</strong>
//                       <span>{request.patientId || "Patient ID unavailable"}</span>
//                       {request.reason && (
//                         <p>Reason: {request.reason}</p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="change-request-actions">
//                     <span className="request-pending-pill">Pending</span>
//                     <button
//                       type="button"
//                       className="release-patient-btn"
//                       onClick={() => openReleaseModal(request)}
//                     >
//                       Release Patient
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>

//         {/* ============================ 1. KPI CARDS ============================ */}
//         <SectionHeader
//           eyebrow="Population Overview"
//           title="Overall Hemophilia Insights"
//         />
//         <div className="stat-grid">
//           <StatCard
//             label="Total Patients"
//             value={totalPatients}
//             description="All patients currently enrolled in the program."
//             icon={Icon.Users}
//           />
//           <StatCard
//             label="Hemophilia Type A"
//             value={hemophiliaTypeA}
//             description="Patients diagnosed with Factor VIII deficiency."
//             icon={Icon.DropletA}
//           />
//           <StatCard
//             label="Hemophilia Type B"
//             value={hemophiliaTypeB}
//             description="Patients diagnosed with Factor IX deficiency."
//             icon={Icon.DropletA}
//           />
//           <StatCard
//             label="Severe Cases"
//             value={severeCases}
//             description="Patients classified with severe disease severity."
//             icon={Icon.Severity}
//           />
//           <StatCard
//             label="Moderate Cases"
//             value={moderateCases}
//             description="Patients classified with moderate disease severity."
//             icon={Icon.Severity}
//           />
//           <StatCard
//             label="Mild Cases"
//             value={mildCases}
//             description="Patients classified with mild disease severity."
//             icon={Icon.Severity}
//           />
//           <StatCard
//             label="On Factor Therapy"
//             value={onFactorTherapy}
//             description="Patients currently receiving factor replacement therapy."
//             icon={Icon.Therapy}
//           />
//           <StatCard
//             label="Requiring Follow-up"
//             value={requiringFollowUp}
//             description="Patients flagged for clinical follow-up."
//             icon={Icon.FollowUp}
//           />
//         </div>

//         {/* ============================ 2 & 3. TYPE + SEVERITY ============================ */}
//         <SectionHeader
//           eyebrow="Distribution"
//           title="Hemophilia Type & Severity Distribution"
//           description="Aggregated breakdowns across your currently assigned patient population."
//         />
//         <div className="chart-grid">
//           <ChartCard title="Hemophilia Type Distribution" subtitle="Type A · Type B · Type C · Unknown">
//             {hemophiliaTypes.length === 0 ? (
//               <EmptyState
//                 message="No clinical data available"
//                 hint="Chart will populate once type data is connected."
//               />
//             ) : (
//               <ResponsiveContainer width="100%" height={220}>
//                 <PieChart>
//                   <Pie
//                     data={hemophiliaTypes}
//                     dataKey="value"
//                     nameKey="name"
//                     innerRadius={55}
//                     outerRadius={80}
//                     paddingAngle={2}
//                     >
//                     {hemophiliaTypes.map((_, i) => (
//                         <Cell
//                         key={i}
//                         fill={
//                             CHART_COLORS[
//                             i % CHART_COLORS.length
//                             ]
//                         }
//                         />
//                     ))}
//                     </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             )}
//           </ChartCard>

//           <ChartCard title="Severity Distribution" subtitle="Mild · Moderate · Severe · Unknown">
//             {severity.length === 0 ? (
//               <EmptyState
//                 message="No clinical data available"
//                 hint="Chart will populate once severity data is connected."
//               />
//             ) : (
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={severity}>
//                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
//                   <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                   <Tooltip />
//                   <Bar dataKey="value" fill="#2C5CE0" radius={[6, 6, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </ChartCard>

//           <ChartCard title="Age Distribution" subtitle="Aggregated age groups only — no individual DOBs">
//             {ageDistribution.length === 0 ? (
//               <EmptyState
//                 message="No clinical data available"
//                 hint="Chart will populate once demographic data is connected."
//               />
//             ) : (
//               <ResponsiveContainer width="100%" height={220}>
//                 <BarChart data={ageDistribution}>
//                   <CartesianGrid stroke="#EEF3FA" vertical={false} />
//                   <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                   <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                   <Tooltip />
//                   <Bar dataKey="value" fill="#0BA5A0" radius={[6, 6, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             )}
//           </ChartCard>
//         </div>

//         {/* ============================ 4. BLEEDING TRENDS ============================ */}
//         {/* <SectionHeader
//           eyebrow="Trends"
//           title="Bleeding Trend Insights"
//         />
//         <ChartCard
//           title="Bleeding Events Over Time"
//           subtitle="Monthly aggregated bleeding-event count"
//           wide
//           footnote="Tracks aggregated bleeding-event trends over time to help clinicians identify changes in bleeding frequency."
//         >
//           {bleedingTrends.length === 0 ? (
//             <EmptyState
//               message="Clinical data will appear here once available."
//               hint="Connect bleeding-event data to populate this trend line."
//             />
//           ) : (
//             <ResponsiveContainer width="100%" height={260}>
//               <LineChart data={bleedingTrends}>
//                 <CartesianGrid stroke="#EEF3FA" vertical={false} />
//                 <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                 <Tooltip />
//                 <Line
//                   type="monotone"
//                   dataKey="events"
//                   stroke="#2C5CE0"
//                   strokeWidth={2.5}
//                   dot={{ r: 3, fill: "#2C5CE0" }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           )}
//         </ChartCard> */}

//         {/* ============================ 5. AFFECTED JOINTS ============================ */}
//         <SectionHeader
//           eyebrow="Musculoskeletal"
//           title="Affected Joint Insights"
//           description="Aggregate trends across commonly affected joints for your currently assigned patients."
//         />
//         <ChartCard title="Commonly Affected Joints" subtitle="Knee · Elbow · Ankle · Hip · Other" wide>
//           {affectedJoints.length === 0 ? (
//             <EmptyState
//               message="No data available"
//               hint="Chart will populate once joint-involvement data is connected."
//             />
//           ) : (
//             <ResponsiveContainer width="100%" height={240}>
//               <BarChart data={affectedJoints} layout="vertical">
//                 <CartesianGrid stroke="#EEF3FA" horizontal={false} />
//                 <XAxis type="number" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
//                 <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} width={60} />
//                 <Tooltip />
//                 <Bar dataKey="value" fill="#7C9CF0" radius={[0, 6, 6, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </ChartCard>

//         {/* ============================ 6. FACTOR THERAPY ============================ */}
//         <SectionHeader eyebrow="Treatment" title="Factor Therapy Insights" />
//         <ChartCard
//             title="Factor Therapy Status"
//             subtitle="Currently on therapy · Not currently · Unknown"
//             wide
//             >
//             {factorTherapy.length === 0 ? (
//                 <EmptyState
//                 message="Data unavailable"
//                 hint="Connect treatment-status data to populate this chart."
//                 />
//             ) : (
//                 <ResponsiveContainer
//                 width="100%"
//                 height={220}
//                 >
//                 <PieChart>
//                     <Pie
//                     data={factorTherapy}
//                     dataKey="value"
//                     nameKey="name"
//                     innerRadius={55}
//                     outerRadius={80}
//                     paddingAngle={2}
//                     >
//                     {factorTherapy.map((_, i) => (
//                         <Cell
//                         key={i}
//                         fill={
//                             CHART_COLORS[
//                             i % CHART_COLORS.length
//                             ]
//                         }
//                         />
//                     ))}
//                     </Pie>

//                     <Tooltip />
//                 </PieChart>
//                 </ResponsiveContainer>
//             )}
//             </ChartCard>

//         {/* ============================ 7. FAMILY HISTORY / GENETIC / PHYSIO ============================ */}
//         <SectionHeader
//           eyebrow="Clinical Background"
//           title="Family History, Genetic Testing & Physiotherapy"
//           description="Aggregated family-history and testing information for your currently assigned patients."
//         />
//         <div className="chart-grid-2">
//           <ChartCard title="Family History" subtitle="Aggregated across population">
//             <div className="mini-stat-row">
//               <MiniStat label="Family history present" value={familyHistory.yes} />
//               <MiniStat label="No family history" value={familyHistory.no} />
//               <MiniStat label="Unknown" value={familyHistory.unknown} />
//             </div>
//           </ChartCard>

//           <ChartCard title="Genetic Testing" subtitle="Aggregated across population">
//             <div className="mini-stat-row">
//               <MiniStat label="Testing completed" value={geneticTesting.done} />
//               <MiniStat label="Not completed" value={geneticTesting.notDone} />
//               <MiniStat label="Unknown" value={geneticTesting.unknown} />
//             </div>
//           </ChartCard>
//         </div>

//         <ChartCard title="Physiotherapy Status" subtitle="Currently under physiotherapy · Not currently · Unknown" wide>
//           <div className="mini-stat-row">
//             <MiniStat label="Currently under physiotherapy" value={physiotherapy.current} />
//             <MiniStat label="Not currently under physiotherapy" value={physiotherapy.notCurrent} />
//             <MiniStat label="Unknown" value={physiotherapy.unknown} />
//           </div>
//         </ChartCard>

//         {/* ============================ 8. CLINICAL ATTENTION ============================ */}
//         <SectionHeader
//           eyebrow="Alerts"
//           title="Clinical Attention"
//           description="Authorized, aggregated indicators requiring clinician review. Individual patient records are never rendered on this dashboard."
//         />
//         <div className="attention-panel">
//           {clinicalAlerts.length === 0 ? (
//             <EmptyState
//               message="No clinical alerts available"
//               hint="Follow-up flags, frequent-bleeding indicators and target-joint concerns will appear here once connected."
//             />
//           ) : (
//             // BACKEND: render authorized alert objects here — never construct
//             // or invent alert entries on the frontend.
//             <div className="mini-stat-row">
//               {clinicalAlerts.map((alert, i) => (
//                 <div className="mini-stat" key={i}>
//                     <span className="mini-stat-label">
//                     {alert.title}
//                     </span>

//                     <span className="mini-stat-value font-data">
//                     {alert.count}
//                     </span>

//                     {alert.description && (
//                     <span className="mini-stat-description">
//                         {alert.description}
//                     </span>
//                     )}
//                 </div>
//                 ))}
//             </div>
//           )}
//         </div>

//         {/* ============================ PRIVACY NOTE ============================ */}
//         <div className="privacy-note">
//           {Icon.Alert}
//           <p>
//             Patient-level information on the My Patients table is shown only for patients
//             currently assigned to the authenticated doctor. The research view is also
//             server-authorized against the current doctor-patient assignment.
//           </p>
//         </div>
//       </main>

//       {releaseSuccess && (
//         <div className="release-success-toast" role="status">
//           ✓ {releaseSuccess}
//         </div>
//       )}

//       {releaseRequest && (
//         <div
//           className="release-modal-overlay"
//           role="presentation"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget && !releaseLoading) {
//               closeReleaseModal();
//             }
//           }}
//         >
//           <div
//             className="release-modal-card"
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="release-patient-title"
//             onMouseDown={(event) => event.stopPropagation()}
//           >
//             <div className="release-modal-icon">!</div>
//             <h3 id="release-patient-title">Release this patient?</h3>
//             <p>Are you sure you want to release this patient from your care?</p>

//             <div className="release-modal-patient">
//               <strong>{releaseRequest.patientName || "Unnamed patient"}</strong>
//               <span>{releaseRequest.patientId || "Patient ID unavailable"}</span>
//             </div>

//             <div className="release-modal-warning">
//               After release, the patient will be able to select a new consulting doctor.
//             </div>

//             <div className="release-modal-actions">
//               <button
//                 type="button"
//                 className="release-modal-cancel"
//                 onClick={closeReleaseModal}
//                 disabled={releaseLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="release-modal-confirm"
//                 onClick={releasePatient}
//                 disabled={releaseLoading}
//               >
//                 {releaseLoading ? "Releasing..." : "Yes, Release"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function MiniStat({ label, value }) {
//   const display = value === null || value === undefined ? "--" : value;
//   return (
//     <div className="mini-stat">
//       <span className="mini-stat-label">{label}</span>
//       <span className="mini-stat-value font-data">{display}</span>
//     </div>
//   );
// }

// export default DoctorDashboard;













import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";
import ExerciseReviewPanel from "../components/ExerciseReviewPanel";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ============================================================================
   DoctorDashboard.jsx
   Hemophilia Clinical Management Platform — Clinician Dashboard (UI ONLY)

   - No mock/fake patient data anywhere in this file.
   - All clinical data is sourced from `dashboardData` below, which is
     intentionally null / empty until wired to a real backend.
   - Search for "// BACKEND:" comments to find every integration point.
   ========================================================================== */

/* ----------------------------------------------------------------------------
   AUTH / IDENTITY DATA SLOT
   BACKEND: replace with the authenticated clinician's name from your auth
   context / session (e.g. useAuth().user.name). Do not hardcode.
---------------------------------------------------------------------------- */


/* ----------------------------------------------------------------------------
   THEME TOKENS
---------------------------------------------------------------------------- */
const CHART_COLORS = ["#2C5CE0", "#0BA5A0", "#7C9CF0", "#9FD8D5", "#C6D4EA"];

/* ============================================================================
   SHARED SUBCOMPONENTS
   ========================================================================== */

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="section-header">
      <div className="section-header-top">
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <svg
          className="pulse-line"
          viewBox="0 0 120 24"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="0,12 28,12 34,3 40,21 46,12 120,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

function EmptyState({ message = "No data available", hint }) {
  return (
    <div className="empty-state" role="status">
      <svg
        className="empty-state-icon"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="6"
          y="10"
          width="36"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M13 30l7-8 6 6 9-11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="empty-state-message">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}

function StatCard({ label, value, description, icon }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "--" : value;
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{displayValue}</div>
      {description && <p className="stat-description">{description}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, footnote, children, wide }) {
  return (
    <div className={`chart-card ${wide ? "chart-card-wide" : ""}`}>
      <div className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
      </div>
      <div className="chart-card-body">{children}</div>
      {footnote && <p className="chart-card-footnote">{footnote}</p>}
    </div>
  );
}

/* Simple inline icon set (no external icon dependency) */
const Icon = {
  Users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.8 13.6c2.9.4 5.2 2.9 5.2 6" />
    </svg>
  ),
  DropletA: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2s7 8.2 7 13a7 7 0 1 1-14 0c0-4.8 7-13 7-13z" />
    </svg>
  ),
  Severity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20h18M6 20V10M12 20V4M18 20v-7" />
    </svg>
  ),
  Therapy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="9" width="16" height="9" rx="2" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  ),
  FollowUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  ),
  Logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M14 15l4-4-4-4M18 11H9" />
    </svg>
  ),
  Cross: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18M3 12h18" strokeLinecap="round" />
    </svg>
  ),
  Alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4l9 16H3l9-16z" strokeLinejoin="round" />
      <path d="M12 10v4M12 17.5v.01" strokeLinecap="round" />
    </svg>
  ),
};

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */

function DoctorDashboard() {
     const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [patientSearch, setPatientSearch] = useState("");
const [releaseRequest, setReleaseRequest] = useState(null);
const [releaseLoading, setReleaseLoading] = useState(false);
const [releaseSuccess, setReleaseSuccess] = useState("");
const [recentExercisePredictions, setRecentExercisePredictions] = useState([]);
const [exercisePredictionLoading, setExercisePredictionLoading] = useState(true);
const [exercisePredictionError, setExercisePredictionError] = useState("");

const fetchRecentExercisePredictions = async () => {
  try {
    setExercisePredictionLoading(true);
    setExercisePredictionError("");

    const token = localStorage.getItem("staffAuthToken");

    if (!token) {
      setExercisePredictionError("Doctor authentication required");
      return;
    }

    const response = await api.get(
      "/exercise-recommendations/doctor/recent",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setRecentExercisePredictions(
      Array.isArray(response.data?.recommendations)
        ? response.data.recommendations
        : []
    );
  } catch (err) {
    console.error("Recent exercise prediction error:", err);
    setExercisePredictionError(
      err.response?.data?.message ||
        "Unable to load recent exercise predictions."
    );
  } finally {
    setExercisePredictionLoading(false);
  }
};

const fetchDashboard = async () => {
  try {
    setLoading(true);
    setError("");

    const token =
      localStorage.getItem("staffAuthToken");

    if (!token) {
      setError("Doctor authentication required");
      return;
    }

    const response = await api.get(
      "/doctor/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setDashboardData(response.data);
  } catch (error) {
    console.error(
      "Dashboard API error:",
      error
    );

    setError(
      error.response?.data?.message ||
        "Unable to load dashboard"
    );
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchDashboard();
  fetchRecentExercisePredictions();
}, []);

const pendingChangeRequests = Array.isArray(
  dashboardData?.changeRequests
)
  ? dashboardData.changeRequests
  : [];

const openReleaseModal = (request) => {
  setError("");
  setReleaseSuccess("");
  setReleaseRequest(request);
};

const closeReleaseModal = () => {
  if (releaseLoading) return;
  setReleaseRequest(null);
};

const releasePatient = async () => {
  const requestId = releaseRequest?.id;
  if (!requestId || releaseLoading) return;

  try {
    setReleaseLoading(true);
    setError("");
    setReleaseSuccess("");

    const token = localStorage.getItem("staffAuthToken");

    const response = await api.post(
      `/doctor/doctor-change-requests/${requestId}/release`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setReleaseRequest(null);
    setReleaseSuccess(
      response.data?.message ||
        "Patient released successfully. The patient can now select a new consulting doctor."
    );

    await fetchDashboard();

    window.setTimeout(() => {
      setReleaseSuccess("");
    }, 3500);
  } catch (err) {
    console.error("Release patient error:", err);
    setError(
      err.response?.data?.message ||
        "Unable to release the patient. Please try again."
    );
    setReleaseRequest(null);
  } finally {
    setReleaseLoading(false);
  }
};

// useEffect(() => {
//   const fetchDashboard = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const token = localStorage.getItem("staffAuthToken");

//       if (!token) {
//         setError("Doctor authentication required");
//         return;
//       }

//       const response = await api.get("/doctor/dashboard", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("DOCTOR DASHBOARD DATA:", response.data);

//       setDashboardData(response.data);
//     } catch (err) {
//       console.error("Dashboard API error:", err);

//       setError(
//         err.response?.data?.message ||
//           "Unable to load dashboard data"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchDashboard();
// }, []);

// =====================================================
// DOCTOR
// =====================================================

const doctorName = dashboardData?.doctor?.fullName || "";
const roleName = dashboardData?.doctor?.role || "Clinician";


// =====================================================
// OVERVIEW
// =====================================================

const overview = dashboardData?.overview || {};

const totalPatients =
  Number(overview.totalPatients) || 0;

const totalHemophiliaRecords =
  Number(overview.totalHemophiliaRecords) || 0;

const totalAssessments =
  Number(overview.totalAssessments) || 0;

const patientsWithBleedingHistory =
  Number(overview.patientsWithBleedingHistory) || 0;

const patients = Array.isArray(dashboardData?.patients)
  ? dashboardData.patients
  : [];

const filteredPatients = patients.filter((patient) => {
  const query = patientSearch.trim().toLowerCase();
  if (!query) return true;

  return [
    patient.fullName,
    patient.patientId,
    patient.type,
    patient.severity,
  ]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().includes(query)
    );
});


// =====================================================
// DISTRIBUTIONS
// =====================================================

const distributions =
  dashboardData?.distributions || {};


// =====================================================
// HEMOPHILIA TYPE
//
// Backend:
// {
//   hemophiliaType: {
//     A: 0,
//     B: 2,
//     C: 0,
//     Unknown: 0
//   }
// }
//
// Frontend/Recharts:
// [
//   { name: "A", value: 0 },
//   { name: "B", value: 2 },
//   ...
// ]
// =====================================================

const hemophiliaTypeObject =
  distributions.hemophiliaType ||
  distributions.hemophiliaTypes ||
  {};

const hemophiliaTypeA =
  Number(hemophiliaTypeObject.A) || 0;

const hemophiliaTypeB =
  Number(hemophiliaTypeObject.B) || 0;

const hemophiliaTypeC =
  Number(hemophiliaTypeObject.C) || 0;

const hemophiliaTypeUnknown =
  Number(hemophiliaTypeObject.Unknown) || 0;

const hemophiliaTypes = Array.isArray(
  hemophiliaTypeObject
)
  ? hemophiliaTypeObject
  : Object.entries(hemophiliaTypeObject).map(
      ([name, value]) => ({
        name,
        value: Number(value) || 0,
      })
    );


// =====================================================
// SEVERITY
//
// Backend:
// {
//   Mild: 0,
//   Moderate: 2,
//   Severe: 0,
//   Unknown: 0
// }
// =====================================================

const severityObject =
  distributions.severity || {};

const mildCases =
  Number(severityObject.Mild) || 0;

const moderateCases =
  Number(severityObject.Moderate) || 0;

const severeCases =
  Number(severityObject.Severe) || 0;

const unknownSeverity =
  Number(severityObject.Unknown) || 0;

const severity = Array.isArray(severityObject)
  ? severityObject
  : Object.entries(severityObject).map(
      ([name, value]) => ({
        name,
        value: Number(value) || 0,
      })
    );


// =====================================================
// AGE DISTRIBUTION
//
// Backend should return:
// [
//   { name: "0-10", value: 1 },
//   { name: "11-20", value: 2 },
//   ...
// ]
//
// We safely normalize it here.
// =====================================================

const rawAgeDistribution =
  distributions.ageDistribution;

const ageDistribution = Array.isArray(
  rawAgeDistribution
)
  ? rawAgeDistribution.map((item) => ({
      name:
        item.name ??
        item.ageGroup ??
        item.label ??
        "Unknown",

      value:
        Number(
          item.value ??
          item.count ??
          0
        ) || 0,
    }))
  : [];


// =====================================================
// AFFECTED JOINTS
//
// Backend:
// [
//   { joint: "Elbow", count: 2 },
//   { joint: "Shoulder", count: 2 }
// ]
//
// Recharts needs:
// [
//   { name: "Elbow", value: 2 },
//   ...
// ]
// =====================================================

const rawAffectedJoints =
  distributions.affectedJoints ||
  dashboardData?.clinicalBackground?.jointDistribution ||
  [];

const affectedJoints = Array.isArray(
  rawAffectedJoints
)
  ? rawAffectedJoints.map((item) => ({
      name:
        item.name ??
        item.joint ??
        "Unknown",

      value:
        Number(
          item.value ??
          item.count ??
          0
        ) || 0,
    }))
  : [];


// =====================================================
// FACTOR THERAPY
//
// Backend:
// {
//   active: 2,
//   none: 0,
//   unknown: 0
// }
// =====================================================

const factorTherapyObject =
  distributions.factorTherapy || {
    active: 0,
    none: 0,
    unknown: 0,
  };

const onFactorTherapy =
  Number(factorTherapyObject.active) || 0;

const factorTherapy = [
  {
    name: "Active Therapy",
    value:
      Number(factorTherapyObject.active) || 0,
  },
  {
    name: "No Therapy",
    value:
      Number(factorTherapyObject.none) || 0,
  },
  {
    name: "Unknown",
    value:
      Number(factorTherapyObject.unknown) || 0,
  },
];


// =====================================================
// FAMILY HISTORY
//
// Backend:
// {
//   yes: 0,
//   no: 0,
//   unknown: 2
// }
// =====================================================

const familyHistory =
  distributions.familyHistory || {
    yes: 0,
    no: 0,
    unknown: 0,
  };


// =====================================================
// GENETIC TESTING
//
// Backend:
// {
//   yes: 0,
//   no: 0,
//   unknown: 2
// }
//
// Convert to the names your frontend can use.
// =====================================================

const geneticTestingBackend =
  distributions.geneticTesting || {
    yes: 0,
    no: 0,
    unknown: 0,
  };

const geneticTesting = {
  done:
    Number(geneticTestingBackend.yes) || 0,

  notDone:
    Number(geneticTestingBackend.no) || 0,

  unknown:
    Number(geneticTestingBackend.unknown) || 0,
};


// =====================================================
// PHYSIOTHERAPY
//
// Backend:
// {
//   yes: 1,
//   no: 1,
//   unknown: 0
// }
//
// Convert to names used by frontend.
// =====================================================

const physiotherapyBackend =
  distributions.physiotherapy || {
    yes: 0,
    no: 0,
    unknown: 0,
  };

const physiotherapy = {
  current:
    Number(physiotherapyBackend.yes) || 0,

  notCurrent:
    Number(physiotherapyBackend.no) || 0,

  unknown:
    Number(physiotherapyBackend.unknown) || 0,
};


// =====================================================
// BLEEDING FREQUENCY
//
// Backend puts this under:
// clinicalBackground.bleedingFrequencyDistribution
//
// Example:
// [
//   { frequency: "2-3 times", count: 2 }
// ]
// =====================================================

const rawBleedingFrequency =
  dashboardData?.clinicalBackground
    ?.bleedingFrequencyDistribution || [];

const bleedingFrequency = Array.isArray(
  rawBleedingFrequency
)
  ? rawBleedingFrequency.map((item) => ({
      name:
        item.name ??
        item.frequency ??
        "Unknown",

      value:
        Number(
          item.value ??
          item.count ??
          0
        ) || 0,
    }))
  : [];


// =====================================================
// BLEEDING TRENDS
//
// Currently backend does not return this,
// so keep it safely empty.
// =====================================================

const bleedingTrends =
  Array.isArray(
    dashboardData?.bleedingTrends
  )
    ? dashboardData.bleedingTrends
    : [];


// =====================================================
// CLINICAL ALERTS
//
// Currently backend does not return this,
// so keep it safely empty.
// =====================================================

const clinicalAlerts =
  Array.isArray(
    dashboardData?.clinicalAlerts
  )
    ? dashboardData.clinicalAlerts
    : [];


// =====================================================
// FOLLOW-UP
//
// Your current backend does not provide a
// requiringFollowUp value.
//
// For now use bleeding-history count as
// the closest available indicator.
// =====================================================

const requiringFollowUp =
  patientsWithBleedingHistory;

  const initials = doctorName
    ? doctorName
        .replace(/^Dr\.?\s*/i, "")
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "--";

 
    const handleLogout = () => {
    localStorage.removeItem("staffAuthToken");
    localStorage.removeItem("staffUser");

    delete api.defaults.headers.common["Authorization"];

    navigate("/doctor-login");
    };
    // Intentionally left as an integration point — no auth logic here.
  
if (loading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading clinical dashboard...
    </div>
  );
}

if (error) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
      }}
    >
      <h2>Unable to load dashboard</h2>
      <p>{error}</p>

      <button
        onClick={fetchDashboard}
        className="main-btn"
      >
        Retry
      </button>
    </div>
  );
}
  return (
    <div className="dd-root">
      <style>{`
        .dd-root {
          --color-bg: #F5F8FC;
          --color-surface: #FFFFFF;
          --color-primary: #2C5CE0;
          --color-primary-dark: #163B85;
          --color-primary-soft: #EAF0FE;
          --color-accent: #0BA5A0;
          --color-accent-soft: #E4F6F5;
          --color-border: #DCE6F2;
          --color-text: #10233F;
          --color-text-secondary: #5B7291;
          --color-text-faint: #93A6C2;
          --shadow-card: 0 1px 2px rgba(16, 35, 63, 0.04), 0 6px 20px rgba(16, 35, 63, 0.05);
          --radius-lg: 16px;
          --radius-md: 12px;

          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--color-bg);
          color: var(--color-text);
          min-height: 100vh;
        }

        .dd-root * { box-sizing: border-box; }

        .dd-root .font-display {
          font-family: 'Manrope', 'Inter', sans-serif;
        }

        .dd-root .font-data {
          font-family: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;
          font-variant-numeric: tabular-nums;
        }

        /* ---------------- Navbar ---------------- */
        .dd-navbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
        .dd-navbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dd-logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(145deg, var(--color-primary), var(--color-primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .dd-logo-mark svg { width: 18px; height: 18px; }
        .dd-app-name {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: var(--color-text);
        }
        .dd-navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pr-dashboard-btn,
        .pr-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 8px 12px;

          border-radius: 9px;

          border: 1px solid var(--color-border);

          background: var(--color-surface);

          color: var(--color-text-secondary);

          font-size: 12.5px;
          font-weight: 600;

          cursor: pointer;

          transition: all 0.15s ease;
        }

        .pr-dashboard-btn:hover,
        .pr-logout-btn:hover {
          border-color: var(--color-primary);

          color: var(--color-primary-dark);

          background: var(--color-primary-soft);
        }

        .pr-dashboard-btn svg {
          width: 15px;
          height: 15px;
        }
        .dd-doctor-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dd-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--color-primary-soft);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          border: 1px solid var(--color-border);
        }
        .dd-doctor-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text);
          line-height: 1.2;
        }
        .dd-doctor-role {
          font-size: 11.5px;
          color: var(--color-text-secondary);
        }
        .dd-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 9px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dd-logout-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary-dark);
          background: var(--color-primary-soft);
        }
        .dd-logout-btn svg { width: 15px; height: 15px; }
        .dd-logout-btn:focus-visible,
        .stat-card:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* ---------------- Layout ---------------- */
        .dd-main {
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 28px 64px;
        }

        .dd-welcome {
          margin-bottom: 28px;
        }
        .dd-welcome-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.015em;
          margin: 0 0 6px;
        }
        .dd-welcome-subtitle {
          font-size: 14.5px;
          color: var(--color-text-secondary);
          margin: 0;
        }
        .dd-welcome-doctor {
          color: var(--color-primary-dark);
          font-weight: 700;
        }

        /* ---------------- Section header w/ signature pulse-line ---------------- */
        .section-header {
          margin: 44px 0 16px;
        }
        .section-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .section-eyebrow {
          font-family: 'Manrope', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-primary);
        }
        .pulse-line {
          flex: 1;
          height: 16px;
          color: var(--color-border);
          max-width: 220px;
        }
        .section-title {
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text);
        }
        .section-description {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 6px 0 0;
          max-width: 620px;
        }

        /* ---------------- KPI grid ---------------- */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 18px;
          box-shadow: var(--shadow-card);
        }
        .stat-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--color-primary-soft);
          color: var(--color-primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon svg { width: 16px; height: 16px; }
        .stat-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .stat-value {
          font-family: 'IBM Plex Mono', monospace;
          font-variant-numeric: tabular-nums;
          font-size: 26px;
          font-weight: 700;
          color: var(--color-text);
          line-height: 1;
        }
        .stat-description {
          font-size: 11.5px;
          color: var(--color-text-faint);
          margin: 8px 0 0;
          line-height: 1.4;
        }

        /* ---------------- Charts grid ---------------- */
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .chart-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .chart-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 18px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
        }
        .chart-card-wide {
          grid-column: 1 / -1;
        }
        .chart-card-header {
          margin-bottom: 12px;
        }
        .chart-card-title {
          font-family: 'Manrope', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          margin: 0 0 2px;
        }
        .chart-card-subtitle {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0;
        }
        .chart-card-body {
          flex: 1;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chart-card-footnote {
          font-size: 11.5px;
          color: var(--color-text-faint);
          margin: 12px 0 0;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
          line-height: 1.5;
        }

        /* ---------------- Empty states ---------------- */
        .empty-state {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 12px;
          color: var(--color-text-faint);
        }
        .empty-state-icon {
          width: 34px;
          height: 34px;
          color: var(--color-text-faint);
        }
        .empty-state-message {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0;
          text-align: center;
        }
        .empty-state-hint {
          font-size: 11.5px;
          color: var(--color-text-faint);
          margin: 0;
          text-align: center;
          max-width: 220px;
        }

        /* ---------------- Small stat rows (family/genetic/physio) ---------------- */
        .mini-stat-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .mini-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 9px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
        }
        .mini-stat-label {
          font-size: 12.5px;
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .mini-stat-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        /* ---------------- Clinical attention ---------------- */
        .attention-panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 24px;
        }

        /* ---------------- Privacy note ---------------- */
        .privacy-note {
          margin-top: 40px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: var(--color-accent-soft);
          border: 1px solid #C7EAE8;
        }
        .privacy-note svg {
          width: 16px;
          height: 16px;
          color: var(--color-accent);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .privacy-note p {
          margin: 0;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        /* ---------------- Assigned patients ---------------- */
        .patients-panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          margin-bottom: 42px;
        }
        .patients-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 22px;
          border-bottom: 1px solid var(--color-border);
        }
        .patients-count {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--color-text);
        }
        .patients-count span {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .patients-panel-hint {
          margin: 4px 0 0;
          font-size: 11.5px;
          color: var(--color-text-secondary);
        }
        .patient-search-wrap {
          width: min(360px, 100%);
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          border-radius: 10px;
          padding: 0 12px;
        }
        .patient-search-icon {
          color: var(--color-text-faint);
          font-size: 20px;
          line-height: 1;
        }
        .patient-search-wrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--color-text);
          padding: 11px 0;
          font-size: 12px;
        }
        .patients-table-wrap {
          overflow-x: auto;
        }
        .patients-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1080px;
        }
        .patients-table th {
          padding: 12px 14px;
          text-align: left;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: var(--color-text-faint);
          background: #F9FBFE;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .patients-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #EDF2F8;
          font-size: 12px;
          color: var(--color-text-secondary);
          white-space: nowrap;
        }
        .patients-table tbody tr:hover { background: #FBFDFF; }
        .patient-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 180px;
        }
        .patient-mini-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-soft);
          color: var(--color-primary-dark);
          border: 1px solid var(--color-border);
          font-size: 10px;
          font-weight: 800;
        }
        .patient-name-cell strong,
        .patient-name-cell span {
          display: block;
        }
        .patient-name-cell strong {
          color: var(--color-text);
          font-size: 12.5px;
          margin-bottom: 2px;
        }
        .patient-name-cell span {
          color: var(--color-text-faint);
          font-size: 10.5px;
        }
        .patient-id-badge {
          display: inline-flex;
          padding: 5px 7px;
          border-radius: 7px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          font-weight: 700;
        }
        .clinical-pill {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text-secondary);
          font-size: 10px;
          font-weight: 700;
          text-transform: capitalize;
        }
        .severity-severe, .risk-emergency {
          background: #FFF1F1;
          border-color: #F2C9C9;
          color: #A52B2B;
        }
        .severity-moderate, .risk-high {
          background: #FFF7E8;
          border-color: #F0D7A5;
          color: #8A5A00;
        }
        .severity-mild, .risk-low {
          background: #EDF9F7;
          border-color: #BDE8E2;
          color: #16746F;
        }
        .view-patient-btn {
          border: 0;
          background: transparent;
          color: var(--color-primary);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          padding: 6px 0;
        }
        .view-patient-btn:hover { color: var(--color-primary-dark); }
        .muted-value { color: var(--color-text-faint); }

        /* ---------------- Doctor change requests ---------------- */
        .change-requests-panel {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 4px 20px;
          margin-bottom: 42px;
        }
        .change-request-list {
          display: flex;
          flex-direction: column;
        }
        .change-request-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 2px;
          border-bottom: 1px solid #EDF2F8;
        }
        .change-request-item:last-child { border-bottom: 0; }
        .change-request-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .change-request-avatar {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-soft);
          color: var(--color-primary-dark);
          font-size: 10px;
          font-weight: 800;
          border: 1px solid var(--color-border);
        }
        .change-request-main strong,
        .change-request-main span,
        .change-request-main p {
          display: block;
        }
        .change-request-main strong {
          color: var(--color-text);
          font-size: 13px;
        }
        .change-request-main span {
          margin-top: 2px;
          color: var(--color-text-faint);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
        }
        .change-request-main p {
          margin: 5px 0 0;
          color: var(--color-text-secondary);
          font-size: 11px;
          max-width: 600px;
          white-space: normal;
        }
        .change-request-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .request-pending-pill {
          padding: 5px 8px;
          border-radius: 999px;
          background: #FFF7E8;
          border: 1px solid #F0D7A5;
          color: #8A5A00 !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 10px !important;
          font-weight: 700;
        }
        .release-patient-btn {
          border: 1px solid #D8A9A9;
          background: #FFF7F7;
          color: #9B3030;
          border-radius: 9px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .release-patient-btn:hover {
          background: #FFF0F0;
          border-color: #C98484;
        }

        /* ---------------- Release confirmation modal ---------------- */
        .release-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: releaseOverlayIn 0.18s ease-out;
        }
        .release-modal-card {
          width: min(460px, 100%);
          background: #ffffff;
          border: 1px solid #E4EAF2;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
          padding: 28px;
          animation: releaseModalIn 0.2s ease-out;
        }
        .release-modal-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFF5E8;
          border: 1px solid #F0D7A5;
          color: #9A6200;
          font-size: 25px;
          font-weight: 800;
        }
        .release-modal-card h3 {
          margin: 0;
          text-align: center;
          color: #172033;
          font-size: 20px;
          line-height: 1.3;
        }
        .release-modal-card > p {
          margin: 10px auto 0;
          max-width: 370px;
          text-align: center;
          color: #667085;
          font-size: 13px;
          line-height: 1.6;
        }
        .release-modal-patient {
          margin: 20px 0;
          padding: 13px 14px;
          border: 1px solid #E6EBF2;
          border-radius: 11px;
          background: #F8FAFC;
          text-align: center;
        }
        .release-modal-patient strong {
          display: block;
          color: #172033;
          font-size: 14px;
        }
        .release-modal-patient span {
          display: block;
          margin-top: 4px;
          color: #8791A1;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
        }
        .release-modal-warning {
          margin: 0 0 22px;
          padding: 11px 13px;
          border-left: 3px solid #D49A35;
          border-radius: 7px;
          background: #FFFAF0;
          color: #76551B;
          font-size: 11px;
          line-height: 1.55;
        }
        .release-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .release-modal-cancel,
        .release-modal-confirm {
          min-width: 112px;
          height: 40px;
          padding: 0 16px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.15s ease;
        }
        .release-modal-cancel {
          border: 1px solid #D9E0E9;
          background: #ffffff;
          color: #5D6879;
        }
        .release-modal-cancel:hover:not(:disabled) { background: #F7F9FC; }
        .release-modal-confirm {
          border: 1px solid #B96D6D;
          background: #A83A3A;
          color: #ffffff;
        }
        .release-modal-confirm:hover:not(:disabled) { background: #922F2F; }
        .release-modal-cancel:disabled,
        .release-modal-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .release-success-toast {
          position: fixed;
          top: 86px;
          right: 24px;
          z-index: 10000;
          width: min(420px, calc(100vw - 32px));
          padding: 13px 16px;
          border: 1px solid #BDE8E2;
          border-radius: 11px;
          background: #F2FCFA;
          color: #176D68;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
          animation: releaseToastIn 0.2s ease-out;
        }
        @keyframes releaseOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes releaseModalIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes releaseToastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ---------------- Responsive ---------------- */
        @media (max-width: 1080px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .chart-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          .dd-main { padding: 24px 16px 48px; }
          .stat-grid { grid-template-columns: 1fr; }
          .chart-grid { grid-template-columns: 1fr; }
          .chart-grid-2 { grid-template-columns: 1fr; }
          .dd-doctor-role { display: none; }
          .dd-navbar { padding: 12px 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dd-root * { transition: none !important; animation: none !important; }
        }
        .recent-exercise-panel{background:#fff;border:1px solid var(--color-border);border-radius:16px;padding:18px;box-shadow:var(--shadow-card);margin-bottom:30px}
        .recent-exercise-list{display:grid;gap:10px}
        .recent-exercise-row{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #e3eaf3;border-radius:12px;background:#fbfdff}
        .recent-exercise-icon{width:38px;height:38px;flex:0 0 38px;border-radius:10px;background:#edf3ff;color:#376bd4;display:flex;align-items:center;justify-content:center;font-weight:800}
        .recent-exercise-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}
        .recent-exercise-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .recent-exercise-title-row strong{font-size:14px;color:var(--color-text)}
        .recent-exercise-status{padding:4px 7px;border-radius:14px;font-size:8px;font-weight:800;background:#fff4dc;color:#98691b}
        .recent-exercise-status.active{background:#e7f7ef;color:#277d50}
        .recent-exercise-patient{font-size:11px;font-weight:700;color:#49698f}
        .recent-exercise-details{font-size:10px;color:#8192a5}
        .recent-exercise-record-btn{border:1px solid var(--color-border);background:#fff;color:var(--color-primary-dark);border-radius:8px;padding:8px 10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap}
        .recent-exercise-record-btn:hover{background:var(--color-primary-soft);border-color:#9eb9e9}
        .recent-exercise-empty{padding:24px;text-align:center;display:flex;flex-direction:column;gap:5px;color:#71839a;font-size:12px}
        .recent-exercise-empty strong{color:#2b405f}
        .recent-exercise-error{color:#a54848}
        @media(max-width:720px){.recent-exercise-row{align-items:flex-start;flex-wrap:wrap}.recent-exercise-record-btn{width:100%}}
      `}
</style>

      {/* ============================ NAVBAR ============================ */}
      <header className="dd-navbar">
        <div className="dd-navbar-left">
          <div className="dd-logo-mark">{Icon.Cross}</div>
          <span className="dd-app-name font-display">Hemophilia Care</span>
        </div>
        

        <div className="dd-navbar-right">
          <button
            className="pr-dashboard-btn"
            onClick={() => navigate("/doctor/patient-research")}
          >
            Patient Research
          </button>
          <div className="dd-doctor-block">
            <div className="dd-avatar font-display">{initials}</div>
            <div>
              {/* BACKEND: doctorName comes from authenticated session — see top of file */}
              <div className="dd-doctor-name">{doctorName || "--"}</div>
              <div className="dd-doctor-role">{roleName}</div>
            </div>
          </div>
          
          <button className="dd-logout-btn" onClick={handleLogout} type="button">
            {Icon.Logout}
            Log out
          </button>
        </div>
      </header>

      <main className="dd-main">
        {/* ============================ WELCOME ============================ */}
        <div className="dd-welcome">
          <h1 className="dd-welcome-title font-display">Clinical Dashboard</h1>
          <p className="dd-welcome-subtitle">
            {doctorName ? (
              <>
                Welcome back, <span className="dd-welcome-doctor">{doctorName}</span>. Overview of hemophilia care, patient population and clinical trends.
              </>
            ) : (
              "Overview of hemophilia care, patient population and clinical trends."
            )}
          </p>
        </div>

        {/* ============================ MY PATIENTS ============================ */}
        <SectionHeader
          eyebrow="Assigned Care"
          title="My Patients"
          description="Patients currently assigned to you as their consulting doctor. Select a patient to open the complete clinical research record."
        />

        <section className="patients-panel">
          <div className="patients-panel-top">
            <div>
              <div className="patients-count">
                {patients.length} <span>assigned patient{patients.length === 1 ? "" : "s"}</span>
              </div>
              <p className="patients-panel-hint">
                Only patients whose current consulting doctor is you are shown here.
              </p>
            </div>

            <div className="patient-search-wrap">
              <span className="patient-search-icon">⌕</span>
              <input
                type="search"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search name, Patient ID, type..."
                aria-label="Search assigned patients"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <EmptyState
              message={patients.length === 0 ? "No patients are currently assigned to you." : "No matching patients found."}
              hint={patients.length === 0 ? "Patients will appear here after they select you as their consulting doctor." : "Try searching by patient name or Patient ID."}
            />
          ) : (
            <div className="patients-table-wrap">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Patient ID</th>
                    <th>Age</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Last Bleed</th>
                    <th>Target Joint</th>
                    <th>Assessment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const assessment = patient.latestAssessment;
                    return (
                      <tr key={String(patient.userId || patient.patientId)}>
                        <td>
                          <div className="patient-name-cell">
                            <div className="patient-mini-avatar">
                              {(patient.fullName || patient.patientId || "P")
                                .split(" ")
                                .filter(Boolean)
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>{patient.fullName || "Unnamed patient"}</strong>
                              <span>{patient.gender || "Gender not recorded"}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="patient-id-badge">{patient.patientId || "--"}</span></td>
                        <td>{patient.age ?? "--"}</td>
                        <td>{patient.type || "--"}</td>
                        <td>
                          <span className={`clinical-pill severity-${String(patient.severity || "unknown").toLowerCase()}`}>
                            {patient.severity || "Unknown"}
                          </span>
                        </td>
                        <td>{patient.lastBleedDate ? new Date(patient.lastBleedDate).toLocaleDateString() : "Not recorded"}</td>
                        <td>{patient.targetJoint || "None recorded"}</td>
                        <td>
                          {assessment ? (
                            <span className={`clinical-pill risk-${String(assessment.riskLevel || "unknown").toLowerCase()}`}>
                              {assessment.riskLevel || "Unknown"}
                            </span>
                          ) : (
                            <span className="muted-value">No assessment</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="view-patient-btn"
                            onClick={() =>
                              navigate(`/doctor/patient-research?patientId=${encodeURIComponent(patient.patientId || "")}`)
                            }
                          >
                            View Record →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ==================== EXERCISE RECOMMENDATIONS TO REVIEW ====================
            The doctor-approval gate. Recommendations are generated as
            PENDING_DOCTOR_REVIEW and reach the patient only once approved
            here, so this panel has to be reachable from the dashboard --
            it was previously built but never rendered on any page. */}
        <ExerciseReviewPanel />

        {/* ============================ RECENT EXERCISE RECOMMENDATIONS ============================ */}
        <SectionHeader
          eyebrow="Rehabilitation"
          title="Recent Exercise Recommendations"
          description="Only the most recent recommendations are shown on the dashboard. Open the patient's research record to review the complete exercise history."
        />

        <section className="recent-exercise-panel">
          {exercisePredictionLoading ? (
            <div className="recent-exercise-empty">Loading recent exercise predictions…</div>
          ) : exercisePredictionError ? (
            <div className="recent-exercise-empty recent-exercise-error">
              {exercisePredictionError}
            </div>
          ) : recentExercisePredictions.length === 0 ? (
            <div className="recent-exercise-empty">
              <strong>No recent exercise predictions.</strong>
              <span>New ML predictions will appear here after patient clinical details are processed.</span>
            </div>
          ) : (
            <div className="recent-exercise-list">
              {recentExercisePredictions.map((item) => (
                <div className="recent-exercise-row" key={String(item._id)}>
                  <div className="recent-exercise-icon">✦</div>
                  <div className="recent-exercise-info">
                    <div className="recent-exercise-title-row">
                      <strong>{item.exerciseName || "Exercise"}</strong>
                      <span className={`recent-exercise-status ${item.status === "ACTIVE" ? "active" : "pending"}`}>
                        {item.status === "ACTIVE" ? "ACTIVE" : "PENDING REVIEW"}
                      </span>
                    </div>
                    <span className="recent-exercise-patient">
                      {item.patientName || "Unnamed patient"} · {item.patientId || "No Patient ID"}
                    </span>
                    <span className="recent-exercise-details">
                      {item.joint ? `Joint: ${item.joint}` : `Category: ${item.category || "General"}`}
                      {item.mlConfidence != null ? ` · ML confidence ${Math.round(Number(item.mlConfidence) * 100)}%` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="recent-exercise-record-btn"
                    onClick={() =>
                      navigate(`/doctor/patient-research?patientId=${encodeURIComponent(item.patientId || "")}`)
                    }
                  >
                    View Record →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================ CHANGE REQUESTS ============================ */}
        <SectionHeader
          eyebrow="Doctor Action"
          title="Doctor Change Requests"
          description="Patients currently assigned to you who have requested to change their consulting doctor."
        />

        <section className="change-requests-panel">
          {pendingChangeRequests.length === 0 ? (
            <EmptyState
              message="No pending doctor-change requests."
              hint="New requests from your assigned patients will appear here."
            />
          ) : (
            <div className="change-request-list">
              {pendingChangeRequests.map((request) => (
                <div className="change-request-item" key={String(request.id)}>
                  <div className="change-request-main">
                    <div className="change-request-avatar">
                      {(request.patientName || request.patientId || "P")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{request.patientName || "Unnamed patient"}</strong>
                      <span>{request.patientId || "Patient ID unavailable"}</span>
                      {request.reason && (
                        <p>Reason: {request.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="change-request-actions">
                    <span className="request-pending-pill">Pending</span>
                    <button
                      type="button"
                      className="release-patient-btn"
                      onClick={() => openReleaseModal(request)}
                    >
                      Release Patient
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================ 1. KPI CARDS ============================ */}
        <SectionHeader
          eyebrow="Population Overview"
          title="Overall Hemophilia Insights"
        />
        <div className="stat-grid">
          <StatCard
            label="Total Patients"
            value={totalPatients}
            description="All patients currently enrolled in the program."
            icon={Icon.Users}
          />
          <StatCard
            label="Hemophilia Type A"
            value={hemophiliaTypeA}
            description="Patients diagnosed with Factor VIII deficiency."
            icon={Icon.DropletA}
          />
          <StatCard
            label="Hemophilia Type B"
            value={hemophiliaTypeB}
            description="Patients diagnosed with Factor IX deficiency."
            icon={Icon.DropletA}
          />
          <StatCard
            label="Severe Cases"
            value={severeCases}
            description="Patients classified with severe disease severity."
            icon={Icon.Severity}
          />
          <StatCard
            label="Moderate Cases"
            value={moderateCases}
            description="Patients classified with moderate disease severity."
            icon={Icon.Severity}
          />
          <StatCard
            label="Mild Cases"
            value={mildCases}
            description="Patients classified with mild disease severity."
            icon={Icon.Severity}
          />
          <StatCard
            label="On Factor Therapy"
            value={onFactorTherapy}
            description="Patients currently receiving factor replacement therapy."
            icon={Icon.Therapy}
          />
          <StatCard
            label="Requiring Follow-up"
            value={requiringFollowUp}
            description="Patients flagged for clinical follow-up."
            icon={Icon.FollowUp}
          />
        </div>

        {/* ============================ 2 & 3. TYPE + SEVERITY ============================ */}
        <SectionHeader
          eyebrow="Distribution"
          title="Hemophilia Type & Severity Distribution"
          description="Aggregated breakdowns across your currently assigned patient population."
        />
        <div className="chart-grid">
          <ChartCard title="Hemophilia Type Distribution" subtitle="Type A · Type B · Type C · Unknown">
            {hemophiliaTypes.length === 0 ? (
              <EmptyState
                message="No clinical data available"
                hint="Chart will populate once type data is connected."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={hemophiliaTypes}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    >
                    {hemophiliaTypes.map((_, i) => (
                        <Cell
                        key={i}
                        fill={
                            CHART_COLORS[
                            i % CHART_COLORS.length
                            ]
                        }
                        />
                    ))}
                    </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Severity Distribution" subtitle="Mild · Moderate · Severe · Unknown">
            {severity.length === 0 ? (
              <EmptyState
                message="No clinical data available"
                hint="Chart will populate once severity data is connected."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severity}>
                  <CartesianGrid stroke="#EEF3FA" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2C5CE0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Age Distribution" subtitle="Aggregated age groups only — no individual DOBs">
            {ageDistribution.length === 0 ? (
              <EmptyState
                message="No clinical data available"
                hint="Chart will populate once demographic data is connected."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid stroke="#EEF3FA" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0BA5A0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ============================ 4. BLEEDING TRENDS ============================ */}
        {/* <SectionHeader
          eyebrow="Trends"
          title="Bleeding Trend Insights"
        />
        <ChartCard
          title="Bleeding Events Over Time"
          subtitle="Monthly aggregated bleeding-event count"
          wide
          footnote="Tracks aggregated bleeding-event trends over time to help clinicians identify changes in bleeding frequency."
        >
          {bleedingTrends.length === 0 ? (
            <EmptyState
              message="Clinical data will appear here once available."
              hint="Connect bleeding-event data to populate this trend line."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={bleedingTrends}>
                <CartesianGrid stroke="#EEF3FA" vertical={false} />
                <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="#2C5CE0"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2C5CE0" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard> */}

        {/* ============================ 5. AFFECTED JOINTS ============================ */}
        <SectionHeader
          eyebrow="Musculoskeletal"
          title="Affected Joint Insights"
          description="Aggregate trends across commonly affected joints for your currently assigned patients."
        />
        <ChartCard title="Commonly Affected Joints" subtitle="Knee · Elbow · Ankle · Hip · Other" wide>
          {affectedJoints.length === 0 ? (
            <EmptyState
              message="No data available"
              hint="Chart will populate once joint-involvement data is connected."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={affectedJoints} layout="vertical">
                <CartesianGrid stroke="#EEF3FA" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#5B7291" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip />
                <Bar dataKey="value" fill="#7C9CF0" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ============================ 6. FACTOR THERAPY ============================ */}
        <SectionHeader eyebrow="Treatment" title="Factor Therapy Insights" />
        <ChartCard
            title="Factor Therapy Status"
            subtitle="Currently on therapy · Not currently · Unknown"
            wide
            >
            {factorTherapy.length === 0 ? (
                <EmptyState
                message="Data unavailable"
                hint="Connect treatment-status data to populate this chart."
                />
            ) : (
                <ResponsiveContainer
                width="100%"
                height={220}
                >
                <PieChart>
                    <Pie
                    data={factorTherapy}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    >
                    {factorTherapy.map((_, i) => (
                        <Cell
                        key={i}
                        fill={
                            CHART_COLORS[
                            i % CHART_COLORS.length
                            ]
                        }
                        />
                    ))}
                    </Pie>

                    <Tooltip />
                </PieChart>
                </ResponsiveContainer>
            )}
            </ChartCard>

        {/* ============================ 7. FAMILY HISTORY / GENETIC / PHYSIO ============================ */}
        <SectionHeader
          eyebrow="Clinical Background"
          title="Family History, Genetic Testing & Physiotherapy"
          description="Aggregated family-history and testing information for your currently assigned patients."
        />
        <div className="chart-grid-2">
          <ChartCard title="Family History" subtitle="Aggregated across population">
            <div className="mini-stat-row">
              <MiniStat label="Family history present" value={familyHistory.yes} />
              <MiniStat label="No family history" value={familyHistory.no} />
              <MiniStat label="Unknown" value={familyHistory.unknown} />
            </div>
          </ChartCard>

          <ChartCard title="Genetic Testing" subtitle="Aggregated across population">
            <div className="mini-stat-row">
              <MiniStat label="Testing completed" value={geneticTesting.done} />
              <MiniStat label="Not completed" value={geneticTesting.notDone} />
              <MiniStat label="Unknown" value={geneticTesting.unknown} />
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Physiotherapy Status" subtitle="Currently under physiotherapy · Not currently · Unknown" wide>
          <div className="mini-stat-row">
            <MiniStat label="Currently under physiotherapy" value={physiotherapy.current} />
            <MiniStat label="Not currently under physiotherapy" value={physiotherapy.notCurrent} />
            <MiniStat label="Unknown" value={physiotherapy.unknown} />
          </div>
        </ChartCard>

        {/* ============================ 8. CLINICAL ATTENTION ============================ */}
        <SectionHeader
          eyebrow="Alerts"
          title="Clinical Attention"
          description="Authorized, aggregated indicators requiring clinician review. Individual patient records are never rendered on this dashboard."
        />
        <div className="attention-panel">
          {clinicalAlerts.length === 0 ? (
            <EmptyState
              message="No clinical alerts available"
              hint="Follow-up flags, frequent-bleeding indicators and target-joint concerns will appear here once connected."
            />
          ) : (
            // BACKEND: render authorized alert objects here — never construct
            // or invent alert entries on the frontend.
            <div className="mini-stat-row">
              {clinicalAlerts.map((alert, i) => (
                <div className="mini-stat" key={i}>
                    <span className="mini-stat-label">
                    {alert.title}
                    </span>

                    <span className="mini-stat-value font-data">
                    {alert.count}
                    </span>

                    {alert.description && (
                    <span className="mini-stat-description">
                        {alert.description}
                    </span>
                    )}
                </div>
                ))}
            </div>
          )}
        </div>

        {/* ============================ PRIVACY NOTE ============================ */}
        <div className="privacy-note">
          {Icon.Alert}
          <p>
            Patient-level information on the My Patients table is shown only for patients
            currently assigned to the authenticated doctor. The research view is also
            server-authorized against the current doctor-patient assignment.
          </p>
        </div>
      </main>

      {releaseSuccess && (
        <div className="release-success-toast" role="status">
          ✓ {releaseSuccess}
        </div>
      )}

      {releaseRequest && (
        <div
          className="release-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !releaseLoading) {
              closeReleaseModal();
            }
          }}
        >
          <div
            className="release-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="release-patient-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="release-modal-icon">!</div>
            <h3 id="release-patient-title">Release this patient?</h3>
            <p>Are you sure you want to release this patient from your care?</p>

            <div className="release-modal-patient">
              <strong>{releaseRequest.patientName || "Unnamed patient"}</strong>
              <span>{releaseRequest.patientId || "Patient ID unavailable"}</span>
            </div>

            <div className="release-modal-warning">
              After release, the patient will be able to select a new consulting doctor.
            </div>

            <div className="release-modal-actions">
              <button
                type="button"
                className="release-modal-cancel"
                onClick={closeReleaseModal}
                disabled={releaseLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="release-modal-confirm"
                onClick={releasePatient}
                disabled={releaseLoading}
              >
                {releaseLoading ? "Releasing..." : "Yes, Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  const display = value === null || value === undefined ? "--" : value;
  return (
    <div className="mini-stat">
      <span className="mini-stat-label">{label}</span>
      <span className="mini-stat-value font-data">{display}</span>
    </div>
  );
}

export default DoctorDashboard;
