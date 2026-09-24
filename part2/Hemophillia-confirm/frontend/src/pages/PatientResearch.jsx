




// // import React, { useEffect, useMemo, useState } from "react";

// // import {
// //   LineChart,
// //   Line,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// // } from "recharts";

// // import { useNavigate, useSearchParams } from "react-router-dom";
// // import api from "../apiClient";


// // export default function PatientResearch() {

// //   const navigate = useNavigate();
// //   const [searchParams] = useSearchParams();


// //   // =========================================================
// //   // STATE
// //   // =========================================================

// //   const [patientId, setPatientId] = useState("");

// //   const [patient, setPatient] = useState(null);

// //   const [loading, setLoading] = useState(false);

// //   const [error, setError] = useState("");

// //   const [selectedAssessmentId, setSelectedAssessmentId] =
// //     useState("");


// //   // =========================================================
// //   // DOCTOR
// //   // =========================================================

// //   const staffUser = JSON.parse(
// //     localStorage.getItem("staffUser") || "{}"
// //   );

// //   const doctorName =
// //     staffUser?.fullName || "Clinician";

// //   const roleName = staffUser?.role || "Clinician";


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


// //   // =========================================================
// //   // LOGOUT
// //   // =========================================================

// //   const handleLogout = () => {

// //     localStorage.removeItem("staffAuthToken");
// //     localStorage.removeItem("staffUser");
// //     localStorage.removeItem("professionalId");

// //     delete api.defaults.headers.common.Authorization;

// //     navigate("/doctor-login");
// //   };


// //   // =========================================================
// //   // SEARCH PATIENT
// //   // =========================================================

// //   const searchPatient = async (e, patientIdOverride = patientId) => {

// //     e?.preventDefault();

// //     const cleanPatientId =
// //       String(patientIdOverride || "").trim().toUpperCase();


// //     if (!cleanPatientId) {

// //       setError(
// //         "Please enter a Patient ID."
// //       );

// //       return;
// //     }


// //     setLoading(true);
// //     setError("");
// //     setPatient(null);
// //     setSelectedAssessmentId("");


// //     try {

// //       console.log(
// //         "================================="
// //       );

// //       console.log(
// //         "PATIENT RESEARCH"
// //       );

// //       console.log(
// //         "Searching:",
// //         cleanPatientId
// //       );

// //       console.log(
// //         "================================="
// //       );


// //       const response =
// //         await api.get(
// //           `/doctor/patient-research/${cleanPatientId}`
// //         );


// //       console.log(
// //         "Patient Research Response:",
// //         response.data
// //       );


// //       if (!response.data?.success) {

// //         throw new Error(
// //           response.data?.message ||
// //           "Unable to retrieve patient."
// //         );
// //       }


// //       setPatient(
// //         response.data
// //       );


// //       // =====================================================
// //       // AUTOMATICALLY SELECT LATEST ASSESSMENT
// //       // =====================================================

// //       const history =
// //         Array.isArray(
// //           response.data.assessmentHistory
// //         )
// //           ? response.data.assessmentHistory
// //           : [];


// //       if (history.length > 0) {

// //         const latest =
// //           history[
// //             history.length - 1
// //           ];


// //         setSelectedAssessmentId(
// //           String(
// //             latest.id ||
// //             latest._id ||
// //             ""
// //           )
// //         );
// //       }

// //     } catch (err) {

// //       console.error(
// //         "Patient research error:",
// //         err
// //       );


// //       setError(
// //         err.response?.data?.message ||
// //         err.message ||
// //         "Unable to find patient record."
// //       );

// //     } finally {

// //       setLoading(false);
// //     }
// //   };

// //   // =========================================================
// //   // OPEN A PATIENT DIRECTLY FROM THE DOCTOR DASHBOARD
// //   // =========================================================

// //   useEffect(() => {
// //     const requestedPatientId =
// //       searchParams.get("patientId")?.trim().toUpperCase();

// //     if (!requestedPatientId) return;

// //     setPatientId(requestedPatientId);

// //     // Run the same secured search used by the form.
// //     searchPatient(undefined, requestedPatientId);
// //   }, [searchParams]);

// //   // =========================================================
// // // DOWNLOAD PATIENT PDF
// // // =========================================================

// // const downloadPatientPDF = async () => {
// //   const cleanPatientId =
// //     patientId.trim().toUpperCase();

// //   if (!cleanPatientId) {
// //     setError(
// //       "Search for a patient before downloading the record."
// //     );
// //     return;
// //   }

// //   try {
// //     setLoading(true);
// //     setError("");

// //     const response = await api.get(
// //       `/doctor/patient-research/${cleanPatientId}/pdf`,
// //       {
// //         responseType: "blob",
// //       }
// //     );

// //     const blob = new Blob(
// //       [response.data],
// //       {
// //         type: "application/pdf",
// //       }
// //     );

// //     const url =
// //       window.URL.createObjectURL(blob);

// //     const link =
// //       document.createElement("a");

// //     link.href = url;

// //     link.download =
// //       `Patient_Record_${cleanPatientId}.pdf`;

// //     document.body.appendChild(link);

// //     link.click();

// //     link.remove();

// //     window.URL.revokeObjectURL(url);

// //   } catch (err) {
// //     console.error(
// //       "Patient PDF download error:",
// //       err
// //     );

// //     setError(
// //       "Unable to download the patient record."
// //     );
// //   } finally {
// //     setLoading(false);
// //   }
// // };


// //   // =========================================================
// //   // HELPERS
// //   // =========================================================

// //   const value = (
// //     v,
// //     fallback = "Not available"
// //   ) => {

// //     if (
// //       v === null ||
// //       v === undefined ||
// //       v === ""
// //     ) {
// //       return fallback;
// //     }

// //     return v;
// //   };


// //   const formatDate = (date) => {

// //     if (!date) {
// //       return "Not available";
// //     }


// //     const d =
// //       new Date(date);


// //     if (
// //       Number.isNaN(
// //         d.getTime()
// //       )
// //     ) {
// //       return "Not available";
// //     }


// //     return d.toLocaleDateString(
// //       "en-IN",
// //       {
// //         day: "2-digit",
// //         month: "short",
// //         year: "numeric",
// //       }
// //     );
// //   };


// //   const formatDateTime = (date) => {

// //     if (!date) {
// //       return "Not available";
// //     }


// //     const d =
// //       new Date(date);


// //     if (
// //       Number.isNaN(
// //         d.getTime()
// //       )
// //     ) {
// //       return "Not available";
// //     }


// //     return d.toLocaleString(
// //       "en-IN",
// //       {
// //         day: "2-digit",
// //         month: "short",
// //         year: "numeric",
// //         hour: "2-digit",
// //         minute: "2-digit",
// //       }
// //     );
// //   };


// //   const formatBoolean = (v) => {

// //     if (v === true) {
// //       return "Yes";
// //     }

// //     if (v === false) {
// //       return "No";
// //     }

// //     return "Not available";
// //   };


// //   const formatAnswer = (answer) => {

// //     if (Array.isArray(answer)) {

// //       return answer.length
// //         ? answer.join(", ")
// //         : "Not answered";
// //     }


// //     if (
// //       typeof answer === "boolean"
// //     ) {

// //       return answer
// //         ? "Yes"
// //         : "No";
// //     }


// //     if (
// //       answer === null ||
// //       answer === undefined ||
// //       answer === ""
// //     ) {

// //       return "Not answered";
// //     }


// //     return String(answer);
// //   };


// //   // =========================================================
// //   // RESPONSE DATA
// //   // =========================================================

// //   const data =
// //     patient || {};


// //   const profile =
// //     data.patient || {};


// //   const hemophilia =
// //     data.hemophilia || {};


// //   const contact =
// //     data.contact || {};


// //   const emergencyContact =
// //     data.emergencyContact || {};


// //   const careTeam =
// //     data.careTeam || {};


// //   const familyGeneticHistory =
// //     data.familyGeneticHistory || {};


// //   const bleedingHistory =
// //     data.bleedingHistory || {};


// //   const treatment =
// //     data.treatment || {};


// //   const statistics =
// //     data.statistics || {};


// //   const timeline =
// //     Array.isArray(data.timeline)
// //       ? data.timeline
// //       : [];


// //   // =========================================================
// //   // ASSESSMENT HISTORY
// //   // =========================================================

// //   const assessmentHistory =
// //     Array.isArray(
// //       data.assessmentHistory
// //     )
// //       ? data.assessmentHistory
// //       : [];


// //   // =========================================================
// //   // ASSESSMENT GRAPH
// //   // =========================================================

// //   const assessmentChartData =
// //     useMemo(() => {

// //       return assessmentHistory.map(
// //         (assessment, index) => ({

// //           assessmentNumber:
// //             assessment.assessmentNumber ??
// //             index + 1,

// //           assessmentId:
// //             assessment.id ||
// //             assessment._id ||
// //             index,

// //           score:
// //             Number(
// //               assessment.score ??
// //               0
// //             ),

// //           riskLevel:
// //             assessment.riskLevel ||
// //             "Unknown",

// //           date:
// //             assessment.date ||
// //             assessment.createdAt,

// //           displayDate:
// //             formatDate(
// //               assessment.date ||
// //               assessment.createdAt
// //             ),
// //         })
// //       );

// //     }, [assessmentHistory]);


// //   // =========================================================
// //   // SELECTED ASSESSMENT
// //   // =========================================================

// //   const selectedAssessment =
// //     useMemo(() => {

// //       if (
// //         assessmentHistory.length === 0
// //       ) {
// //         return null;
// //       }


// //       if (!selectedAssessmentId) {

// //         return (
// //           assessmentHistory[
// //             assessmentHistory.length - 1
// //           ]
// //         );
// //       }


// //       return (
// //         assessmentHistory.find(
// //           (assessment) =>
// //             String(
// //               assessment.id ||
// //               assessment._id
// //             ) ===
// //             String(
// //               selectedAssessmentId
// //             )
// //         ) ||
// //         assessmentHistory[
// //           assessmentHistory.length - 1
// //         ]
// //       );

// //     }, [
// //       assessmentHistory,
// //       selectedAssessmentId,
// //     ]);


// //   // =========================================================
// //   // SELECTED ASSESSMENT ANSWERS
// //   // =========================================================
// //   //
// //   // IMPORTANT:
// //   //
// //   // We ONLY display the answers stored inside
// //   // this particular Assessment.
// //   //
// //   // We DO NOT calculate a new score.
// //   //
// //   // =========================================================

// //   const selectedAnswers =
// //     useMemo(() => {

// //       if (!selectedAssessment) {
// //         return [];
// //       }


// //       if (
// //         Array.isArray(
// //           selectedAssessment.answers
// //         )
// //       ) {

// //         return selectedAssessment.answers
// //           .filter(
// //             (item) =>
// //               item &&
// //               item.question
// //           )
// //           .map(
// //             (item, index) => ({

// //               id:
// //                 index,

// //               question:
// //                 item.question,

// //               answer:
// //                 formatAnswer(
// //                   item.answer
// //                 ),
// //             })
// //           );
// //       }


// //       return [];

// //     }, [selectedAssessment]);


// //   // =========================================================
// //   // SELECTED ASSESSMENT EXPLANATION
// //   // =========================================================

// //   const selectedExplanation =
// //     useMemo(() => {

// //       if (!selectedAssessment) {
// //         return [];
// //       }


// //       if (
// //         Array.isArray(
// //           selectedAssessment.explanation
// //         )
// //       ) {

// //         return selectedAssessment
// //           .explanation
// //           .filter(Boolean);
// //       }


// //       if (
// //         selectedAssessment.summaryText
// //       ) {

// //         return String(
// //           selectedAssessment.summaryText
// //         )
// //           .split("\n")
// //           .map(
// //             (x) => x.trim()
// //           )
// //           .filter(Boolean);
// //       }


// //       return [];

// //     }, [selectedAssessment]);


// //   // =========================================================
// //   // SELECTED ASSESSMENT FACTORS
// //   // =========================================================

// //   const selectedFactors =
// //     selectedAssessment?.factors || {};


// //   // =========================================================
// //   // STATUS BADGE
// //   // =========================================================

// //   const StatusBadge = ({
// //     text,
// //   }) => {

// //     const normalized =
// //       String(
// //         text || ""
// //       ).toLowerCase();


// //     let className =
// //       "pr-status";


// //     if (
// //       normalized.includes(
// //         "emergency"
// //       ) ||
// //       normalized.includes(
// //         "high"
// //       )
// //     ) {

// //       className +=
// //         " pr-status-danger";

// //     } else if (
// //       normalized.includes(
// //         "moderate"
// //       )
// //     ) {

// //       className +=
// //         " pr-status-warning";

// //     } else if (
// //       normalized.includes(
// //         "low"
// //       )
// //     ) {

// //       className +=
// //         " pr-status-safe";
// //     }


// //     return (
// //       <span
// //         className={className}
// //       >
// //         {value(text)}
// //       </span>
// //     );
// //   };


// //   // =========================================================
// //   // SECTION HEADER
// //   // =========================================================

// //   const SectionHeader = ({
// //     eyebrow,
// //     title,
// //     description,
// //   }) => (

// //     <div className="pr-section-header">

// //       <div className="pr-section-header-top">

// //         {eyebrow && (
// //           <span className="pr-section-eyebrow">
// //             {eyebrow}
// //           </span>
// //         )}

// //         <svg
// //           className="pr-pulse-line"
// //           viewBox="0 0 120 24"
// //           preserveAspectRatio="none"
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


// //       <h2 className="pr-section-title">
// //         {title}
// //       </h2>


// //       {description && (
// //         <p className="pr-section-description">
// //           {description}
// //         </p>
// //       )}

// //     </div>
// //   );


// //   // =========================================================
// //   // INFO CARD
// //   // =========================================================

// //   const InfoCard = ({
// //     label,
// //     value: cardValue,
// //   }) => (

// //     <div className="pr-info-item">

// //       <span className="pr-info-label">
// //         {label}
// //       </span>

// //       <span className="pr-info-value">
// //         {value(cardValue)}
// //       </span>

// //     </div>
// //   );


// //   // =========================================================
// //   // EMPTY STATE
// //   // =========================================================

// //   const EmptyState = ({
// //     text,
// //   }) => (

// //     <div className="pr-empty">

// //       <div className="pr-empty-line" />

// //       <p>
// //         {text}
// //       </p>

// //     </div>
// //   );


// //   // =========================================================
// //   // RENDER
// //   // =========================================================

// //   return (

// //     <div className="pr-root">

// //       {/* =====================================================
// //           NAVBAR
// //       ===================================================== */}

// //       <header className="pr-navbar">

// //         <div className="pr-navbar-left">

// //           <div className="pr-logo-mark">

// //             <svg
// //               viewBox="0 0 24 24"
// //               fill="none"
// //             >

// //               <path
// //                 d="M12 3v18M3 12h18"
// //                 stroke="currentColor"
// //                 strokeWidth="2.5"
// //                 strokeLinecap="round"
// //               />

// //             </svg>

// //           </div>


// //           <span className="pr-app-name">
// //             Hemophilia Care
// //           </span>

// //         </div>


// //         <div className="pr-navbar-right">

// //           <button
// //             className="pr-dashboard-btn"
// //             onClick={() =>
// //               navigate(
// //                 "/doctor-dashboard"
// //               )
// //             }
// //             type="button"
// //           >

// //             Dashboard

// //           </button>


// //           <div className="pr-doctor-block">

// //             <div className="pr-avatar">
// //               {initials}
// //             </div>


// //             <div>

// //               <div className="pr-doctor-name">
// //                 {doctorName}
// //               </div>

// //               <div className="pr-doctor-role">
// //                 {roleName}
// //               </div>

// //             </div>

// //           </div>


// //           <button
// //             className="pr-logout-btn"
// //             onClick={handleLogout}
// //             type="button"
// //           >
// //             Log out
// //           </button>

// //         </div>

// //       </header>


// //       {/* =====================================================
// //           MAIN
// //       ===================================================== */}

// //       <main className="pr-main">

// //         <div className="pr-page-header">

// //           <h1 className="pr-title">
// //             Patient Research
// //           </h1>

// //           <p className="pr-subtitle">
// //             Search and review the complete
// //             clinical history of an individual
// //             patient.
// //           </p>

// //         </div>


// //         {/* =====================================================
// //             SEARCH
// //         ===================================================== */}

// //         <section className="pr-search-card">

// //           <div className="pr-search-heading">

// //             <span className="pr-search-eyebrow">
// //               Patient Lookup
// //             </span>

// //             <h2>
// //               Search Patient Record
// //             </h2>

// //             <p>
// //               Enter the patient's registered
// //               Patient ID to retrieve their
// //               clinical information.
// //             </p>

            

// //           </div>


// //           <form
// //             className="pr-search-form"
// //             onSubmit={searchPatient}
// //           >

// //             <div className="pr-input-wrapper">

// //               <label htmlFor="patientId">
// //                 Patient ID
// //               </label>

// //               <input
// //                 id="patientId"
// //                 type="text"
// //                 value={patientId}
// //                 onChange={(e) =>
// //                   setPatientId(
// //                     e.target.value
// //                   )
// //                 }
// //                 placeholder="Enter Patient ID"
// //                 autoComplete="off"
// //               />

// //             </div>


// //             <button
// //               className="pr-search-btn"
// //               type="submit"
// //               disabled={loading}
// //             >

// //               {loading
// //                 ? "Searching..."
// //                 : "Search Patient"}

// //             </button>

// //           </form>

// //           <button
// //                 type="button"
// //                 className="pdf-btn"
// //                 onClick={downloadPatientPDF}
// //                 disabled={loading}
// //             >
// //                 {loading
// //                 ? "Generating PDF..."
// //                 : "Download Patient Record"}
// //             </button>


// //           {error && (
// //             <div className="pr-error">
// //               {error}
// //             </div>
// //           )}

// //         </section>


// //         {/* =====================================================
// //             INITIAL STATE
// //         ===================================================== */}

// //         {!patient &&
// //           !loading &&
// //           !error && (

// //             <div className="pr-initial-state">

// //               <h3>
// //                 Search for a patient
// //               </h3>

// //               <p>
// //                 Enter a valid Patient ID above
// //                 to view the patient's clinical
// //                 record.
// //               </p>

// //             </div>
// //           )}


// //         {/* =====================================================
// //             PATIENT RECORD
// //         ===================================================== */}

// //         {patient && (

// //           <div className="pr-record">

// //             {/* =================================================
// //                 PATIENT HEADER
// //             ================================================= */}

// //             <div className="pr-patient-header">

// //               <div className="pr-patient-identity">

// //                 <div className="pr-patient-avatar">

// //                   {String(
// //                     value(
// //                       profile.fullName,
// //                       "P"
// //                     )
// //                   )
// //                     .split(" ")
// //                     .map(
// //                       (x) => x[0]
// //                     )
// //                     .slice(0, 2)
// //                     .join("")
// //                     .toUpperCase()}

// //                 </div>


// //                 <div>

// //                   <span className="pr-record-label">
// //                     Patient Record
// //                   </span>

// //                   <h2>
// //                     {value(
// //                       profile.fullName
// //                     )}
// //                   </h2>

// //                   <p>
// //                     Patient ID:{" "}
// //                     <strong>
// //                       {value(
// //                         profile.patientId ||
// //                         patientId
// //                       )}
// //                     </strong>
// //                   </p>

// //                 </div>

// //               </div>


// //               <div className="pr-patient-meta">

// //                 <span>
// //                   Record Status
// //                 </span>

// //                 <strong className="pr-active">
// //                   Active
// //                 </strong>

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 PATIENT SUMMARY
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Clinical Overview"
// //               title="Patient Summary"
// //               description="A concise overview compiled from the patient's stored clinical records."
// //             />


// //             <div className="pr-stat-grid">

// //               <div className="pr-stat-card">

// //                 <span>
// //                   Hemophilia Type
// //                 </span>

// //                 <strong>
// //                   {value(
// //                     hemophilia.type
// //                   )}
// //                 </strong>

// //               </div>


// //               <div className="pr-stat-card">

// //                 <span>
// //                   Severity
// //                 </span>

// //                 <strong>
// //                   {value(
// //                     hemophilia.severity
// //                   )}
// //                 </strong>

// //               </div>


// //               <div className="pr-stat-card">

// //                 <span>
// //                   Latest Risk
// //                 </span>

// //                 <strong>

// //                   <StatusBadge
// //                     text={
// //                       selectedAssessment?.riskLevel ||
// //                       "Not available"
// //                     }
// //                   />

// //                 </strong>

// //               </div>


// //               <div className="pr-stat-card">

// //                 <span>
// //                   Assessments
// //                 </span>

// //                 <strong>
// //                   {statistics.totalAssessments ??
// //                     assessmentHistory.length}
// //                 </strong>

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 DEMOGRAPHICS
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Demographics"
// //               title="Patient Information"
// //               description="Basic demographic information registered for this patient."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Full Name"
// //                   value={
// //                     profile.fullName
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Patient ID"
// //                   value={
// //                     profile.patientId
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Gender"
// //                   value={
// //                     profile.gender
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Age"
// //                   value={
// //                     profile.age
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Date of Birth"
// //                   value={
// //                     formatDate(
// //                       profile.dateOfBirth
// //                     )
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Blood Group"
// //                   value={
// //                     profile.bloodGroup
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="City"
// //                   value={
// //                     profile.city
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="State"
// //                   value={
// //                     profile.state
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="PIN Code"
// //                   value={
// //                     profile.pinCode
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 CONTACT
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Contact"
// //               title="Patient Contact Information"
// //               description="Contact information available in the authenticated clinical record."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Mobile"
// //                   value={
// //                     contact.mobile
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Alternate Contact"
// //                   value={
// //                     contact.alternateContact
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Email"
// //                   value={
// //                     contact.email
// //                   }
// //                 />

                

// //                 <InfoCard
// //                   label="City"
// //                   value={
// //                     contact.city
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="State"
// //                   value={
// //                     contact.state
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="PIN Code"
// //                   value={
// //                     contact.pinCode
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 HEMOPHILIA
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Hemophilia Profile"
// //               title="Disease Information"
// //               description="Clinical information related to the patient's hemophilia diagnosis and management."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Hemophilia Type"
// //                   value={
// //                     hemophilia.type
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Severity"
// //                   value={
// //                     hemophilia.severity
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Age at Diagnosis"
// //                   value={
// //                     hemophilia.ageAtDiagnosis
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Family History"
// //                   value={
// //                     familyGeneticHistory.familyHistory
// //                   }
// //                 />

                

// //                 <InfoCard
// //                   label="Factor Therapy"
// //                   value={
// //                     hemophilia.currentFactorTherapy
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Other Medications"
// //                   value={
// //                     hemophilia.otherMedications
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Bleed Frequency"
// //                   value={
// //                     hemophilia.bleedFrequency
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Last Bleed"
// //                   value={
// //                     formatDate(
// //                       hemophilia.lastBleedDate
// //                     )
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Physiotherapy"
// //                   value={
// //                     formatBoolean(
// //                       hemophilia.underPhysiotherapy
// //                     )
// //                   }
// //                 />
// //                 <InfoCard
// //                   label="Male Relative Flag"
// //                   value={
// //                     formatBoolean(
// //                       familyGeneticHistory.maleRelativeFlag
// //                     )
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 FAMILY / GENETIC
// //             ================================================= */}

// //             {/* <SectionHeader
// //               eyebrow="Family & Genetics"
// //               title="Family Genetic History"
// //               description="Family-history and genetic-testing information recorded in the clinical system."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Family History"
// //                   value={
// //                     familyGeneticHistory.familyHistory
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Genetic Testing Done"
// //                   value={
// //                     familyGeneticHistory.geneticTestingDone
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Previous Testing"
// //                   value={
// //                     familyGeneticHistory.previousTesting
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Low Factor History"
// //                   value={
// //                     familyGeneticHistory.factorLow
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Male Relative Flag"
// //                   value={
// //                     formatBoolean(
// //                       familyGeneticHistory.maleRelativeFlag
// //                     )
// //                   }
// //                 />

// //               </div>

// //             </div> */}


// //             {/* =================================================
// //                 BLEEDING HISTORY
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Bleeding History"
// //               title="Bleeding Profile"
// //               description="Bleeding information recorded in the patient's clinical history."
// //             />


// //             <div className="pr-stat-grid">

// //               <div className="pr-stat-card">

// //                 <span>
// //                   Bleed Frequency
// //                 </span>

// //                 <strong>
// //                   {value(
// //                     bleedingHistory.bleedFrequency ||
// //                     hemophilia.bleedFrequency
// //                   )}
// //                 </strong>

// //               </div>


// //               <div className="pr-stat-card">

// //                 <span>
// //                   Last Bleeding Event
// //                 </span>

// //                 <strong>
// //                   {formatDate(
// //                     bleedingHistory.lastBleedDate ||
// //                     hemophilia.lastBleedDate
// //                   )}
// //                 </strong>

// //               </div>


// //               <div className="pr-stat-card">

// //                 <span>
// //                   Affected Joints
// //                 </span>

// //                 <strong>
// //                   {
// //                     Array.isArray(
// //                       bleedingHistory.jointsAffected
// //                     )
// //                       ? bleedingHistory
// //                           .jointsAffected
// //                           .length
// //                       : 0
// //                   }
// //                 </strong>

// //               </div>

// //             </div>


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Minor-cut Bleeding"
// //                   value={
// //                     bleedingHistory.bleedingAfterMinorCuts
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Dental / Surgery Bleeding"
// //                   value={
// //                     bleedingHistory.dentalSurgeryBleeding
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Bruising"
// //                   value={
// //                     bleedingHistory.bruising
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Muscle Swelling"
// //                   value={
// //                     bleedingHistory.muscleSwelling
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Joint Swelling"
// //                   value={
// //                     bleedingHistory.jointSwelling
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Blood in Urine / Stool"
// //                   value={
// //                     bleedingHistory.bloodUrineStool
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 JOINT HEALTH
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Musculoskeletal"
// //               title="Joint Health"
// //               description="Joints recorded as affected in the patient's clinical history."
// //             />


// //             <div className="pr-card">

// //               {Array.isArray(
// //                 bleedingHistory.jointsAffected
// //               ) &&
// //               bleedingHistory
// //                 .jointsAffected
// //                 .length > 0 ? (

// //                 <div className="pr-joint-grid">

// //                   {bleedingHistory
// //                     .jointsAffected
// //                     .map(
// //                       (joint, index) => (

// //                         <div
// //                           className="pr-joint"
// //                           key={index}
// //                         >
// //                           {joint}
// //                         </div>

// //                       )
// //                     )}

// //                 </div>

// //               ) : (

// //                 <EmptyState
// //                   text="No affected joints recorded."
// //                 />

// //               )}


// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Target Joint"
// //                   value={
// //                     bleedingHistory.targetJoint ||
// //                     hemophilia.targetJoint
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 TREATMENT
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Treatment"
// //               title="Treatment & Therapy"
// //               description="Current treatment information available in the patient's record."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Factor Therapy"
// //                   value={
// //                     treatment.currentFactorTherapy
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Other Medications"
// //                   value={
// //                     treatment.otherMedications
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Physiotherapy"
// //                   value={
// //                     formatBoolean(
// //                       treatment.underPhysiotherapy
// //                     )
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Mobility Limitation"
// //                   value={
// //                     treatment.mobilityLimitation
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Assistive Devices"
// //                   value={
// //                     treatment.assistiveDevices
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 ASSESSMENT GRAPH
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Assessment Analytics"
// //               title="Assessment Risk Trend"
// //               description="Every point represents one stored clinical assessment."
// //             />


// //             <div className="pr-card">

// //               {assessmentChartData.length > 0 ? (

// //                 <div className="pr-chart">

// //                   <ResponsiveContainer
// //                     width="100%"
// //                     height={320}
// //                   >

// //                     <LineChart
// //                       data={
// //                         assessmentChartData
// //                       }
// //                     >

// //                       <CartesianGrid
// //                         strokeDasharray="3 3"
// //                       />

// //                       <XAxis
// //                         dataKey="assessmentNumber"
// //                         tickFormatter={(v) =>
// //                           `A${v}`
// //                         }
// //                       />

// //                       <YAxis
// //                         allowDecimals={false}
// //                       />

// //                       <Tooltip
// //                         formatter={(
// //                           value,
// //                           name
// //                         ) => {

// //                           if (
// //                             name ===
// //                             "score"
// //                           ) {

// //                             return [
// //                               value,
// //                               "Score",
// //                             ];
// //                           }

// //                           return [
// //                             value,
// //                             name,
// //                           ];
// //                         }}
// //                       />

// //                       <Line
// //                         type="monotone"
// //                         dataKey="score"
// //                         stroke="#2C5CE0"
// //                         strokeWidth={3}
// //                         dot={{
// //                           r: 5,
// //                         }}
// //                         activeDot={{
// //                           r: 7,
// //                         }}
// //                       />

// //                     </LineChart>

// //                   </ResponsiveContainer>

// //                 </div>

// //               ) : (

// //                 <EmptyState
// //                   text="No assessment scores available."
// //                 />

// //               )}

// //             </div>


// //             {/* =================================================
// //                 ASSESSMENT REVIEW
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Assessment Review"
// //               title="Assessment History & Explanation"
// //               description="Select any assessment to see the exact answers, score, risk level and explanation stored for that assessment."
// //             />


// //             <div className="pr-card">

// //               {assessmentHistory.length > 0 ? (

// //                 <>

// //                   {/* =========================================
// //                       SELECT
// //                   ========================================= */}

// //                   <div className="assessment-selector">

// //                     <label htmlFor="assessmentSelect">
// //                       Select Assessment
// //                     </label>


// //                     <select
// //                       id="assessmentSelect"
// //                       value={
// //                         selectedAssessmentId
// //                       }
// //                       onChange={(e) =>
// //                         setSelectedAssessmentId(
// //                           e.target.value
// //                         )
// //                       }
// //                     >

// //                       {assessmentHistory.map(
// //                         (
// //                           assessment,
// //                           index
// //                         ) => (

// //                           <option
// //                             key={
// //                               assessment.id ||
// //                               assessment._id ||
// //                               index
// //                             }
// //                             value={String(
// //                               assessment.id ||
// //                               assessment._id ||
// //                               ""
// //                             )}
// //                           >

// //                             Assessment{" "}
// //                             {assessment.assessmentNumber ??
// //                               index + 1}

// //                             {" — Score "}
// //                             {assessment.score ?? 0}

// //                             {" — "}
// //                             {assessment.riskLevel ||
// //                               "Unknown"}

// //                             {" — "}
// //                             {formatDate(
// //                               assessment.date ||
// //                               assessment.createdAt
// //                             )}

// //                           </option>

// //                         )
// //                       )}

// //                     </select>

// //                   </div>


// //                   {/* =========================================
// //                       SELECTED ASSESSMENT
// //                   ========================================= */}

// //                   {selectedAssessment && (

// //                     <div className="selected-assessment">

// //                       {/* SCORE */}

// //                       <div className="selected-score-header">

// //                         <div>

// //                           <span>
// //                             Assessment{" "}
// //                             {selectedAssessment.assessmentNumber}
// //                           </span>


// //                           <h3>
// //                             Score{" "}
// //                             {value(
// //                               selectedAssessment.score
// //                             )}
// //                           </h3>


// //                           <p>
// //                             Recorded on{" "}
// //                             {formatDateTime(
// //                               selectedAssessment.date ||
// //                               selectedAssessment.createdAt
// //                             )}
// //                           </p>

// //                         </div>


// //                         <div className="selected-risk">

// //                           <span>
// //                             Risk Level
// //                           </span>

// //                           <StatusBadge
// //                             text={
// //                               selectedAssessment.riskLevel
// //                             }
// //                           />

// //                         </div>

// //                       </div>


// //                       {/* FLAGS */}

// //                       <div className="assessment-flags">

// //                         <div>

// //                           <span>
// //                             Emergency Symptoms
// //                           </span>

// //                           <strong>
// //                             {formatBoolean(
// //                               selectedAssessment.emergencyFlag
// //                             )}
// //                           </strong>

// //                         </div>


// //                         <div>

// //                           <span>
// //                             Strong Suspicion
// //                           </span>

// //                           <strong>
// //                             {formatBoolean(
// //                               selectedAssessment.strongSuspicionFlag
// //                             )}
// //                           </strong>

// //                         </div>

// //                       </div>


// //                       {/* SUMMARY */}

// //                       {selectedAssessment.summaryText && (

// //                         <div className="assessment-summary">

// //                           <div className="assessment-box-title">
// //                             Assessment Summary
// //                           </div>

// //                           <p>
// //                             {
// //                               selectedAssessment.summaryText
// //                             }
// //                           </p>

// //                         </div>

// //                       )}


// //                       {/* =======================================
// //                           EXPLANATION
// //                       ======================================= */}

// //                       <div className="assessment-explanation">

// //                         <div className="assessment-box-title">
// //                           Why this assessment produced this result
// //                         </div>


// //                         {selectedExplanation.length > 0 ? (

// //                           <div className="explanation-list">

// //                             {selectedExplanation.map(
// //                               (
// //                                 explanation,
// //                                 index
// //                               ) => (

// //                                 <div
// //                                   className="explanation-item"
// //                                   key={index}
// //                                 >

// //                                   <span>
// //                                     {index + 1}
// //                                   </span>

// //                                   <p>
// //                                     {explanation}
// //                                   </p>

// //                                 </div>

// //                               )
// //                             )}

// //                           </div>

// //                         ) : (

// //                           <EmptyState
// //                             text="No explanation was stored for this assessment."
// //                           />

// //                         )}

// //                       </div>


// //                       {/* =======================================
// //                           EXACT ANSWERS
// //                       ======================================= */}

// //                       <div className="assessment-answers">

// //                         <div className="assessment-box-title">
// //                           Recorded Responses
// //                         </div>


// //                         <p className="assessment-note">

// //                           These are the exact
// //                           questions and answers
// //                           stored for Assessment{" "}
// //                           {
// //                             selectedAssessment.assessmentNumber
// //                           }.

// //                         </p>


// //                         {selectedAnswers.length > 0 ? (

// //                           <div className="answer-grid">

// //                             {selectedAnswers.map(
// //                               (item) => (

// //                                 <div
// //                                   className="answer-item"
// //                                   key={item.id}
// //                                 >

// //                                   <span>
// //                                     {item.question}
// //                                   </span>

// //                                   <strong>
// //                                     {item.answer}
// //                                   </strong>

// //                                 </div>

// //                               )
// //                             )}

// //                           </div>

// //                         ) : (

// //                           <EmptyState
// //                             text="No recorded responses available for this assessment."
// //                           />

// //                         )}

// //                       </div>


// //                       {/* =======================================
// //                           DERIVED FACTORS
// //                       ======================================= */}

// //                       <div className="assessment-factors">
// //                         <br></br>
// //                         <br></br>
// //                         <div className="assessment-box-title">
// //                           Clinical Factors From This Assessment
// //                         </div>


// //                         <div className="pr-info-grid">

// //                           <InfoCard
// //                             label="Family History"
// //                             value={
// //                               selectedFactors.familyHistory
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Male Relative"
// //                             value={
// //                               formatBoolean(
// //                                 selectedFactors.maleRelativeFlag
// //                               )
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Minor Cut Bleeding"
// //                             value={
// //                               selectedFactors.bleedMinorCuts
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Dental / Surgery Bleeding"
// //                             value={
// //                               selectedFactors.dentalSurgeryBleeding
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Bruising"
// //                             value={
// //                               selectedFactors.bruises
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Muscle Swelling"
// //                             value={
// //                               selectedFactors.muscleSwelling
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Joint Swelling"
// //                             value={
// //                               selectedFactors.jointSwelling
// //                             }
// //                           />

                          

// //                           <InfoCard
// //                             label="Blood in Urine / Stool"
// //                             value={
// //                               selectedFactors.bloodUrineStool
// //                             }
// //                           />

// //                           <InfoCard
// //                             label="Heavy Menstrual Bleeding"
// //                             value={
// //                               selectedFactors.heavyMenstrual
// //                             }
// //                           />

                          

                          

// //                         </div>


// //                         {Array.isArray(
// //                           selectedFactors.jointsList
// //                         ) &&
// //                         selectedFactors
// //                           .jointsList
// //                           .length > 0 && (

// //                           <div className="pr-joint-grid">

// //                             {selectedFactors
// //                               .jointsList
// //                               .map(
// //                                 (
// //                                   joint,
// //                                   index
// //                                 ) => (

// //                                   <div
// //                                     className="pr-joint"
// //                                     key={index}
// //                                   >
// //                                     {joint}
// //                                   </div>

// //                                 )
// //                               )}

// //                           </div>

// //                         )}

// //                       </div>

// //                     </div>

// //                   )}

// //                 </>

// //               ) : (

// //                 <EmptyState
// //                   text="No assessment history available."
// //                 />

// //               )}

// //             </div>


// //             {/* =================================================
// //                 CARE TEAM
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Care Team"
// //               title="Clinical Care Information"
// //               description="Healthcare facility and care-team information associated with the patient."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="HTC Name"
// //                   value={
// //                     careTeam.htcName
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Hematologist"
// //                   value={
// //                     careTeam.hematologistName
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Hospital"
// //                   value={
// //                     careTeam.hospitalName
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Existing Patient Number"
// //                   value={
// //                     careTeam.existingPatientNumber
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 EMERGENCY CONTACT
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Emergency"
// //               title="Emergency Contact"
// //               description="Emergency contact information recorded for this patient."
// //             />


// //             <div className="pr-card">

// //               <div className="pr-info-grid">

// //                 <InfoCard
// //                   label="Name"
// //                   value={
// //                     emergencyContact.name
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Relationship"
// //                   value={
// //                     emergencyContact.relationship
// //                   }
// //                 />

// //                 <InfoCard
// //                   label="Phone"
// //                   value={
// //                     emergencyContact.phone
// //                   }
// //                 />

// //               </div>

// //             </div>


// //             {/* =================================================
// //                 TIMELINE
// //             ================================================= */}

// //             <SectionHeader
// //               eyebrow="Patient History"
// //               title="Clinical Timeline"
// //               description="Chronological record of important clinical events available in the system."
// //             />


// //             <div className="pr-card">

// //               {timeline.length > 0 ? (

// //                 <div className="pr-timeline">

// //                   {timeline.map(
// //                     (event, index) => (

// //                       <div
// //                         className="pr-timeline-item"
// //                         key={index}
// //                       >

// //                         <div className="pr-timeline-dot" />


// //                         <div className="pr-timeline-content">

// //                           <div className="pr-timeline-top">

// //                             <strong>
// //                               {value(
// //                                 event.title ||
// //                                 event.type
// //                               )}
// //                             </strong>

// //                             <span>
// //                               {formatDate(
// //                                 event.date ||
// //                                 event.createdAt
// //                               )}
// //                             </span>

// //                           </div>


// //                           <p>
// //                             {value(
// //                               event.description ||
// //                               event.details,
// //                               "No additional details available."
// //                             )}
// //                           </p>

// //                         </div>

// //                       </div>

// //                     )
// //                   )}

// //                 </div>

// //               ) : (

// //                 <EmptyState
// //                   text="No timeline events are currently available."
// //                 />

// //               )}

// //             </div>


// //             {/* =================================================
// //                 IMPORTANT DATA NOTE
// //             ================================================= */}

// //             <div className="pr-privacy">

// //               <div className="pr-privacy-title">
// //                 Authorized Clinical Access
// //               </div>

// //               <p>
// //                 Patient information displayed here
// //                 is retrieved from the authenticated
// //                 clinical system and is intended for
// //                 authorized healthcare professionals
// //                 only.
// //               </p>

// //             </div>

// //           </div>

// //         )}

// //       </main>


// //       {/* =====================================================
// //           CSS
// //       ===================================================== */}

// //       <style>{`

// //         * {
// //           box-sizing: border-box;
// //         }

// //         .pr-root {
// //           --color-bg: #F5F8FC;
// //           --color-surface: #FFFFFF;
// //           --color-primary: #2C5CE0;
// //           --color-primary-dark: #163B85;
// //           --color-primary-soft: #EAF0FE;
// //           --color-accent: #0BA5A0;
// //           --color-border: #DCE6F2;
// //           --color-text: #10233F;
// //           --color-text-secondary: #5B7291;
// //           --color-text-faint: #93A6C2;

// //           min-height: 100vh;

// //           background:
// //             var(--color-bg);

// //           color:
// //             var(--color-text);

// //           font-family:
// //             'Inter',
// //             -apple-system,
// //             BlinkMacSystemFont,
// //             'Segoe UI',
// //             sans-serif;
// //         }

// //         .pr-root * {
// //           box-sizing: border-box;
// //         }

// //         /* =========================
// //            NAVBAR
// //         ========================= */

// //         .pr-navbar {
// //           position: sticky;
// //           top: 0;
// //           z-index: 100;

// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;

// //           padding: 14px 28px;

// //           background:
// //             var(--color-surface);

// //           border-bottom:
// //             1px solid var(--color-border);
// //         }

// //         .pr-navbar-left {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }

// //         .pr-logo-mark {
// //           width: 34px;
// //           height: 34px;

// //           border-radius: 9px;

// //           background:
// //             linear-gradient(
// //               145deg,
// //               #2C5CE0,
// //               #163B85
// //             );

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           color: white;
// //         }

// //         .pr-logo-mark svg {
// //           width: 18px;
// //           height: 18px;
// //         }

// //         .pr-app-name {
// //           font-family:
// //             'Manrope',
// //             'Inter',
// //             sans-serif;

// //           font-weight: 700;
// //           font-size: 16px;

// //           color:
// //             var(--color-text);
// //         }

// //         .pr-navbar-right {
// //           display: flex;
// //           align-items: center;
// //           gap: 14px;
// //         }

// //         .pr-dashboard-btn,
// //         .pr-logout-btn {
// //           display: flex;
// //           align-items: center;
// //           gap: 6px;

// //           padding: 8px 12px;

// //           border-radius: 9px;

// //           border:
// //             1px solid var(--color-border);

// //           background:
// //             var(--color-surface);

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 12.5px;
// //           font-weight: 600;

// //           cursor: pointer;

// //           transition:
// //             all 0.15s ease;
// //         }

// //         .pr-dashboard-btn:hover,
// //         .pr-logout-btn:hover {
// //           border-color:
// //             var(--color-primary);

// //           color:
// //             var(--color-primary-dark);

// //           background:
// //             var(--color-primary-soft);
// //         }

// //         .pr-dashboard-btn svg {
// //           width: 15px;
// //           height: 15px;
// //         }

// //         .pr-doctor-block {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }

// //         .pr-avatar {
// //           width: 34px;
// //           height: 34px;

// //           border-radius: 50%;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary-dark);

// //           display: flex;
// //           align-items: center;
// //           justify-content: center;

// //           font-size: 12px;
// //           font-weight: 700;

// //           border:
// //             1px solid var(--color-border);
// //         }

// //         .pr-doctor-name {
// //           font-size: 13.5px;
// //           font-weight: 600;
// //         }

// //         .pr-doctor-role {
// //           font-size: 11.5px;
// //           color:
// //             var(--color-text-secondary);
// //         }

// //         /* =========================
// //            MAIN
// //         ========================= */

// //         .pr-main {
// //           max-width: 1240px;

// //           margin: 0 auto;

// //           padding:
// //             32px 28px 64px;
// //         }

// //         /* =========================
// //            HEADER
// //         ========================= */

// //         .pr-page-header {
// //           margin-bottom: 24px;
// //         }

// //         .pr-title {
// //           font-family:
// //             'Manrope',
// //             'Inter',
// //             sans-serif;

// //           font-size: 28px;

// //           font-weight: 800;

// //           letter-spacing: -0.02em;

// //           margin:
// //             0 0 6px;
// //         }

// //         .pr-subtitle {
// //           margin: 0;

// //           font-size: 14.5px;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         /* =========================
// //            SEARCH
// //         ========================= */

// //         .pr-search-card {
// //           background:
// //             var(--color-surface);

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 16px;

// //           padding: 22px;

// //           margin-bottom: 32px;

// //           box-shadow:
// //             0 1px 2px rgba(16,35,63,0.04),
// //             0 6px 20px rgba(16,35,63,0.05);
// //         }

// //         .pr-search-eyebrow {
// //           display: block;

// //           font-size: 10.5px;

// //           font-weight: 700;

// //           letter-spacing:
// //             0.08em;

// //           text-transform:
// //             uppercase;

// //           color:
// //             var(--color-primary);

// //           margin-bottom: 5px;
// //         }

// //         .pr-search-heading h2 {
// //           font-size: 17px;

// //           margin:
// //             0 0 4px;

// //           font-weight: 700;
// //         }

// //         .pr-search-heading p {
// //           margin: 0;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 12.5px;
// //         }

// //         .pr-search-heading {
// //           margin-bottom: 18px;
// //         }

// //         .pr-search-form {
// //           display: flex;

// //           align-items: flex-end;

// //           gap: 12px;
// //         }

// //         .pr-input-wrapper {
// //           flex: 1;
// //         }

// //         .pr-input-wrapper label {
// //           display: block;

// //           font-size: 12px;

// //           font-weight: 600;

// //           color:
// //             var(--color-text-secondary);

// //           margin-bottom: 7px;
// //         }

// //         .pr-input-wrapper input {
// //           width: 100%;

// //           padding:
// //             12px 14px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 9px;

// //           outline: none;

// //           font-size: 13px;

// //           color:
// //             var(--color-text);
// //         }

// //         .pr-input-wrapper input:focus {
// //           border-color:
// //             var(--color-primary);

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(44,92,224,0.08);
// //         }

// //         .pr-search-btn {
// //           padding:
// //             12px 20px;

// //           border: none;

// //           border-radius: 9px;

// //           background:
// //             var(--color-primary);

// //           color: white;

// //           font-size: 13px;

// //           font-weight: 700;

// //           cursor: pointer;
// //         }

// //         .pr-search-btn:hover {
// //           background:
// //             var(--color-primary-dark);
// //         }

// //         .pr-search-btn:disabled {
// //           opacity: 0.65;

// //           cursor:
// //             not-allowed;
// //         }

// //         .pr-error {
// //           margin-top: 14px;

// //           padding: 10px 12px;

// //           border-radius: 8px;

// //           background: #FFF1F1;

// //           border:
// //             1px solid #FFD2D2;

// //           color: #B42318;

// //           font-size: 12.5px;
// //         }

// //         /* =========================
// //            INITIAL
// //         ========================= */

// //         .pr-initial-state {
// //           padding: 70px 20px;

// //           text-align: center;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .pr-initial-icon {
// //           width: 60px;
// //           height: 60px;

// //           margin:
// //             0 auto 18px;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 16px;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary);
// //         }

// //         .pr-initial-icon svg {
// //           width: 32px;
// //           height: 32px;
// //         }

// //         .pr-initial-state h3 {
// //           margin:
// //             0 0 6px;

// //           color:
// //             var(--color-text);
// //         }

// //         .pr-initial-state p {
// //           margin: 0;

// //           font-size: 13px;
// //         }

// //         /* =========================
// //            PATIENT HEADER
// //         ========================= */

// //         .pr-patient-header {
// //           display: flex;

// //           justify-content: space-between;

// //           align-items: center;

// //           gap: 20px;

// //           padding: 22px;

// //           background:
// //             white;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 16px;

// //           margin-bottom: 35px;
// //         }

// //         .pr-patient-identity {
// //           display: flex;

// //           align-items: center;

// //           gap: 14px;
// //         }

// //         .pr-patient-avatar {
// //           width: 52px;
// //           height: 52px;

// //           border-radius: 14px;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary-dark);

// //           display: flex;

// //           align-items: center;

// //           justify-content: center;

// //           font-size: 16px;

// //           font-weight: 800;
// //         }

// //         .pr-record-label {
// //           display: block;

// //           color:
// //             var(--color-primary);

// //           text-transform:
// //             uppercase;

// //           letter-spacing:
// //             0.08em;

// //           font-size: 10px;

// //           font-weight: 700;

// //           margin-bottom: 3px;
// //         }

// //         .pr-patient-identity h2 {
// //           margin:
// //             0 0 4px;

// //           font-size: 21px;
// //         }

// //         .pr-patient-identity p {
// //           margin: 0;

// //           font-size: 12px;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .pr-patient-meta {
// //           text-align: right;
// //         }

// //         .pr-patient-meta span {
// //           display: block;

// //           font-size: 11px;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .pr-active {
// //           color: #138A5B;
// //           font-size: 13px;
// //         }

// //         /* =========================
// //            SECTION HEADERS
// //         ========================= */

// //         .pr-section-header {
// //           margin:
// //             36px 0 14px;
// //         }

// //         .pr-section-header-top {
// //           display: flex;

// //           align-items: center;

// //           gap: 10px;
// //         }

// //         .pr-section-eyebrow {
// //           font-size: 10px;

// //           font-weight: 800;

// //           text-transform:
// //             uppercase;

// //           letter-spacing:
// //             0.08em;

// //           color:
// //             var(--color-primary);
// //         }

// //         .pr-pulse-line {
// //           width: 70px;
// //           height: 18px;

// //           color:
// //             var(--color-primary);
// //         }

// //         .pr-section-title {
// //           margin:
// //             4px 0 4px;

// //           font-size: 19px;

// //           font-weight: 750;
// //         }

// //         .pr-section-description {
// //           margin: 0;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 12.5px;

// //           line-height: 1.5;
// //         }

// //         /* =========================
// //            CARDS
// //         ========================= */

// //         .pr-card {
// //           background:
// //             var(--color-surface);
// //             margin-top : 20px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 16px;

// //           padding: 22px;

// //           box-shadow:
// //             0 1px 2px rgba(16,35,63,0.04),
// //             0 6px 20px rgba(16,35,63,0.05);
// //         }

// //         .pr-info-grid {
// //           display: grid;
          

// //           grid-template-columns:
// //             repeat(4, minmax(0, 1fr));

// //           gap: 18px;
// //         }

// //         .pr-info-grid-single {
// //           margin-top: 20px;

// //           grid-template-columns:
// //             repeat(3, minmax(0, 1fr));
// //         }

// //         .pr-info-item {
// //           min-width: 0;
// //         }

// //         .pr-info-label {
// //           display: block;

// //           margin-bottom: 5px;

// //           font-size: 10.5px;

// //           text-transform:
// //             uppercase;

// //           letter-spacing:
// //             0.06em;

// //           font-weight: 700;

// //           color:
// //             var(--color-text-faint);
// //         }

// //         .pr-info-value {
// //           display: block;

// //           font-size: 13px;

// //           font-weight: 600;

// //           color:
// //             var(--color-text);

// //           word-break:
// //             break-word;
// //         }

// //         /* =========================
// //            STATS
// //         ========================= */

// //         .pr-stat-grid {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(4, 1fr);

// //           gap: 14px;
// //         }

// //         .pr-stat-card {
// //           background:
// //             white;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 14px;

// //           padding: 18px;
// //         }

// //         .pr-stat-card span {
// //           display: block;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 11px;

// //           margin-bottom: 7px;
// //         }

// //         .pr-stat-card strong {
// //           font-size: 18px;

// //           font-weight: 800;
// //         }

// //         /* =========================
// //            STATUS
// //         ========================= */

// //         .pr-status {
// //           display: inline-flex;

// //           padding:
// //             5px 9px;

// //           border-radius: 999px;

// //           font-size: 11px;

// //           font-weight: 700;

// //           background: #EEF2F7;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .pr-status-safe {
// //           background: #E8F7F0;
// //           color: #147A52;
// //         }

// //         .pr-status-warning {
// //           background: #FFF4D9;
// //           color: #9A6700;
// //         }

// //         .pr-status-danger {
// //           background: #FFE8E8;
// //           color: #B42318;
// //         }

// //         /* =========================
// //            JOINTS
// //         ========================= */

// //         .pr-joint-grid {
// //           display: flex;

// //           flex-wrap: wrap;

// //           gap: 10px;
// //         }

// //         .pr-joint {
// //           padding:
// //             9px 13px;

// //           border-radius: 9px;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary-dark);

// //           font-size: 12px;

// //           font-weight: 700;
// //         }

// //         /* =========================
// //            EMPTY
// //         ========================= */

// //         .pr-empty {
// //           padding: 30px;

// //           text-align: center;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .pr-empty-line {
// //           width: 42px;

// //           height: 3px;

// //           margin:
// //             0 auto 12px;

// //           border-radius: 3px;

// //           background:
// //             var(--color-border);
// //         }

// //         .pr-empty p {
// //           margin: 0;

// //           font-size: 12.5px;
// //         }

// //         /* =========================
// //            LINE CHART
// //         ========================= */

// //         .chart-explanation {
// //           display: flex;

// //           align-items: center;

// //           justify-content: space-between;

// //           gap: 20px;

// //           margin-bottom: 15px;
// //         }

// //         .chart-explanation strong {
// //           font-size: 14px;
// //         }

// //         .chart-explanation p {
// //           margin:
// //             4px 0 0;

// //           font-size: 12px;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .chart-count {
// //           padding:
// //             7px 10px;

// //           border-radius: 8px;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary-dark);

// //           font-size: 11px;

// //           font-weight: 700;

// //           white-space: nowrap;
// //         }

// //         .pr-chart {
// //           width: 100%;

// //           min-height: 320px;
// //         }

// //         .chart-tooltip {
// //           background:
// //             white;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 10px;

// //           padding: 10px 12px;

// //           box-shadow:
// //             0 8px 24px
// //             rgba(16,35,63,0.12);

// //           font-size: 11px;
// //         }

// //         .chart-tooltip strong {
// //           display: block;

// //           margin-bottom: 6px;

// //           font-size: 12px;
// //         }

// //         .chart-tooltip div {
// //           margin-top: 3px;
// //         }

// //         /* =========================
// //            ASSESSMENT SELECTOR
// //         ========================= */

// //         .assessment-selector {
// //           display: flex;

// //           align-items: flex-end;

// //           gap: 15px;

// //           margin-bottom: 24px;
// //         }

// //         .assessment-selector label {
// //           display: block;

// //           min-width: 180px;

// //           font-size: 11px;

// //           font-weight: 700;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .assessment-selector select {
// //           flex: 1;

// //           padding:
// //             12px 14px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 9px;

// //           background: white;

// //           color:
// //             var(--color-text);

// //           font-size: 13px;

// //           font-weight: 600;

// //           outline: none;

// //           cursor: pointer;
// //         }

// //         .assessment-selector select:focus {
// //           border-color:
// //             var(--color-primary);

// //           box-shadow:
// //             0 0 0 3px
// //             rgba(44,92,224,0.08);
// //         }

// //         /* =========================
// //            SELECTED ASSESSMENT
// //         ========================= */

// //         .selected-assessment {
// //           border-top:
// //             1px solid var(--color-border);

// //           padding-top: 22px;
// //         }

// //         .selected-score-header {
// //           display: flex;

// //           justify-content: space-between;

// //           align-items: center;

// //           gap: 20px;

// //           padding: 18px;

// //           border-radius: 12px;

// //           background:
// //             var(--color-primary-soft);
// //         }

// //         .selected-score-header span,
// //         .selected-risk span {
// //           display: block;

// //           font-size: 10.5px;

// //           text-transform:
// //             uppercase;

// //           letter-spacing:
// //             0.06em;

// //           color:
// //             var(--color-text-secondary);

// //           font-weight: 700;

// //           margin-bottom: 5px;
// //         }

// //         .selected-score-header h3 {
// //           margin:
// //             0 0 4px;

// //           font-size: 28px;

// //           color:
// //             var(--color-primary-dark);
// //         }

// //         .selected-score-header p {
// //           margin: 0;

// //           font-size: 11.5px;

// //           color:
// //             var(--color-text-secondary);
// //         }

// //         .selected-risk {
// //           text-align: right;
// //         }

// //         .assessment-flags {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(2, 1fr);

// //           gap: 12px;

// //           margin:
// //             16px 0;
// //         }

// //         .assessment-flags > div {
// //           padding: 13px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 10px;

// //           background: white;
// //         }

// //         .assessment-flags span {
// //           display: block;

// //           font-size: 10.5px;

// //           color:
// //             var(--color-text-secondary);

// //           margin-bottom: 5px;
// //         }

// //         .assessment-flags strong {
// //           font-size: 13px;
// //         }

// //         .assessment-explanation,
// //         .assessment-answers {
// //           margin-top: 20px;

// //           padding-top: 20px;

// //           border-top:
// //             1px solid var(--color-border);
// //         }

// //         .assessment-box-title {
// //           font-size: 14px;

// //           font-weight: 800;

// //           margin-bottom: 5px;
// //         }

// //         .assessment-note {
// //           margin:
// //             0 0 15px;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 12px;

// //           line-height: 1.55;
// //         }

// //         .explanation-list {
// //           display: grid;

// //           gap: 9px;
// //         }

// //         .explanation-item {
// //           display: flex;

// //           align-items: flex-start;

// //           gap: 10px;

// //           padding: 11px 12px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 9px;

// //           background:
// //             #FAFCFF;
// //         }

// //         .explanation-item > span {
// //           width: 22px;
// //           height: 22px;

// //           flex: 0 0 22px;

// //           display: flex;

// //           align-items: center;
// //           justify-content: center;

// //           border-radius: 50%;

// //           background:
// //             var(--color-primary-soft);

// //           color:
// //             var(--color-primary-dark);

// //           font-size: 10px;

// //           font-weight: 800;
// //         }

// //         .explanation-item p {
// //           margin: 2px 0 0;

// //           font-size: 12.5px;

// //           line-height: 1.45;
// //         }

// //         .answer-grid {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(2, minmax(0, 1fr));

// //           gap: 10px;
// //         }

// //         .answer-item {
// //           padding: 13px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 10px;

// //           background:
// //             #FAFCFF;
// //         }

// //         .answer-item span {
// //           display: block;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 11px;

// //           line-height: 1.4;

// //           margin-bottom: 6px;
// //         }

// //         .answer-item strong {
// //           display: block;

// //           font-size: 13px;

// //           color:
// //             var(--color-text);
// //         }

// //         /* =========================
// //            TIMELINE
// //         ========================= */

// //         .pr-timeline {
// //           position: relative;

// //           padding-left: 24px;
// //         }

// //         .pr-timeline::before {
// //           content: "";

// //           position: absolute;

// //           left: 5px;

// //           top: 5px;

// //           bottom: 5px;

// //           width: 1px;

// //           background:
// //             var(--color-border);
// //         }

// //         .pr-timeline-item {
// //           position: relative;

// //           padding:
// //             0 0 22px 20px;
// //         }

// //         .pr-timeline-dot {
// //           position: absolute;

// //           left: -24px;

// //           top: 4px;

// //           width: 11px;
// //           height: 11px;

// //           border-radius: 50%;

// //           background:
// //             var(--color-primary);

// //           border:
// //             2px solid white;

// //           box-shadow:
// //             0 0 0 1px
// //             var(--color-border);
// //         }

// //         .pr-timeline-top {
// //           display: flex;

// //           justify-content: space-between;

// //           gap: 15px;

// //           margin-bottom: 5px;
// //         }

// //         .pr-timeline-top strong {
// //           font-size: 13px;
// //         }

// //         .pr-timeline-top span {
// //           font-size: 10.5px;

// //           color:
// //             var(--color-text-secondary);

// //           white-space: nowrap;
// //         }

// //         .pr-timeline-content p {
// //           margin: 0;

// //           font-size: 12px;

// //           color:
// //             var(--color-text-secondary);

// //           line-height: 1.5;
// //         }

// //         /* =========================
// //            RELIABILITY
// //         ========================= */

// //         .reliability-note {
// //           margin-top: 20px;

// //           padding: 12px 14px;

// //           border-radius: 9px;

// //           background:
// //             #F7F9FC;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 11.5px;

// //           line-height: 1.5;
// //         }

// //         /* =========================
// //            NOTES
// //         ========================= */

// //         .pr-notes {
// //           display: grid;

// //           grid-template-columns:
// //             repeat(2, 1fr);

// //           gap: 14px;
// //         }

// //         .pr-note {
// //           padding: 15px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 10px;

// //           background:
// //             #FAFCFF;
// //         }

// //         .pr-note span {
// //           display: block;

// //           font-size: 10.5px;

// //           text-transform:
// //             uppercase;

// //           letter-spacing:
// //             0.06em;

// //           font-weight: 700;

// //           color:
// //             var(--color-text-faint);

// //           margin-bottom: 6px;
// //         }

// //         .pr-note p {
// //           margin: 0;

// //           font-size: 13px;

// //           font-weight: 600;
// //         }

// //         /* =========================
// //            PRIVACY
// //         ========================= */

// //         .pr-privacy {
// //           margin-top: 28px;

// //           padding: 16px 18px;

// //           border:
// //             1px solid var(--color-border);

// //           border-radius: 12px;

// //           background:
// //             white;
// //         }

// //         .pr-privacy-title {
// //           font-size: 12px;

// //           font-weight: 800;

// //           margin-bottom: 5px;
// //         }

// //         .pr-privacy p {
// //           margin: 0;

// //           color:
// //             var(--color-text-secondary);

// //           font-size: 11.5px;

// //           line-height: 1.5;
// //         }

// //         /* =========================
// //            RESPONSIVE
// //         ========================= */

// //         @media (max-width: 900px) {

// //           .pr-navbar {
// //             padding:
// //               12px 16px;
// //           }

// //           .pr-doctor-block {
// //             display: none;
// //           }

// //           .pr-main {
// //             padding:
// //               24px 16px 50px;
// //           }

// //           .pr-search-form {
// //             flex-direction: column;

// //             align-items: stretch;
// //           }

// //           .pr-stat-grid {
// //             grid-template-columns:
// //               repeat(2, 1fr);
// //           }

// //           .pr-info-grid {
// //             grid-template-columns:
// //               repeat(2, 1fr);
// //           }

// //           .pr-info-grid-single {
// //             grid-template-columns:
// //               1fr;
// //           }

// //           .pr-patient-header {
// //             flex-direction: column;

// //             align-items: flex-start;
// //           }

// //           .pr-patient-meta {
// //             text-align: left;
// //           }

// //           .assessment-selector {
// //             flex-direction: column;

// //             align-items: stretch;
// //           }

// //           .answer-grid {
// //             grid-template-columns: 1fr;
// //           }

// //           .pr-notes {
// //             grid-template-columns: 1fr;
// //           }

// //         }

// //         @media (max-width: 600px) {

// //           .pr-dashboard-btn {
// //             font-size: 0;
// //           }

// //           .pr-dashboard-btn svg {
// //             width: 17px;
// //             height: 17px;
// //           }

// //           .pr-app-name {
// //             font-size: 14px;
// //           }

// //           .pr-stat-grid,
// //           .pr-info-grid {
// //             grid-template-columns: 1fr;
// //           }

// //           .selected-score-header {
// //             flex-direction: column;

// //             align-items: flex-start;
// //           }

// //           .selected-risk {
// //             text-align: left;
// //           }

// //           .assessment-flags {
// //             grid-template-columns: 1fr;
// //           }

// //           .pr-timeline-top {
// //             flex-direction: column;

// //             gap: 3px;
// //           }
// //             .patient-record-header {
// //                 display: flex;
// //                 align-items: center;
// //                 justify-content: space-between;
// //                 gap: 20px;
// //                 margin-bottom: 24px;
// //                 }
                
// //                 }

// //                 /* =========================
// //    DOWNLOAD PDF BUTTON
// // ========================= */

// // .pdf-btn {
// //     display: inline-flex;
// //     align-items: center;
// //     justify-content: center;

// //     margin-top: 14px;
// //     padding: 11px 20px;

// //     border: none;
// //     border-radius: 9px;

// //     background: #2C5CE0;
// //     color: #ffffff;

// //     font-family: 'Inter', -apple-system, BlinkMacSystemFont,
// //         'Segoe UI', sans-serif;

// //     font-size: 13px;
// //     font-weight: 700;

// //     cursor: pointer;

// //     transition:
// //         background 0.2s ease,
// //         transform 0.2s ease,
// //         box-shadow 0.2s ease;

// //     box-shadow:
// //         0 4px 10px rgba(44, 92, 224, 0.18);
// // }

// // .pdf-btn:hover {
// //     background: #163B85;

// //     transform: translateY(-1px);

// //     box-shadow:
// //         0 7px 16px rgba(44, 92, 224, 0.25);
// // }

// // .pdf-btn:active {
// //     transform: translateY(0);
// // }

// // .pdf-btn:disabled {
// //     opacity: 0.6;
// //     cursor: not-allowed;
// //     transform: none;
// //     box-shadow: none;
// // }

// //         }

// //       `}</style>

// //     </div>
// //   );
// // }



// import React, { useEffect, useMemo, useState } from "react";

// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// import { useNavigate, useSearchParams } from "react-router-dom";
// import api from "../apiClient";


// export default function PatientResearch() {

//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();


//   // =========================================================
//   // STATE
//   // =========================================================

//   const [patientId, setPatientId] = useState("");

//   const [patient, setPatient] = useState(null);

//   const [loading, setLoading] = useState(false);

//   const [error, setError] = useState("");

//   const [selectedAssessmentId, setSelectedAssessmentId] =
//     useState("");


//   // =========================================================
//   // DOCTOR
//   // =========================================================

//   const staffUser = JSON.parse(
//     localStorage.getItem("staffUser") || "{}"
//   );

//   const doctorName =
//     staffUser?.fullName || "Clinician";

//   const roleName = staffUser?.role || "Clinician";


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


//   // =========================================================
//   // LOGOUT
//   // =========================================================

//   const handleLogout = () => {

//     localStorage.removeItem("staffAuthToken");
//     localStorage.removeItem("staffUser");
//     localStorage.removeItem("professionalId");

//     delete api.defaults.headers.common.Authorization;

//     navigate("/doctor-login");
//   };


//   // =========================================================
//   // SEARCH PATIENT
//   // =========================================================

//   const searchPatient = async (e, explicitPatientId = "") => {

//     e?.preventDefault();

//     const cleanPatientId =
//       String(explicitPatientId || patientId).trim().toUpperCase();


//     if (!cleanPatientId) {

//       setError(
//         "Please enter a Patient ID."
//       );

//       return;
//     }


//     setLoading(true);
//     setError("");
//     setPatient(null);
//     setSelectedAssessmentId("");


//     try {

//       console.log(
//         "================================="
//       );

//       console.log(
//         "PATIENT RESEARCH"
//       );

//       console.log(
//         "Searching:",
//         cleanPatientId
//       );

//       console.log(
//         "================================="
//       );


//       const response =
//         await api.get(
//           `/doctor/patient-research/${cleanPatientId}`
//         );


//       console.log(
//         "Patient Research Response:",
//         response.data
//       );


//       if (!response.data?.success) {

//         throw new Error(
//           response.data?.message ||
//           "Unable to retrieve patient."
//         );
//       }


//       setPatient(
//         response.data
//       );


//       // =====================================================
//       // AUTOMATICALLY SELECT LATEST ASSESSMENT
//       // =====================================================

//       const history =
//         Array.isArray(
//           response.data.assessmentHistory
//         )
//           ? response.data.assessmentHistory
//           : [];


//       if (history.length > 0) {

//         const latest =
//           history[
//             history.length - 1
//           ];


//         setSelectedAssessmentId(
//           String(
//             latest.id ||
//             latest._id ||
//             ""
//           )
//         );
//       }

//     } catch (err) {

//       console.error(
//         "Patient research error:",
//         err
//       );


//       setError(
//         err.response?.data?.message ||
//         err.message ||
//         "Unable to find patient record."
//       );

//     } finally {

//       setLoading(false);
//     }
//   };

//   // =========================================================
//   // OPEN DIRECTLY FROM DOCTOR DASHBOARD
//   // /doctor/patient-research?patientId=PAT123
//   // =========================================================
//   useEffect(() => {
//     const requestedPatientId =
//       searchParams.get("patientId");

//     if (!requestedPatientId) return;

//     const cleanRequestedId =
//       requestedPatientId.trim().toUpperCase();

//     setPatientId(cleanRequestedId);

//     searchPatient(undefined, cleanRequestedId);
//     // The URL is the trigger; searchPatient is intentionally called once.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [searchParams]);


//   // =========================================================
// // DOWNLOAD PATIENT PDF
// // =========================================================

// const downloadPatientPDF = async () => {
//   const cleanPatientId =
//     patientId.trim().toUpperCase();

//   if (!cleanPatientId) {
//     setError(
//       "Search for a patient before downloading the record."
//     );
//     return;
//   }

//   try {
//     setLoading(true);
//     setError("");

//     const response = await api.get(
//       `/doctor/patient-research/${cleanPatientId}/pdf`,
//       {
//         responseType: "blob",
//       }
//     );

//     const blob = new Blob(
//       [response.data],
//       {
//         type: "application/pdf",
//       }
//     );

//     const url =
//       window.URL.createObjectURL(blob);

//     const link =
//       document.createElement("a");

//     link.href = url;

//     link.download =
//       `Patient_Record_${cleanPatientId}.pdf`;

//     document.body.appendChild(link);

//     link.click();

//     link.remove();

//     window.URL.revokeObjectURL(url);

//   } catch (err) {
//     console.error(
//       "Patient PDF download error:",
//       err
//     );

//     setError(
//       "Unable to download the patient record."
//     );
//   } finally {
//     setLoading(false);
//   }
// };


//   // =========================================================
//   // HELPERS
//   // =========================================================

//   const value = (
//     v,
//     fallback = "Not available"
//   ) => {

//     if (
//       v === null ||
//       v === undefined ||
//       v === ""
//     ) {
//       return fallback;
//     }

//     return v;
//   };


//   const formatDate = (date) => {

//     if (!date) {
//       return "Not available";
//     }


//     const d =
//       new Date(date);


//     if (
//       Number.isNaN(
//         d.getTime()
//       )
//     ) {
//       return "Not available";
//     }


//     return d.toLocaleDateString(
//       "en-IN",
//       {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }
//     );
//   };


//   const formatDateTime = (date) => {

//     if (!date) {
//       return "Not available";
//     }


//     const d =
//       new Date(date);


//     if (
//       Number.isNaN(
//         d.getTime()
//       )
//     ) {
//       return "Not available";
//     }


//     return d.toLocaleString(
//       "en-IN",
//       {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       }
//     );
//   };


//   const formatBoolean = (v) => {

//     if (v === true) {
//       return "Yes";
//     }

//     if (v === false) {
//       return "No";
//     }

//     return "Not available";
//   };


//   const formatAnswer = (answer) => {

//     if (Array.isArray(answer)) {

//       return answer.length
//         ? answer.join(", ")
//         : "Not answered";
//     }


//     if (
//       typeof answer === "boolean"
//     ) {

//       return answer
//         ? "Yes"
//         : "No";
//     }


//     if (
//       answer === null ||
//       answer === undefined ||
//       answer === ""
//     ) {

//       return "Not answered";
//     }


//     return String(answer);
//   };


//   // =========================================================
//   // RESPONSE DATA
//   // =========================================================

//   const data =
//     patient || {};


//   const profile =
//     data.patient || {};


//   const hemophilia =
//     data.hemophilia || {};


//   const contact =
//     data.contact || {};


//   const emergencyContact =
//     data.emergencyContact || {};


//   const careTeam =
//     data.careTeam || {};


//   const familyGeneticHistory =
//     data.familyGeneticHistory || {};


//   const bleedingHistory =
//     data.bleedingHistory || {};


//   const treatment =
//     data.treatment || {};


//   const statistics =
//     data.statistics || {};


//   const timeline =
//     Array.isArray(data.timeline)
//       ? data.timeline
//       : [];

//   const exerciseRecommendations =
//     Array.isArray(data.exerciseRecommendations)
//       ? data.exerciseRecommendations
//       : [];

//   const activeExercises =
//     exerciseRecommendations.filter(
//       (item) => item.status === "ACTIVE"
//     );

//   const pendingExercises =
//     exerciseRecommendations.filter(
//       (item) => item.status === "PENDING_DOCTOR_REVIEW"
//     );


//   // =========================================================
//   // ASSESSMENT HISTORY
//   // =========================================================

//   const assessmentHistory =
//     Array.isArray(
//       data.assessmentHistory
//     )
//       ? data.assessmentHistory
//       : [];


//   // =========================================================
//   // ASSESSMENT GRAPH
//   // =========================================================

//   const assessmentChartData =
//     useMemo(() => {

//       return assessmentHistory.map(
//         (assessment, index) => ({

//           assessmentNumber:
//             assessment.assessmentNumber ??
//             index + 1,

//           assessmentId:
//             assessment.id ||
//             assessment._id ||
//             index,

//           score:
//             Number(
//               assessment.score ??
//               0
//             ),

//           riskLevel:
//             assessment.riskLevel ||
//             "Unknown",

//           date:
//             assessment.date ||
//             assessment.createdAt,

//           displayDate:
//             formatDate(
//               assessment.date ||
//               assessment.createdAt
//             ),
//         })
//       );

//     }, [assessmentHistory]);


//   // =========================================================
//   // SELECTED ASSESSMENT
//   // =========================================================

//   const selectedAssessment =
//     useMemo(() => {

//       if (
//         assessmentHistory.length === 0
//       ) {
//         return null;
//       }


//       if (!selectedAssessmentId) {

//         return (
//           assessmentHistory[
//             assessmentHistory.length - 1
//           ]
//         );
//       }


//       return (
//         assessmentHistory.find(
//           (assessment) =>
//             String(
//               assessment.id ||
//               assessment._id
//             ) ===
//             String(
//               selectedAssessmentId
//             )
//         ) ||
//         assessmentHistory[
//           assessmentHistory.length - 1
//         ]
//       );

//     }, [
//       assessmentHistory,
//       selectedAssessmentId,
//     ]);


//   // =========================================================
//   // SELECTED ASSESSMENT ANSWERS
//   // =========================================================
//   //
//   // IMPORTANT:
//   //
//   // We ONLY display the answers stored inside
//   // this particular Assessment.
//   //
//   // We DO NOT calculate a new score.
//   //
//   // =========================================================

//   const selectedAnswers =
//     useMemo(() => {

//       if (!selectedAssessment) {
//         return [];
//       }


//       if (
//         Array.isArray(
//           selectedAssessment.answers
//         )
//       ) {

//         return selectedAssessment.answers
//           .filter(
//             (item) =>
//               item &&
//               item.question
//           )
//           .map(
//             (item, index) => ({

//               id:
//                 index,

//               question:
//                 item.question,

//               answer:
//                 formatAnswer(
//                   item.answer
//                 ),
//             })
//           );
//       }


//       return [];

//     }, [selectedAssessment]);


//   // =========================================================
//   // SELECTED ASSESSMENT EXPLANATION
//   // =========================================================

//   const selectedExplanation =
//     useMemo(() => {

//       if (!selectedAssessment) {
//         return [];
//       }


//       if (
//         Array.isArray(
//           selectedAssessment.explanation
//         )
//       ) {

//         return selectedAssessment
//           .explanation
//           .filter(Boolean);
//       }


//       if (
//         selectedAssessment.summaryText
//       ) {

//         return String(
//           selectedAssessment.summaryText
//         )
//           .split("\n")
//           .map(
//             (x) => x.trim()
//           )
//           .filter(Boolean);
//       }


//       return [];

//     }, [selectedAssessment]);


//   // =========================================================
//   // SELECTED ASSESSMENT FACTORS
//   // =========================================================

//   const selectedFactors =
//     selectedAssessment?.factors || {};


//   // =========================================================
//   // STATUS BADGE
//   // =========================================================

//   const StatusBadge = ({
//     text,
//   }) => {

//     const normalized =
//       String(
//         text || ""
//       ).toLowerCase();


//     let className =
//       "pr-status";


//     if (
//       normalized.includes(
//         "emergency"
//       ) ||
//       normalized.includes(
//         "high"
//       )
//     ) {

//       className +=
//         " pr-status-danger";

//     } else if (
//       normalized.includes(
//         "moderate"
//       )
//     ) {

//       className +=
//         " pr-status-warning";

//     } else if (
//       normalized.includes(
//         "low"
//       )
//     ) {

//       className +=
//         " pr-status-safe";
//     }


//     return (
//       <span
//         className={className}
//       >
//         {value(text)}
//       </span>
//     );
//   };


//   // =========================================================
//   // SECTION HEADER
//   // =========================================================

//   const SectionHeader = ({
//     eyebrow,
//     title,
//     description,
//   }) => (

//     <div className="pr-section-header">

//       <div className="pr-section-header-top">

//         {eyebrow && (
//           <span className="pr-section-eyebrow">
//             {eyebrow}
//           </span>
//         )}

//         <svg
//           className="pr-pulse-line"
//           viewBox="0 0 120 24"
//           preserveAspectRatio="none"
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


//       <h2 className="pr-section-title">
//         {title}
//       </h2>


//       {description && (
//         <p className="pr-section-description">
//           {description}
//         </p>
//       )}

//     </div>
//   );


//   // =========================================================
//   // INFO CARD
//   // =========================================================

//   const InfoCard = ({
//     label,
//     value: cardValue,
//   }) => (

//     <div className="pr-info-item">

//       <span className="pr-info-label">
//         {label}
//       </span>

//       <span className="pr-info-value">
//         {value(cardValue)}
//       </span>

//     </div>
//   );


//   // =========================================================
//   // EMPTY STATE
//   // =========================================================

//   const EmptyState = ({
//     text,
//   }) => (

//     <div className="pr-empty">

//       <div className="pr-empty-line" />

//       <p>
//         {text}
//       </p>

//     </div>
//   );


//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (

//     <div className="pr-root">

//       {/* =====================================================
//           NAVBAR
//       ===================================================== */}

//       <header className="pr-navbar">

//         <div className="pr-navbar-left">

//           <div className="pr-logo-mark">

//             <svg
//               viewBox="0 0 24 24"
//               fill="none"
//             >

//               <path
//                 d="M12 3v18M3 12h18"
//                 stroke="currentColor"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//               />

//             </svg>

//           </div>


//           <span className="pr-app-name">
//             Hemophilia Care
//           </span>

//         </div>


//         <div className="pr-navbar-right">

//           <button
//             className="pr-dashboard-btn"
//             onClick={() =>
//               navigate(
//                 "/doctor-dashboard"
//               )
//             }
//             type="button"
//           >

//             Dashboard

//           </button>


//           <div className="pr-doctor-block">

//             <div className="pr-avatar">
//               {initials}
//             </div>


//             <div>

//               <div className="pr-doctor-name">
//                 {doctorName}
//               </div>

//               <div className="pr-doctor-role">
//                 {roleName}
//               </div>

//             </div>

//           </div>


//           <button
//             className="pr-logout-btn"
//             onClick={handleLogout}
//             type="button"
//           >
//             Log out
//           </button>

//         </div>

//       </header>


//       {/* =====================================================
//           MAIN
//       ===================================================== */}

//       <main className="pr-main">

//         <div className="pr-page-header">

//           <h1 className="pr-title">
//             Patient Research
//           </h1>

//           <p className="pr-subtitle">
//             Search and review the complete
//             clinical history of an individual
//             patient.
//           </p>

//         </div>


//         {/* =====================================================
//             SEARCH
//         ===================================================== */}

//         <section className="pr-search-card">

//           <div className="pr-search-heading">

//             <span className="pr-search-eyebrow">
//               Patient Lookup
//             </span>

//             <h2>
//               Search Patient Record
//             </h2>

//             <p>
//               Enter the patient's registered
//               Patient ID to retrieve their
//               clinical information.
//             </p>

            

//           </div>


//           <form
//             className="pr-search-form"
//             onSubmit={searchPatient}
//           >

//             <div className="pr-input-wrapper">

//               <label htmlFor="patientId">
//                 Patient ID
//               </label>

//               <input
//                 id="patientId"
//                 type="text"
//                 value={patientId}
//                 onChange={(e) =>
//                   setPatientId(
//                     e.target.value
//                   )
//                 }
//                 placeholder="Enter Patient ID"
//                 autoComplete="off"
//               />

//             </div>


//             <button
//               className="pr-search-btn"
//               type="submit"
//               disabled={loading}
//             >

//               {loading
//                 ? "Searching..."
//                 : "Search Patient"}

//             </button>

//           </form>

//           <button
//                 type="button"
//                 className="pdf-btn"
//                 onClick={downloadPatientPDF}
//                 disabled={loading}
//             >
//                 {loading
//                 ? "Generating PDF..."
//                 : "Download Patient Record"}
//             </button>


//           {error && (
//             <div className="pr-error">
//               {error}
//             </div>
//           )}

//         </section>


//         {/* =====================================================
//             INITIAL STATE
//         ===================================================== */}

//         {!patient &&
//           !loading &&
//           !error && (

//             <div className="pr-initial-state">

//               <h3>
//                 Search for a patient
//               </h3>

//               <p>
//                 Enter a valid Patient ID above
//                 to view the patient's clinical
//                 record.
//               </p>

//             </div>
//           )}


//         {/* =====================================================
//             PATIENT RECORD
//         ===================================================== */}

//         {patient && (

//           <div className="pr-record">

//             {/* =================================================
//                 PATIENT HEADER
//             ================================================= */}

//             <div className="pr-patient-header">

//               <div className="pr-patient-identity">

//                 <div className="pr-patient-avatar">

//                   {String(
//                     value(
//                       profile.fullName,
//                       "P"
//                     )
//                   )
//                     .split(" ")
//                     .map(
//                       (x) => x[0]
//                     )
//                     .slice(0, 2)
//                     .join("")
//                     .toUpperCase()}

//                 </div>


//                 <div>

//                   <span className="pr-record-label">
//                     Patient Record
//                   </span>

//                   <h2>
//                     {value(
//                       profile.fullName
//                     )}
//                   </h2>

//                   <p>
//                     Patient ID:{" "}
//                     <strong>
//                       {value(
//                         profile.patientId ||
//                         patientId
//                       )}
//                     </strong>
//                   </p>

//                 </div>

//               </div>


//               <div className="pr-patient-meta">

//                 <span>
//                   Record Status
//                 </span>

//                 <strong className="pr-active">
//                   Active
//                 </strong>

//               </div>

//             </div>


//             {/* =================================================
//                 PATIENT SUMMARY
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Clinical Overview"
//               title="Patient Summary"
//               description="A concise overview compiled from the patient's stored clinical records."
//             />


//             <div className="pr-stat-grid">

//               <div className="pr-stat-card">

//                 <span>
//                   Hemophilia Type
//                 </span>

//                 <strong>
//                   {value(
//                     hemophilia.type
//                   )}
//                 </strong>

//               </div>


//               <div className="pr-stat-card">

//                 <span>
//                   Severity
//                 </span>

//                 <strong>
//                   {value(
//                     hemophilia.severity
//                   )}
//                 </strong>

//               </div>


//               <div className="pr-stat-card">

//                 <span>
//                   Latest Risk
//                 </span>

//                 <strong>

//                   <StatusBadge
//                     text={
//                       selectedAssessment?.riskLevel ||
//                       "Not available"
//                     }
//                   />

//                 </strong>

//               </div>


//               <div className="pr-stat-card">

//                 <span>
//                   Assessments
//                 </span>

//                 <strong>
//                   {statistics.totalAssessments ??
//                     assessmentHistory.length}
//                 </strong>

//               </div>

//             </div>


//             {/* =================================================
//                 EXERCISE RECOMMENDATIONS
//                 Full exercise record belongs inside Patient Research.
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Personalised Rehabilitation"
//               title="Exercise Recommendations"
//               description="ML-generated exercise predictions for this patient. Review and approve them before they become active."
//             />

//             <div className="pr-card exercise-research-card">
//               {exerciseRecommendations.length === 0 ? (
//                 <div className="exercise-research-empty">
//                   <strong>No exercise recommendations recorded.</strong>
//                   <span>New recommendations will appear here after the patient's clinical details are processed.</span>
//                 </div>
//               ) : (
//                 <div className="exercise-research-list">
//                   {exerciseRecommendations.map((item) => (
//                     <div className="exercise-research-item" key={String(item._id)}>
//                       <div className="exercise-research-main">
//                         <div className="exercise-research-icon">✦</div>
//                         <div>
//                           <h3>{item.exerciseName || "Exercise"}</h3>
//                           <p>{item.purpose || "Personalised rehabilitation exercise."}</p>
//                           <div className="exercise-research-meta">
//                             <span>{item.joint ? `Joint: ${item.joint}` : `Category: ${item.category || "General"}`}</span>
//                             <span>{item.sets ?? "—"} sets</span>
//                             <span>{item.repetitionsOrDuration || "—"}</span>
//                             <span>{item.frequency || "As advised"}</span>
//                           </div>
//                           {item.mlConfidence != null && (
//                             <small>ML confidence: {Math.round(Number(item.mlConfidence) * 100)}%</small>
//                           )}
//                         </div>
//                       </div>

//                       <div className="exercise-research-actions">
//                         <span className={`exercise-research-status ${item.status === "ACTIVE" ? "active" : item.status === "REMOVED" ? "removed" : "pending"}`}>
//                           {item.status === "ACTIVE" ? "ACTIVE" : item.status === "REMOVED" ? "REMOVED" : "PENDING REVIEW"}
//                         </span>

//                         {item.status === "PENDING_DOCTOR_REVIEW" && (
//                           <div className="exercise-review-buttons">
//                             <button
//                               type="button"
//                               className="exercise-approve-btn"
//                               onClick={async () => {
//                                 try {
//                                   const token = localStorage.getItem("staffAuthToken");
//                                   await api.post(
//                                     `/exercise-recommendations/doctor/${item._id}/approve`,
//                                     {},
//                                     { headers: { Authorization: `Bearer ${token}` } }
//                                   );
//                                   await searchPatient(undefined, profile.patientId || patientId);
//                                 } catch (err) {
//                                   setError(err.response?.data?.message || "Unable to approve exercise.");
//                                 }
//                               }}
//                             >
//                               Approve
//                             </button>

//                             <button
//                               type="button"
//                               className="exercise-remove-btn"
//                               onClick={async () => {
//                                 try {
//                                   const token = localStorage.getItem("staffAuthToken");
//                                   await api.post(
//                                     `/exercise-recommendations/doctor/${item._id}/remove`,
//                                     {},
//                                     { headers: { Authorization: `Bearer ${token}` } }
//                                   );
//                                   await searchPatient(undefined, profile.patientId || patientId);
//                                 } catch (err) {
//                                   setError(err.response?.data?.message || "Unable to remove exercise.");
//                                 }
//                               }}
//                             >
//                               Remove
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* =================================================
//                 DEMOGRAPHICS
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Demographics"
//               title="Patient Information"
//               description="Basic demographic information registered for this patient."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Full Name"
//                   value={
//                     profile.fullName
//                   }
//                 />

//                 <InfoCard
//                   label="Patient ID"
//                   value={
//                     profile.patientId
//                   }
//                 />

//                 <InfoCard
//                   label="Gender"
//                   value={
//                     profile.gender
//                   }
//                 />

//                 <InfoCard
//                   label="Age"
//                   value={
//                     profile.age
//                   }
//                 />

//                 <InfoCard
//                   label="Date of Birth"
//                   value={
//                     formatDate(
//                       profile.dateOfBirth
//                     )
//                   }
//                 />

//                 <InfoCard
//                   label="Blood Group"
//                   value={
//                     profile.bloodGroup
//                   }
//                 />

//                 <InfoCard
//                   label="City"
//                   value={
//                     profile.city
//                   }
//                 />

//                 <InfoCard
//                   label="State"
//                   value={
//                     profile.state
//                   }
//                 />

//                 <InfoCard
//                   label="PIN Code"
//                   value={
//                     profile.pinCode
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 CONTACT
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Contact"
//               title="Patient Contact Information"
//               description="Contact information available in the authenticated clinical record."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Mobile"
//                   value={
//                     contact.mobile
//                   }
//                 />

//                 <InfoCard
//                   label="Alternate Contact"
//                   value={
//                     contact.alternateContact
//                   }
//                 />

//                 <InfoCard
//                   label="Email"
//                   value={
//                     contact.email
//                   }
//                 />

                

//                 <InfoCard
//                   label="City"
//                   value={
//                     contact.city
//                   }
//                 />

//                 <InfoCard
//                   label="State"
//                   value={
//                     contact.state
//                   }
//                 />

//                 <InfoCard
//                   label="PIN Code"
//                   value={
//                     contact.pinCode
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 HEMOPHILIA
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Hemophilia Profile"
//               title="Disease Information"
//               description="Clinical information related to the patient's hemophilia diagnosis and management."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Hemophilia Type"
//                   value={
//                     hemophilia.type
//                   }
//                 />

//                 <InfoCard
//                   label="Severity"
//                   value={
//                     hemophilia.severity
//                   }
//                 />

//                 <InfoCard
//                   label="Age at Diagnosis"
//                   value={
//                     hemophilia.ageAtDiagnosis
//                   }
//                 />

//                 <InfoCard
//                   label="Family History"
//                   value={
//                     familyGeneticHistory.familyHistory
//                   }
//                 />

                

//                 <InfoCard
//                   label="Factor Therapy"
//                   value={
//                     hemophilia.currentFactorTherapy
//                   }
//                 />

//                 <InfoCard
//                   label="Other Medications"
//                   value={
//                     hemophilia.otherMedications
//                   }
//                 />

//                 <InfoCard
//                   label="Bleed Frequency"
//                   value={
//                     hemophilia.bleedFrequency
//                   }
//                 />

//                 <InfoCard
//                   label="Last Bleed"
//                   value={
//                     formatDate(
//                       hemophilia.lastBleedDate
//                     )
//                   }
//                 />

//                 <InfoCard
//                   label="Physiotherapy"
//                   value={
//                     formatBoolean(
//                       hemophilia.underPhysiotherapy
//                     )
//                   }
//                 />
//                 <InfoCard
//                   label="Male Relative Flag"
//                   value={
//                     formatBoolean(
//                       familyGeneticHistory.maleRelativeFlag
//                     )
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 FAMILY / GENETIC
//             ================================================= */}

//             {/* <SectionHeader
//               eyebrow="Family & Genetics"
//               title="Family Genetic History"
//               description="Family-history and genetic-testing information recorded in the clinical system."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Family History"
//                   value={
//                     familyGeneticHistory.familyHistory
//                   }
//                 />

//                 <InfoCard
//                   label="Genetic Testing Done"
//                   value={
//                     familyGeneticHistory.geneticTestingDone
//                   }
//                 />

//                 <InfoCard
//                   label="Previous Testing"
//                   value={
//                     familyGeneticHistory.previousTesting
//                   }
//                 />

//                 <InfoCard
//                   label="Low Factor History"
//                   value={
//                     familyGeneticHistory.factorLow
//                   }
//                 />

//                 <InfoCard
//                   label="Male Relative Flag"
//                   value={
//                     formatBoolean(
//                       familyGeneticHistory.maleRelativeFlag
//                     )
//                   }
//                 />

//               </div>

//             </div> */}


//             {/* =================================================
//                 BLEEDING HISTORY
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Bleeding History"
//               title="Bleeding Profile"
//               description="Bleeding information recorded in the patient's clinical history."
//             />


//             <div className="pr-stat-grid">

//               <div className="pr-stat-card">

//                 <span>
//                   Bleed Frequency
//                 </span>

//                 <strong>
//                   {value(
//                     bleedingHistory.bleedFrequency ||
//                     hemophilia.bleedFrequency
//                   )}
//                 </strong>

//               </div>


//               <div className="pr-stat-card">

//                 <span>
//                   Last Bleeding Event
//                 </span>

//                 <strong>
//                   {formatDate(
//                     bleedingHistory.lastBleedDate ||
//                     hemophilia.lastBleedDate
//                   )}
//                 </strong>

//               </div>


//               <div className="pr-stat-card">

//                 <span>
//                   Affected Joints
//                 </span>

//                 <strong>
//                   {
//                     Array.isArray(
//                       bleedingHistory.jointsAffected
//                     )
//                       ? bleedingHistory
//                           .jointsAffected
//                           .length
//                       : 0
//                   }
//                 </strong>

//               </div>

//             </div>


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Minor-cut Bleeding"
//                   value={
//                     bleedingHistory.bleedingAfterMinorCuts
//                   }
//                 />

//                 <InfoCard
//                   label="Dental / Surgery Bleeding"
//                   value={
//                     bleedingHistory.dentalSurgeryBleeding
//                   }
//                 />

//                 <InfoCard
//                   label="Bruising"
//                   value={
//                     bleedingHistory.bruising
//                   }
//                 />

//                 <InfoCard
//                   label="Muscle Swelling"
//                   value={
//                     bleedingHistory.muscleSwelling
//                   }
//                 />

//                 <InfoCard
//                   label="Joint Swelling"
//                   value={
//                     bleedingHistory.jointSwelling
//                   }
//                 />

//                 <InfoCard
//                   label="Blood in Urine / Stool"
//                   value={
//                     bleedingHistory.bloodUrineStool
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 JOINT HEALTH
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Musculoskeletal"
//               title="Joint Health"
//               description="Joints recorded as affected in the patient's clinical history."
//             />


//             <div className="pr-card">

//               {Array.isArray(
//                 bleedingHistory.jointsAffected
//               ) &&
//               bleedingHistory
//                 .jointsAffected
//                 .length > 0 ? (

//                 <div className="pr-joint-grid">

//                   {bleedingHistory
//                     .jointsAffected
//                     .map(
//                       (joint, index) => (

//                         <div
//                           className="pr-joint"
//                           key={index}
//                         >
//                           {joint}
//                         </div>

//                       )
//                     )}

//                 </div>

//               ) : (

//                 <EmptyState
//                   text="No affected joints recorded."
//                 />

//               )}


//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Target Joint"
//                   value={
//                     bleedingHistory.targetJoint ||
//                     hemophilia.targetJoint
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 TREATMENT
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Treatment"
//               title="Treatment & Therapy"
//               description="Current treatment information available in the patient's record."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Factor Therapy"
//                   value={
//                     treatment.currentFactorTherapy
//                   }
//                 />

//                 <InfoCard
//                   label="Other Medications"
//                   value={
//                     treatment.otherMedications
//                   }
//                 />

//                 <InfoCard
//                   label="Physiotherapy"
//                   value={
//                     formatBoolean(
//                       treatment.underPhysiotherapy
//                     )
//                   }
//                 />

//                 <InfoCard
//                   label="Mobility Limitation"
//                   value={
//                     treatment.mobilityLimitation
//                   }
//                 />

//                 <InfoCard
//                   label="Assistive Devices"
//                   value={
//                     treatment.assistiveDevices
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 ASSESSMENT GRAPH
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Assessment Analytics"
//               title="Assessment Risk Trend"
//               description="Every point represents one stored clinical assessment."
//             />


//             <div className="pr-card">

//               {assessmentChartData.length > 0 ? (

//                 <div className="pr-chart">

//                   <ResponsiveContainer
//                     width="100%"
//                     height={320}
//                   >

//                     <LineChart
//                       data={
//                         assessmentChartData
//                       }
//                     >

//                       <CartesianGrid
//                         strokeDasharray="3 3"
//                       />

//                       <XAxis
//                         dataKey="assessmentNumber"
//                         tickFormatter={(v) =>
//                           `A${v}`
//                         }
//                       />

//                       <YAxis
//                         allowDecimals={false}
//                       />

//                       <Tooltip
//                         formatter={(
//                           value,
//                           name
//                         ) => {

//                           if (
//                             name ===
//                             "score"
//                           ) {

//                             return [
//                               value,
//                               "Score",
//                             ];
//                           }

//                           return [
//                             value,
//                             name,
//                           ];
//                         }}
//                       />

//                       <Line
//                         type="monotone"
//                         dataKey="score"
//                         stroke="#2C5CE0"
//                         strokeWidth={3}
//                         dot={{
//                           r: 5,
//                         }}
//                         activeDot={{
//                           r: 7,
//                         }}
//                       />

//                     </LineChart>

//                   </ResponsiveContainer>

//                 </div>

//               ) : (

//                 <EmptyState
//                   text="No assessment scores available."
//                 />

//               )}

//             </div>


//             {/* =================================================
//                 ASSESSMENT REVIEW
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Assessment Review"
//               title="Assessment History & Explanation"
//               description="Select any assessment to see the exact answers, score, risk level and explanation stored for that assessment."
//             />


//             <div className="pr-card">

//               {assessmentHistory.length > 0 ? (

//                 <>

//                   {/* =========================================
//                       SELECT
//                   ========================================= */}

//                   <div className="assessment-selector">

//                     <label htmlFor="assessmentSelect">
//                       Select Assessment
//                     </label>


//                     <select
//                       id="assessmentSelect"
//                       value={
//                         selectedAssessmentId
//                       }
//                       onChange={(e) =>
//                         setSelectedAssessmentId(
//                           e.target.value
//                         )
//                       }
//                     >

//                       {assessmentHistory.map(
//                         (
//                           assessment,
//                           index
//                         ) => (

//                           <option
//                             key={
//                               assessment.id ||
//                               assessment._id ||
//                               index
//                             }
//                             value={String(
//                               assessment.id ||
//                               assessment._id ||
//                               ""
//                             )}
//                           >

//                             Assessment{" "}
//                             {assessment.assessmentNumber ??
//                               index + 1}

//                             {" — Score "}
//                             {assessment.score ?? 0}

//                             {" — "}
//                             {assessment.riskLevel ||
//                               "Unknown"}

//                             {" — "}
//                             {formatDate(
//                               assessment.date ||
//                               assessment.createdAt
//                             )}

//                           </option>

//                         )
//                       )}

//                     </select>

//                   </div>


//                   {/* =========================================
//                       SELECTED ASSESSMENT
//                   ========================================= */}

//                   {selectedAssessment && (

//                     <div className="selected-assessment">

//                       {/* SCORE */}

//                       <div className="selected-score-header">

//                         <div>

//                           <span>
//                             Assessment{" "}
//                             {selectedAssessment.assessmentNumber}
//                           </span>


//                           <h3>
//                             Score{" "}
//                             {value(
//                               selectedAssessment.score
//                             )}
//                           </h3>


//                           <p>
//                             Recorded on{" "}
//                             {formatDateTime(
//                               selectedAssessment.date ||
//                               selectedAssessment.createdAt
//                             )}
//                           </p>

//                         </div>


//                         <div className="selected-risk">

//                           <span>
//                             Risk Level
//                           </span>

//                           <StatusBadge
//                             text={
//                               selectedAssessment.riskLevel
//                             }
//                           />

//                         </div>

//                       </div>


//                       {/* FLAGS */}

//                       <div className="assessment-flags">

//                         <div>

//                           <span>
//                             Emergency Symptoms
//                           </span>

//                           <strong>
//                             {formatBoolean(
//                               selectedAssessment.emergencyFlag
//                             )}
//                           </strong>

//                         </div>


//                         <div>

//                           <span>
//                             Strong Suspicion
//                           </span>

//                           <strong>
//                             {formatBoolean(
//                               selectedAssessment.strongSuspicionFlag
//                             )}
//                           </strong>

//                         </div>

//                       </div>


//                       {/* SUMMARY */}

//                       {selectedAssessment.summaryText && (

//                         <div className="assessment-summary">

//                           <div className="assessment-box-title">
//                             Assessment Summary
//                           </div>

//                           <p>
//                             {
//                               selectedAssessment.summaryText
//                             }
//                           </p>

//                         </div>

//                       )}


//                       {/* =======================================
//                           EXPLANATION
//                       ======================================= */}

//                       <div className="assessment-explanation">

//                         <div className="assessment-box-title">
//                           Why this assessment produced this result
//                         </div>


//                         {selectedExplanation.length > 0 ? (

//                           <div className="explanation-list">

//                             {selectedExplanation.map(
//                               (
//                                 explanation,
//                                 index
//                               ) => (

//                                 <div
//                                   className="explanation-item"
//                                   key={index}
//                                 >

//                                   <span>
//                                     {index + 1}
//                                   </span>

//                                   <p>
//                                     {explanation}
//                                   </p>

//                                 </div>

//                               )
//                             )}

//                           </div>

//                         ) : (

//                           <EmptyState
//                             text="No explanation was stored for this assessment."
//                           />

//                         )}

//                       </div>


//                       {/* =======================================
//                           EXACT ANSWERS
//                       ======================================= */}

//                       <div className="assessment-answers">

//                         <div className="assessment-box-title">
//                           Recorded Responses
//                         </div>


//                         <p className="assessment-note">

//                           These are the exact
//                           questions and answers
//                           stored for Assessment{" "}
//                           {
//                             selectedAssessment.assessmentNumber
//                           }.

//                         </p>


//                         {selectedAnswers.length > 0 ? (

//                           <div className="answer-grid">

//                             {selectedAnswers.map(
//                               (item) => (

//                                 <div
//                                   className="answer-item"
//                                   key={item.id}
//                                 >

//                                   <span>
//                                     {item.question}
//                                   </span>

//                                   <strong>
//                                     {item.answer}
//                                   </strong>

//                                 </div>

//                               )
//                             )}

//                           </div>

//                         ) : (

//                           <EmptyState
//                             text="No recorded responses available for this assessment."
//                           />

//                         )}

//                       </div>


//                       {/* =======================================
//                           DERIVED FACTORS
//                       ======================================= */}

//                       <div className="assessment-factors">
//                         <br></br>
//                         <br></br>
//                         <div className="assessment-box-title">
//                           Clinical Factors From This Assessment
//                         </div>


//                         <div className="pr-info-grid">

//                           <InfoCard
//                             label="Family History"
//                             value={
//                               selectedFactors.familyHistory
//                             }
//                           />

//                           <InfoCard
//                             label="Male Relative"
//                             value={
//                               formatBoolean(
//                                 selectedFactors.maleRelativeFlag
//                               )
//                             }
//                           />

//                           <InfoCard
//                             label="Minor Cut Bleeding"
//                             value={
//                               selectedFactors.bleedMinorCuts
//                             }
//                           />

//                           <InfoCard
//                             label="Dental / Surgery Bleeding"
//                             value={
//                               selectedFactors.dentalSurgeryBleeding
//                             }
//                           />

//                           <InfoCard
//                             label="Bruising"
//                             value={
//                               selectedFactors.bruises
//                             }
//                           />

//                           <InfoCard
//                             label="Muscle Swelling"
//                             value={
//                               selectedFactors.muscleSwelling
//                             }
//                           />

//                           <InfoCard
//                             label="Joint Swelling"
//                             value={
//                               selectedFactors.jointSwelling
//                             }
//                           />

                          

//                           <InfoCard
//                             label="Blood in Urine / Stool"
//                             value={
//                               selectedFactors.bloodUrineStool
//                             }
//                           />

//                           <InfoCard
//                             label="Heavy Menstrual Bleeding"
//                             value={
//                               selectedFactors.heavyMenstrual
//                             }
//                           />

                          

                          

//                         </div>


//                         {Array.isArray(
//                           selectedFactors.jointsList
//                         ) &&
//                         selectedFactors
//                           .jointsList
//                           .length > 0 && (

//                           <div className="pr-joint-grid">

//                             {selectedFactors
//                               .jointsList
//                               .map(
//                                 (
//                                   joint,
//                                   index
//                                 ) => (

//                                   <div
//                                     className="pr-joint"
//                                     key={index}
//                                   >
//                                     {joint}
//                                   </div>

//                                 )
//                               )}

//                           </div>

//                         )}

//                       </div>

//                     </div>

//                   )}

//                 </>

//               ) : (

//                 <EmptyState
//                   text="No assessment history available."
//                 />

//               )}

//             </div>


//             {/* =================================================
//                 CARE TEAM
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Care Team"
//               title="Clinical Care Information"
//               description="Healthcare facility and care-team information associated with the patient."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="HTC Name"
//                   value={
//                     careTeam.htcName
//                   }
//                 />

//                 <InfoCard
//                   label="Hematologist"
//                   value={
//                     careTeam.hematologistName
//                   }
//                 />

//                 <InfoCard
//                   label="Hospital"
//                   value={
//                     careTeam.hospitalName
//                   }
//                 />

//                 <InfoCard
//                   label="Existing Patient Number"
//                   value={
//                     careTeam.existingPatientNumber
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 EMERGENCY CONTACT
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Emergency"
//               title="Emergency Contact"
//               description="Emergency contact information recorded for this patient."
//             />


//             <div className="pr-card">

//               <div className="pr-info-grid">

//                 <InfoCard
//                   label="Name"
//                   value={
//                     emergencyContact.name
//                   }
//                 />

//                 <InfoCard
//                   label="Relationship"
//                   value={
//                     emergencyContact.relationship
//                   }
//                 />

//                 <InfoCard
//                   label="Phone"
//                   value={
//                     emergencyContact.phone
//                   }
//                 />

//               </div>

//             </div>


//             {/* =================================================
//                 TIMELINE
//             ================================================= */}

//             <SectionHeader
//               eyebrow="Patient History"
//               title="Clinical Timeline"
//               description="Chronological record of important clinical events available in the system."
//             />


//             <div className="pr-card">

//               {timeline.length > 0 ? (

//                 <div className="pr-timeline">

//                   {timeline.map(
//                     (event, index) => (

//                       <div
//                         className="pr-timeline-item"
//                         key={index}
//                       >

//                         <div className="pr-timeline-dot" />


//                         <div className="pr-timeline-content">

//                           <div className="pr-timeline-top">

//                             <strong>
//                               {value(
//                                 event.title ||
//                                 event.type
//                               )}
//                             </strong>

//                             <span>
//                               {formatDate(
//                                 event.date ||
//                                 event.createdAt
//                               )}
//                             </span>

//                           </div>


//                           <p>
//                             {value(
//                               event.description ||
//                               event.details,
//                               "No additional details available."
//                             )}
//                           </p>

//                         </div>

//                       </div>

//                     )
//                   )}

//                 </div>

//               ) : (

//                 <EmptyState
//                   text="No timeline events are currently available."
//                 />

//               )}

//             </div>


//             {/* =================================================
//                 IMPORTANT DATA NOTE
//             ================================================= */}

//             <div className="pr-privacy">

//               <div className="pr-privacy-title">
//                 Authorized Clinical Access
//               </div>

//               <p>
//                 Patient information displayed here
//                 is retrieved from the authenticated
//                 clinical system and is intended for
//                 authorized healthcare professionals
//                 only.
//               </p>

//             </div>

//           </div>

//         )}

//       </main>


//       {/* =====================================================
//           CSS
//       ===================================================== */}

//       <style>{`

//         * {
//           box-sizing: border-box;
//         }

//         .pr-root {
//           --color-bg: #F5F8FC;
//           --color-surface: #FFFFFF;
//           --color-primary: #2C5CE0;
//           --color-primary-dark: #163B85;
//           --color-primary-soft: #EAF0FE;
//           --color-accent: #0BA5A0;
//           --color-border: #DCE6F2;
//           --color-text: #10233F;
//           --color-text-secondary: #5B7291;
//           --color-text-faint: #93A6C2;

//           min-height: 100vh;

//           background:
//             var(--color-bg);

//           color:
//             var(--color-text);

//           font-family:
//             'Inter',
//             -apple-system,
//             BlinkMacSystemFont,
//             'Segoe UI',
//             sans-serif;
//         }

//         .pr-root * {
//           box-sizing: border-box;
//         }

//         /* =========================
//            NAVBAR
//         ========================= */

//         .pr-navbar {
//           position: sticky;
//           top: 0;
//           z-index: 100;

//           display: flex;
//           align-items: center;
//           justify-content: space-between;

//           padding: 14px 28px;

//           background:
//             var(--color-surface);

//           border-bottom:
//             1px solid var(--color-border);
//         }

//         .pr-navbar-left {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .pr-logo-mark {
//           width: 34px;
//           height: 34px;

//           border-radius: 9px;

//           background:
//             linear-gradient(
//               145deg,
//               #2C5CE0,
//               #163B85
//             );

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           color: white;
//         }

//         .pr-logo-mark svg {
//           width: 18px;
//           height: 18px;
//         }

//         .pr-app-name {
//           font-family:
//             'Manrope',
//             'Inter',
//             sans-serif;

//           font-weight: 700;
//           font-size: 16px;

//           color:
//             var(--color-text);
//         }

//         .pr-navbar-right {
//           display: flex;
//           align-items: center;
//           gap: 14px;
//         }

//         .pr-dashboard-btn,
//         .pr-logout-btn {
//           display: flex;
//           align-items: center;
//           gap: 6px;

//           padding: 8px 12px;

//           border-radius: 9px;

//           border:
//             1px solid var(--color-border);

//           background:
//             var(--color-surface);

//           color:
//             var(--color-text-secondary);

//           font-size: 12.5px;
//           font-weight: 600;

//           cursor: pointer;

//           transition:
//             all 0.15s ease;
//         }

//         .pr-dashboard-btn:hover,
//         .pr-logout-btn:hover {
//           border-color:
//             var(--color-primary);

//           color:
//             var(--color-primary-dark);

//           background:
//             var(--color-primary-soft);
//         }

//         .pr-dashboard-btn svg {
//           width: 15px;
//           height: 15px;
//         }

//         .pr-doctor-block {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .pr-avatar {
//           width: 34px;
//           height: 34px;

//           border-radius: 50%;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary-dark);

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           font-size: 12px;
//           font-weight: 700;

//           border:
//             1px solid var(--color-border);
//         }

//         .pr-doctor-name {
//           font-size: 13.5px;
//           font-weight: 600;
//         }

//         .pr-doctor-role {
//           font-size: 11.5px;
//           color:
//             var(--color-text-secondary);
//         }

//         /* =========================
//            MAIN
//         ========================= */

//         .pr-main {
//           max-width: 1240px;

//           margin: 0 auto;

//           padding:
//             32px 28px 64px;
//         }

//         /* =========================
//            HEADER
//         ========================= */

//         .pr-page-header {
//           margin-bottom: 24px;
//         }

//         .pr-title {
//           font-family:
//             'Manrope',
//             'Inter',
//             sans-serif;

//           font-size: 28px;

//           font-weight: 800;

//           letter-spacing: -0.02em;

//           margin:
//             0 0 6px;
//         }

//         .pr-subtitle {
//           margin: 0;

//           font-size: 14.5px;

//           color:
//             var(--color-text-secondary);
//         }

//         /* =========================
//            SEARCH
//         ========================= */

//         .pr-search-card {
//           background:
//             var(--color-surface);

//           border:
//             1px solid var(--color-border);

//           border-radius: 16px;

//           padding: 22px;

//           margin-bottom: 32px;

//           box-shadow:
//             0 1px 2px rgba(16,35,63,0.04),
//             0 6px 20px rgba(16,35,63,0.05);
//         }

//         .pr-search-eyebrow {
//           display: block;

//           font-size: 10.5px;

//           font-weight: 700;

//           letter-spacing:
//             0.08em;

//           text-transform:
//             uppercase;

//           color:
//             var(--color-primary);

//           margin-bottom: 5px;
//         }

//         .pr-search-heading h2 {
//           font-size: 17px;

//           margin:
//             0 0 4px;

//           font-weight: 700;
//         }

//         .pr-search-heading p {
//           margin: 0;

//           color:
//             var(--color-text-secondary);

//           font-size: 12.5px;
//         }

//         .pr-search-heading {
//           margin-bottom: 18px;
//         }

//         .pr-search-form {
//           display: flex;

//           align-items: flex-end;

//           gap: 12px;
//         }

//         .pr-input-wrapper {
//           flex: 1;
//         }

//         .pr-input-wrapper label {
//           display: block;

//           font-size: 12px;

//           font-weight: 600;

//           color:
//             var(--color-text-secondary);

//           margin-bottom: 7px;
//         }

//         .pr-input-wrapper input {
//           width: 100%;

//           padding:
//             12px 14px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 9px;

//           outline: none;

//           font-size: 13px;

//           color:
//             var(--color-text);
//         }

//         .pr-input-wrapper input:focus {
//           border-color:
//             var(--color-primary);

//           box-shadow:
//             0 0 0 3px
//             rgba(44,92,224,0.08);
//         }

//         .pr-search-btn {
//           padding:
//             12px 20px;

//           border: none;

//           border-radius: 9px;

//           background:
//             var(--color-primary);

//           color: white;

//           font-size: 13px;

//           font-weight: 700;

//           cursor: pointer;
//         }

//         .pr-search-btn:hover {
//           background:
//             var(--color-primary-dark);
//         }

//         .pr-search-btn:disabled {
//           opacity: 0.65;

//           cursor:
//             not-allowed;
//         }

//         .pr-error {
//           margin-top: 14px;

//           padding: 10px 12px;

//           border-radius: 8px;

//           background: #FFF1F1;

//           border:
//             1px solid #FFD2D2;

//           color: #B42318;

//           font-size: 12.5px;
//         }

//         /* =========================
//            INITIAL
//         ========================= */

//         .pr-initial-state {
//           padding: 70px 20px;

//           text-align: center;

//           color:
//             var(--color-text-secondary);
//         }

//         .pr-initial-icon {
//           width: 60px;
//           height: 60px;

//           margin:
//             0 auto 18px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 16px;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary);
//         }

//         .pr-initial-icon svg {
//           width: 32px;
//           height: 32px;
//         }

//         .pr-initial-state h3 {
//           margin:
//             0 0 6px;

//           color:
//             var(--color-text);
//         }

//         .pr-initial-state p {
//           margin: 0;

//           font-size: 13px;
//         }

//         /* =========================
//            PATIENT HEADER
//         ========================= */

//         .pr-patient-header {
//           display: flex;

//           justify-content: space-between;

//           align-items: center;

//           gap: 20px;

//           padding: 22px;

//           background:
//             white;

//           border:
//             1px solid var(--color-border);

//           border-radius: 16px;

//           margin-bottom: 35px;
//         }

//         .pr-patient-identity {
//           display: flex;

//           align-items: center;

//           gap: 14px;
//         }

//         .pr-patient-avatar {
//           width: 52px;
//           height: 52px;

//           border-radius: 14px;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary-dark);

//           display: flex;

//           align-items: center;

//           justify-content: center;

//           font-size: 16px;

//           font-weight: 800;
//         }

//         .pr-record-label {
//           display: block;

//           color:
//             var(--color-primary);

//           text-transform:
//             uppercase;

//           letter-spacing:
//             0.08em;

//           font-size: 10px;

//           font-weight: 700;

//           margin-bottom: 3px;
//         }

//         .pr-patient-identity h2 {
//           margin:
//             0 0 4px;

//           font-size: 21px;
//         }

//         .pr-patient-identity p {
//           margin: 0;

//           font-size: 12px;

//           color:
//             var(--color-text-secondary);
//         }

//         .pr-patient-meta {
//           text-align: right;
//         }

//         .pr-patient-meta span {
//           display: block;

//           font-size: 11px;

//           color:
//             var(--color-text-secondary);
//         }

//         .pr-active {
//           color: #138A5B;
//           font-size: 13px;
//         }

//         /* =========================
//            SECTION HEADERS
//         ========================= */

//         .pr-section-header {
//           margin:
//             36px 0 14px;
//         }

//         .pr-section-header-top {
//           display: flex;

//           align-items: center;

//           gap: 10px;
//         }

//         .pr-section-eyebrow {
//           font-size: 10px;

//           font-weight: 800;

//           text-transform:
//             uppercase;

//           letter-spacing:
//             0.08em;

//           color:
//             var(--color-primary);
//         }

//         .pr-pulse-line {
//           width: 70px;
//           height: 18px;

//           color:
//             var(--color-primary);
//         }

//         .pr-section-title {
//           margin:
//             4px 0 4px;

//           font-size: 19px;

//           font-weight: 750;
//         }

//         .pr-section-description {
//           margin: 0;

//           color:
//             var(--color-text-secondary);

//           font-size: 12.5px;

//           line-height: 1.5;
//         }

//         /* =========================
//            CARDS
//         ========================= */

//         .pr-card {
//           background:
//             var(--color-surface);
//             margin-top : 20px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 16px;

//           padding: 22px;

//           box-shadow:
//             0 1px 2px rgba(16,35,63,0.04),
//             0 6px 20px rgba(16,35,63,0.05);
//         }

//         .pr-info-grid {
//           display: grid;
          

//           grid-template-columns:
//             repeat(4, minmax(0, 1fr));

//           gap: 18px;
//         }

//         .pr-info-grid-single {
//           margin-top: 20px;

//           grid-template-columns:
//             repeat(3, minmax(0, 1fr));
//         }

//         .pr-info-item {
//           min-width: 0;
//         }

//         .pr-info-label {
//           display: block;

//           margin-bottom: 5px;

//           font-size: 10.5px;

//           text-transform:
//             uppercase;

//           letter-spacing:
//             0.06em;

//           font-weight: 700;

//           color:
//             var(--color-text-faint);
//         }

//         .pr-info-value {
//           display: block;

//           font-size: 13px;

//           font-weight: 600;

//           color:
//             var(--color-text);

//           word-break:
//             break-word;
//         }

//         /* =========================
//            STATS
//         ========================= */

//         .pr-stat-grid {
//           display: grid;

//           grid-template-columns:
//             repeat(4, 1fr);

//           gap: 14px;
//         }

//         .pr-stat-card {
//           background:
//             white;

//           border:
//             1px solid var(--color-border);

//           border-radius: 14px;

//           padding: 18px;
//         }

//         .pr-stat-card span {
//           display: block;

//           color:
//             var(--color-text-secondary);

//           font-size: 11px;

//           margin-bottom: 7px;
//         }

//         .pr-stat-card strong {
//           font-size: 18px;

//           font-weight: 800;
//         }

//         /* =========================
//            STATUS
//         ========================= */

//         .pr-status {
//           display: inline-flex;

//           padding:
//             5px 9px;

//           border-radius: 999px;

//           font-size: 11px;

//           font-weight: 700;

//           background: #EEF2F7;

//           color:
//             var(--color-text-secondary);
//         }

//         .pr-status-safe {
//           background: #E8F7F0;
//           color: #147A52;
//         }

//         .pr-status-warning {
//           background: #FFF4D9;
//           color: #9A6700;
//         }

//         .pr-status-danger {
//           background: #FFE8E8;
//           color: #B42318;
//         }

//         /* =========================
//            JOINTS
//         ========================= */

//         .pr-joint-grid {
//           display: flex;

//           flex-wrap: wrap;

//           gap: 10px;
//         }

//         .pr-joint {
//           padding:
//             9px 13px;

//           border-radius: 9px;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary-dark);

//           font-size: 12px;

//           font-weight: 700;
//         }

//         /* =========================
//            EMPTY
//         ========================= */

//         .pr-empty {
//           padding: 30px;

//           text-align: center;

//           color:
//             var(--color-text-secondary);
//         }

//         .pr-empty-line {
//           width: 42px;

//           height: 3px;

//           margin:
//             0 auto 12px;

//           border-radius: 3px;

//           background:
//             var(--color-border);
//         }

//         .pr-empty p {
//           margin: 0;

//           font-size: 12.5px;
//         }

//         /* =========================
//            LINE CHART
//         ========================= */

//         .chart-explanation {
//           display: flex;

//           align-items: center;

//           justify-content: space-between;

//           gap: 20px;

//           margin-bottom: 15px;
//         }

//         .chart-explanation strong {
//           font-size: 14px;
//         }

//         .chart-explanation p {
//           margin:
//             4px 0 0;

//           font-size: 12px;

//           color:
//             var(--color-text-secondary);
//         }

//         .chart-count {
//           padding:
//             7px 10px;

//           border-radius: 8px;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary-dark);

//           font-size: 11px;

//           font-weight: 700;

//           white-space: nowrap;
//         }

//         .pr-chart {
//           width: 100%;

//           min-height: 320px;
//         }

//         .chart-tooltip {
//           background:
//             white;

//           border:
//             1px solid var(--color-border);

//           border-radius: 10px;

//           padding: 10px 12px;

//           box-shadow:
//             0 8px 24px
//             rgba(16,35,63,0.12);

//           font-size: 11px;
//         }

//         .chart-tooltip strong {
//           display: block;

//           margin-bottom: 6px;

//           font-size: 12px;
//         }

//         .chart-tooltip div {
//           margin-top: 3px;
//         }

//         /* =========================
//            ASSESSMENT SELECTOR
//         ========================= */

//         .assessment-selector {
//           display: flex;

//           align-items: flex-end;

//           gap: 15px;

//           margin-bottom: 24px;
//         }

//         .assessment-selector label {
//           display: block;

//           min-width: 180px;

//           font-size: 11px;

//           font-weight: 700;

//           color:
//             var(--color-text-secondary);
//         }

//         .assessment-selector select {
//           flex: 1;

//           padding:
//             12px 14px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 9px;

//           background: white;

//           color:
//             var(--color-text);

//           font-size: 13px;

//           font-weight: 600;

//           outline: none;

//           cursor: pointer;
//         }

//         .assessment-selector select:focus {
//           border-color:
//             var(--color-primary);

//           box-shadow:
//             0 0 0 3px
//             rgba(44,92,224,0.08);
//         }

//         /* =========================
//            SELECTED ASSESSMENT
//         ========================= */

//         .selected-assessment {
//           border-top:
//             1px solid var(--color-border);

//           padding-top: 22px;
//         }

//         .selected-score-header {
//           display: flex;

//           justify-content: space-between;

//           align-items: center;

//           gap: 20px;

//           padding: 18px;

//           border-radius: 12px;

//           background:
//             var(--color-primary-soft);
//         }

//         .selected-score-header span,
//         .selected-risk span {
//           display: block;

//           font-size: 10.5px;

//           text-transform:
//             uppercase;

//           letter-spacing:
//             0.06em;

//           color:
//             var(--color-text-secondary);

//           font-weight: 700;

//           margin-bottom: 5px;
//         }

//         .selected-score-header h3 {
//           margin:
//             0 0 4px;

//           font-size: 28px;

//           color:
//             var(--color-primary-dark);
//         }

//         .selected-score-header p {
//           margin: 0;

//           font-size: 11.5px;

//           color:
//             var(--color-text-secondary);
//         }

//         .selected-risk {
//           text-align: right;
//         }

//         .assessment-flags {
//           display: grid;

//           grid-template-columns:
//             repeat(2, 1fr);

//           gap: 12px;

//           margin:
//             16px 0;
//         }

//         .assessment-flags > div {
//           padding: 13px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 10px;

//           background: white;
//         }

//         .assessment-flags span {
//           display: block;

//           font-size: 10.5px;

//           color:
//             var(--color-text-secondary);

//           margin-bottom: 5px;
//         }

//         .assessment-flags strong {
//           font-size: 13px;
//         }

//         .assessment-explanation,
//         .assessment-answers {
//           margin-top: 20px;

//           padding-top: 20px;

//           border-top:
//             1px solid var(--color-border);
//         }

//         .assessment-box-title {
//           font-size: 14px;

//           font-weight: 800;

//           margin-bottom: 5px;
//         }

//         .assessment-note {
//           margin:
//             0 0 15px;

//           color:
//             var(--color-text-secondary);

//           font-size: 12px;

//           line-height: 1.55;
//         }

//         .explanation-list {
//           display: grid;

//           gap: 9px;
//         }

//         .explanation-item {
//           display: flex;

//           align-items: flex-start;

//           gap: 10px;

//           padding: 11px 12px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 9px;

//           background:
//             #FAFCFF;
//         }

//         .explanation-item > span {
//           width: 22px;
//           height: 22px;

//           flex: 0 0 22px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 50%;

//           background:
//             var(--color-primary-soft);

//           color:
//             var(--color-primary-dark);

//           font-size: 10px;

//           font-weight: 800;
//         }

//         .explanation-item p {
//           margin: 2px 0 0;

//           font-size: 12.5px;

//           line-height: 1.45;
//         }

//         .answer-grid {
//           display: grid;

//           grid-template-columns:
//             repeat(2, minmax(0, 1fr));

//           gap: 10px;
//         }

//         .answer-item {
//           padding: 13px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 10px;

//           background:
//             #FAFCFF;
//         }

//         .answer-item span {
//           display: block;

//           color:
//             var(--color-text-secondary);

//           font-size: 11px;

//           line-height: 1.4;

//           margin-bottom: 6px;
//         }

//         .answer-item strong {
//           display: block;

//           font-size: 13px;

//           color:
//             var(--color-text);
//         }

//         /* =========================
//            TIMELINE
//         ========================= */

//         .pr-timeline {
//           position: relative;

//           padding-left: 24px;
//         }

//         .pr-timeline::before {
//           content: "";

//           position: absolute;

//           left: 5px;

//           top: 5px;

//           bottom: 5px;

//           width: 1px;

//           background:
//             var(--color-border);
//         }

//         .pr-timeline-item {
//           position: relative;

//           padding:
//             0 0 22px 20px;
//         }

//         .pr-timeline-dot {
//           position: absolute;

//           left: -24px;

//           top: 4px;

//           width: 11px;
//           height: 11px;

//           border-radius: 50%;

//           background:
//             var(--color-primary);

//           border:
//             2px solid white;

//           box-shadow:
//             0 0 0 1px
//             var(--color-border);
//         }

//         .pr-timeline-top {
//           display: flex;

//           justify-content: space-between;

//           gap: 15px;

//           margin-bottom: 5px;
//         }

//         .pr-timeline-top strong {
//           font-size: 13px;
//         }

//         .pr-timeline-top span {
//           font-size: 10.5px;

//           color:
//             var(--color-text-secondary);

//           white-space: nowrap;
//         }

//         .pr-timeline-content p {
//           margin: 0;

//           font-size: 12px;

//           color:
//             var(--color-text-secondary);

//           line-height: 1.5;
//         }

//         /* =========================
//            RELIABILITY
//         ========================= */

//         .reliability-note {
//           margin-top: 20px;

//           padding: 12px 14px;

//           border-radius: 9px;

//           background:
//             #F7F9FC;

//           color:
//             var(--color-text-secondary);

//           font-size: 11.5px;

//           line-height: 1.5;
//         }

//         /* =========================
//            NOTES
//         ========================= */

//         .pr-notes {
//           display: grid;

//           grid-template-columns:
//             repeat(2, 1fr);

//           gap: 14px;
//         }

//         .pr-note {
//           padding: 15px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 10px;

//           background:
//             #FAFCFF;
//         }

//         .pr-note span {
//           display: block;

//           font-size: 10.5px;

//           text-transform:
//             uppercase;

//           letter-spacing:
//             0.06em;

//           font-weight: 700;

//           color:
//             var(--color-text-faint);

//           margin-bottom: 6px;
//         }

//         .pr-note p {
//           margin: 0;

//           font-size: 13px;

//           font-weight: 600;
//         }

//         /* =========================
//            PRIVACY
//         ========================= */

//         .pr-privacy {
//           margin-top: 28px;

//           padding: 16px 18px;

//           border:
//             1px solid var(--color-border);

//           border-radius: 12px;

//           background:
//             white;
//         }

//         .pr-privacy-title {
//           font-size: 12px;

//           font-weight: 800;

//           margin-bottom: 5px;
//         }

//         .pr-privacy p {
//           margin: 0;

//           color:
//             var(--color-text-secondary);

//           font-size: 11.5px;

//           line-height: 1.5;
//         }

//         /* =========================
//            RESPONSIVE
//         ========================= */

//         @media (max-width: 900px) {

//           .pr-navbar {
//             padding:
//               12px 16px;
//           }

//           .pr-doctor-block {
//             display: none;
//           }

//           .pr-main {
//             padding:
//               24px 16px 50px;
//           }

//           .pr-search-form {
//             flex-direction: column;

//             align-items: stretch;
//           }

//           .pr-stat-grid {
//             grid-template-columns:
//               repeat(2, 1fr);
//           }

//           .pr-info-grid {
//             grid-template-columns:
//               repeat(2, 1fr);
//           }

//           .pr-info-grid-single {
//             grid-template-columns:
//               1fr;
//           }

//           .pr-patient-header {
//             flex-direction: column;

//             align-items: flex-start;
//           }

//           .pr-patient-meta {
//             text-align: left;
//           }

//           .assessment-selector {
//             flex-direction: column;

//             align-items: stretch;
//           }

//           .answer-grid {
//             grid-template-columns: 1fr;
//           }

//           .pr-notes {
//             grid-template-columns: 1fr;
//           }

//         }

//         @media (max-width: 600px) {

//           .pr-dashboard-btn {
//             font-size: 0;
//           }

//           .pr-dashboard-btn svg {
//             width: 17px;
//             height: 17px;
//           }

//           .pr-app-name {
//             font-size: 14px;
//           }

//           .pr-stat-grid,
//           .pr-info-grid {
//             grid-template-columns: 1fr;
//           }

//           .selected-score-header {
//             flex-direction: column;

//             align-items: flex-start;
//           }

//           .selected-risk {
//             text-align: left;
//           }

//           .assessment-flags {
//             grid-template-columns: 1fr;
//           }

//           .pr-timeline-top {
//             flex-direction: column;

//             gap: 3px;
//           }
//             .patient-record-header {
//                 display: flex;
//                 align-items: center;
//                 justify-content: space-between;
//                 gap: 20px;
//                 margin-bottom: 24px;
//                 }
                
//                 }

//                 /* =========================
//    DOWNLOAD PDF BUTTON
// ========================= */

// .pdf-btn {
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;

//     margin-top: 14px;
//     padding: 11px 20px;

//     border: none;
//     border-radius: 9px;

//     background: #2C5CE0;
//     color: #ffffff;

//     font-family: 'Inter', -apple-system, BlinkMacSystemFont,
//         'Segoe UI', sans-serif;

//     font-size: 13px;
//     font-weight: 700;

//     cursor: pointer;

//     transition:
//         background 0.2s ease,
//         transform 0.2s ease,
//         box-shadow 0.2s ease;

//     box-shadow:
//         0 4px 10px rgba(44, 92, 224, 0.18);
// }

// .pdf-btn:hover {
//     background: #163B85;

//     transform: translateY(-1px);

//     box-shadow:
//         0 7px 16px rgba(44, 92, 224, 0.25);
// }

// .pdf-btn:active {
//     transform: translateY(0);
// }

// .pdf-btn:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//     transform: none;
//     box-shadow: none;
// }

//         }

//         .exercise-research-card { margin-top: 4px; }
//         .exercise-research-list { display: grid; gap: 14px; }
//         .exercise-research-item { display:flex; justify-content:space-between; gap:18px; padding:18px; border:1px solid #dfe7f1; border-radius:14px; background:#fbfdff; }
//         .exercise-research-main { display:flex; gap:12px; min-width:0; }
//         .exercise-research-icon { width:40px; height:40px; flex:0 0 40px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#edf3ff; color:#3869d7; font-weight:800; }
//         .exercise-research-main h3 { margin:0 0 5px; color:#173c64; font-size:16px; }
//         .exercise-research-main p { margin:0 0 9px; color:#6d8199; font-size:12px; line-height:1.45; }
//         .exercise-research-meta { display:flex; flex-wrap:wrap; gap:7px; }
//         .exercise-research-meta span { padding:5px 8px; border:1px solid #e1e8f1; border-radius:8px; background:#fff; color:#526b88; font-size:10px; }
//         .exercise-research-main small { display:block; margin-top:8px; color:#7a8ca3; font-size:10px; }
//         .exercise-research-actions { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
//         .exercise-research-status { padding:6px 9px; border-radius:20px; font-size:9px; font-weight:800; background:#fff4dc; color:#98691b; white-space:nowrap; }
//         .exercise-research-status.active { background:#e7f7ef; color:#277d50; }
//         .exercise-research-status.removed { background:#f5e8e8; color:#9a4141; }
//         .exercise-review-buttons { display:flex; gap:7px; }
//         .exercise-approve-btn, .exercise-remove-btn { border:0; border-radius:8px; padding:8px 11px; font-size:11px; font-weight:700; cursor:pointer; }
//         .exercise-approve-btn { background:#2f72d6; color:#fff; }
//         .exercise-remove-btn { background:#fff0f0; color:#a34444; border:1px solid #edcaca; }
//         .exercise-research-empty { display:flex; flex-direction:column; gap:5px; padding:25px; text-align:center; color:#74879e; }
//         .exercise-research-empty strong { color:#2a405f; }
//         @media(max-width:720px){ .exercise-research-item{flex-direction:column}.exercise-research-actions{align-items:flex-start}.exercise-review-buttons{width:100%}.exercise-approve-btn,.exercise-remove-btn{flex:1} }
//       `}
// </style>

//     </div>
//   );
// }






























import React, { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../apiClient";


export default function PatientResearch() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  // =========================================================
  // STATE
  // =========================================================

  const [patientId, setPatientId] = useState("");

  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState("");

  // =========================================================
  // G2-G4: SESSION HISTORY (our physiosessions collection, not theirs)
  // =========================================================
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  // =========================================================
  // MANUAL EXERCISE PRESCRIPTION
  // =========================================================
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [manualExercise, setManualExercise] = useState({
    exerciseId: "",
    exerciseName: "",
    category: "",
    type: "JOINT",
    joint: "",
    purpose: "",
    sets: 1,
    repetitionsOrDuration: "10-15",
    frequency: "3 times/week",
    doctorNote: "",
  });


  // =========================================================
  // DOCTOR
  // =========================================================

  const staffUser = JSON.parse(
    localStorage.getItem("staffUser") || "{}"
  );

  const doctorName =
    staffUser?.fullName || "Clinician";

  const roleName = staffUser?.role || "Clinician";


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


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {

    localStorage.removeItem("staffAuthToken");
    localStorage.removeItem("staffUser");
    localStorage.removeItem("professionalId");

    delete api.defaults.headers.common.Authorization;

    navigate("/doctor-login");
  };


  // =========================================================
  // SEARCH PATIENT
  // =========================================================

  const searchPatient = async (e, explicitPatientId = "") => {

    e?.preventDefault();

    const cleanPatientId =
      String(explicitPatientId || patientId).trim().toUpperCase();


    if (!cleanPatientId) {

      setError(
        "Please enter a Patient ID."
      );

      return;
    }


    setLoading(true);
    setError("");
    setPatient(null);
    setSelectedAssessmentId("");


    try {

      console.log(
        "================================="
      );

      console.log(
        "PATIENT RESEARCH"
      );

      console.log(
        "Searching:",
        cleanPatientId
      );

      console.log(
        "================================="
      );


      const response =
        await api.get(
          `/doctor/patient-research/${cleanPatientId}`
        );


      console.log(
        "Patient Research Response:",
        response.data
      );


      if (!response.data?.success) {

        throw new Error(
          response.data?.message ||
          "Unable to retrieve patient."
        );
      }


      setPatient(
        response.data
      );


      // =====================================================
      // AUTOMATICALLY SELECT LATEST ASSESSMENT
      // =====================================================

      const history =
        Array.isArray(
          response.data.assessmentHistory
        )
          ? response.data.assessmentHistory
          : [];


      if (history.length > 0) {

        const latest =
          history[
            history.length - 1
          ];


        setSelectedAssessmentId(
          String(
            latest.id ||
            latest._id ||
            ""
          )
        );
      }

    } catch (err) {

      console.error(
        "Patient research error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to find patient record."
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================================================
  // LOAD SAFE EXERCISE CATALOG FOR DOCTOR MANUAL PRESCRIPTION
  // =========================================================
  const loadExerciseCatalog = async () => {
    try {
      const token = localStorage.getItem("staffAuthToken");
      const response = await api.get(
        "/exercise-recommendations/doctor/exercise-catalog",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExerciseCatalog(response.data?.exercises || []);
    } catch (err) {
      console.error("Exercise catalog load error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load the exercise catalogue."
      );
    }
  };

  const openManualExercise = async () => {
    setShowAddExercise(true);
    if (exerciseCatalog.length === 0) {
      await loadExerciseCatalog();
    }
  };

  const handleManualExerciseChange = (field, value) => {
    setManualExercise((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleExerciseSelection = (exerciseId) => {
    const selected = exerciseCatalog.find(
      (item) => item.exerciseId === exerciseId
    );

    if (!selected) {
      setManualExercise((current) => ({
        ...current,
        exerciseId: "",
        exerciseName: "",
        category: "",
        type: "JOINT",
        joint: "",
        purpose: "",
      }));
      return;
    }

    setManualExercise((current) => ({
      ...current,
      exerciseId: selected.exerciseId,
      exerciseName: selected.exerciseName,
      category: selected.category,
      type: selected.joint ? "JOINT" : "GENERAL",
      joint: selected.joint || "",
      purpose: selected.purpose || "Doctor-selected exercise",
    }));
  };

  const addManualExercise = async () => {
    const targetPatientId = String(
      profile?.patientId || patientId || ""
    ).trim().toUpperCase();

    if (!targetPatientId) {
      setError("Search for a patient before adding an exercise.");
      return;
    }

    if (!manualExercise.exerciseId) {
      setError("Please select an exercise.");
      return;
    }

    try {
      setAddingExercise(true);
      setError("");

      const token = localStorage.getItem("staffAuthToken");

      await api.post(
        `/exercise-recommendations/doctor/patient/${targetPatientId}/add`,
        manualExercise,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setManualExercise({
        exerciseId: "",
        exerciseName: "",
        category: "",
        type: "JOINT",
        joint: "",
        purpose: "",
        sets: 1,
        repetitionsOrDuration: "10-15",
        frequency: "3 times/week",
        doctorNote: "",
      });

      setShowAddExercise(false);

      // Reload the complete Patient Research record so the new
      // doctor-prescribed exercise immediately appears here.
      await searchPatient(undefined, targetPatientId);
    } catch (err) {
      console.error("Manual exercise add error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to add exercise to the patient's plan."
      );
    } finally {
      setAddingExercise(false);
    }
  };

  // =========================================================
  // OPEN DIRECTLY FROM DOCTOR DASHBOARD
  // /doctor/patient-research?patientId=PAT123
  // =========================================================
  useEffect(() => {
    const requestedPatientId =
      searchParams.get("patientId");

    if (!requestedPatientId) return;

    const cleanRequestedId =
      requestedPatientId.trim().toUpperCase();

    setPatientId(cleanRequestedId);

    searchPatient(undefined, cleanRequestedId);
    // The URL is the trigger; searchPatient is intentionally called once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  // =========================================================
// DOWNLOAD PATIENT PDF
// =========================================================

const downloadPatientPDF = async () => {
  const cleanPatientId =
    patientId.trim().toUpperCase();

  if (!cleanPatientId) {
    setError(
      "Search for a patient before downloading the record."
    );
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await api.get(
      `/doctor/patient-research/${cleanPatientId}/pdf`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob(
      [response.data],
      {
        type: "application/pdf",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `Patient_Record_${cleanPatientId}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(
      "Patient PDF download error:",
      err
    );

    setError(
      "Unable to download the patient record."
    );
  } finally {
    setLoading(false);
  }
};


  // =========================================================
  // HELPERS
  // =========================================================

  const value = (
    v,
    fallback = "Not available"
  ) => {

    if (
      v === null ||
      v === undefined ||
      v === ""
    ) {
      return fallback;
    }

    return v;
  };


  const formatDate = (date) => {

    if (!date) {
      return "Not available";
    }


    const d =
      new Date(date);


    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return "Not available";
    }


    return d.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  const formatDateTime = (date) => {

    if (!date) {
      return "Not available";
    }


    const d =
      new Date(date);


    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return "Not available";
    }


    return d.toLocaleString(
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


  const formatBoolean = (v) => {

    if (v === true) {
      return "Yes";
    }

    if (v === false) {
      return "No";
    }

    return "Not available";
  };


  const formatAnswer = (answer) => {

    if (Array.isArray(answer)) {

      return answer.length
        ? answer.join(", ")
        : "Not answered";
    }


    if (
      typeof answer === "boolean"
    ) {

      return answer
        ? "Yes"
        : "No";
    }


    if (
      answer === null ||
      answer === undefined ||
      answer === ""
    ) {

      return "Not answered";
    }


    return String(answer);
  };


  // =========================================================
  // RESPONSE DATA
  // =========================================================

  const data =
    patient || {};


  const profile =
    data.patient || {};

  // =========================================================
  // G2-G4: fetch our session history + report whenever a new patient loads.
  // profile.patientId (PATxxxxxx) is all this response carries -- their
  // Express route has no ObjectId field -- and history.py (our route)
  // resolves it via a read-only patientprofiles lookup. Authorization is
  // still enforced there (G2-B6): this fetch merely asks, it does not grant.
  // ponytail: re-runs on every render that changes profile.patientId, not
  // memoized further -- one patient card open at a time, not a hot loop.
  useEffect(() => {
    const pid = profile.patientId;
    if (!pid) {
      setPastSessions([]);
      return;
    }
    const token = localStorage.getItem("staffAuthToken");
    setSessionsLoading(true);
    setSessionsError("");
    fetch(`/engine/patients/${encodeURIComponent(pid)}/sessions?limit=20`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((d) => setPastSessions(Array.isArray(d?.sessions) ? d.sessions : []))
      .catch((err) => {
        console.error("[PATIENT RESEARCH] session history fetch failed:", err);
        setPastSessions([]);
        setSessionsError("error");
      })
      .finally(() => setSessionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.patientId]);


  const hemophilia =
    data.hemophilia || {};


  const contact =
    data.contact || {};


  const emergencyContact =
    data.emergencyContact || {};


  const careTeam =
    data.careTeam || {};


  const familyGeneticHistory =
    data.familyGeneticHistory || {};


  const bleedingHistory =
    data.bleedingHistory || {};


  const treatment =
    data.treatment || {};


  const statistics =
    data.statistics || {};


  const timeline =
    Array.isArray(data.timeline)
      ? data.timeline
      : [];

  const exerciseRecommendations =
    Array.isArray(data.exerciseRecommendations)
      ? data.exerciseRecommendations
      : [];

  const activeExercises =
    exerciseRecommendations.filter(
      (item) => item.status === "ACTIVE"
    );

  const pendingExercises =
    exerciseRecommendations.filter(
      (item) => item.status === "PENDING_DOCTOR_REVIEW"
    );


  // =========================================================
  // ASSESSMENT HISTORY
  // =========================================================

  const assessmentHistory =
    Array.isArray(
      data.assessmentHistory
    )
      ? data.assessmentHistory
      : [];


  // =========================================================
  // ASSESSMENT GRAPH
  // =========================================================

  const assessmentChartData =
    useMemo(() => {

      return assessmentHistory.map(
        (assessment, index) => ({

          assessmentNumber:
            assessment.assessmentNumber ??
            index + 1,

          assessmentId:
            assessment.id ||
            assessment._id ||
            index,

          score:
            Number(
              assessment.score ??
              0
            ),

          riskLevel:
            assessment.riskLevel ||
            "Unknown",

          date:
            assessment.date ||
            assessment.createdAt,

          displayDate:
            formatDate(
              assessment.date ||
              assessment.createdAt
            ),
        })
      );

    }, [assessmentHistory]);


  // =========================================================
  // SELECTED ASSESSMENT
  // =========================================================

  const selectedAssessment =
    useMemo(() => {

      if (
        assessmentHistory.length === 0
      ) {
        return null;
      }


      if (!selectedAssessmentId) {

        return (
          assessmentHistory[
            assessmentHistory.length - 1
          ]
        );
      }


      return (
        assessmentHistory.find(
          (assessment) =>
            String(
              assessment.id ||
              assessment._id
            ) ===
            String(
              selectedAssessmentId
            )
        ) ||
        assessmentHistory[
          assessmentHistory.length - 1
        ]
      );

    }, [
      assessmentHistory,
      selectedAssessmentId,
    ]);


  // =========================================================
  // SELECTED ASSESSMENT ANSWERS
  // =========================================================
  //
  // IMPORTANT:
  //
  // We ONLY display the answers stored inside
  // this particular Assessment.
  //
  // We DO NOT calculate a new score.
  //
  // =========================================================

  const selectedAnswers =
    useMemo(() => {

      if (!selectedAssessment) {
        return [];
      }


      if (
        Array.isArray(
          selectedAssessment.answers
        )
      ) {

        return selectedAssessment.answers
          .filter(
            (item) =>
              item &&
              item.question
          )
          .map(
            (item, index) => ({

              id:
                index,

              question:
                item.question,

              answer:
                formatAnswer(
                  item.answer
                ),
            })
          );
      }


      return [];

    }, [selectedAssessment]);


  // =========================================================
  // SELECTED ASSESSMENT EXPLANATION
  // =========================================================

  const selectedExplanation =
    useMemo(() => {

      if (!selectedAssessment) {
        return [];
      }


      if (
        Array.isArray(
          selectedAssessment.explanation
        )
      ) {

        return selectedAssessment
          .explanation
          .filter(Boolean);
      }


      if (
        selectedAssessment.summaryText
      ) {

        return String(
          selectedAssessment.summaryText
        )
          .split("\n")
          .map(
            (x) => x.trim()
          )
          .filter(Boolean);
      }


      return [];

    }, [selectedAssessment]);


  // =========================================================
  // SELECTED ASSESSMENT FACTORS
  // =========================================================

  const selectedFactors =
    selectedAssessment?.factors || {};


  // =========================================================
  // STATUS BADGE
  // =========================================================

  const StatusBadge = ({
    text,
  }) => {

    const normalized =
      String(
        text || ""
      ).toLowerCase();


    let className =
      "pr-status";


    if (
      normalized.includes(
        "emergency"
      ) ||
      normalized.includes(
        "high"
      )
    ) {

      className +=
        " pr-status-danger";

    } else if (
      normalized.includes(
        "moderate"
      )
    ) {

      className +=
        " pr-status-warning";

    } else if (
      normalized.includes(
        "low"
      )
    ) {

      className +=
        " pr-status-safe";
    }


    return (
      <span
        className={className}
      >
        {value(text)}
      </span>
    );
  };


  // =========================================================
  // SECTION HEADER
  // =========================================================

  const SectionHeader = ({
    eyebrow,
    title,
    description,
  }) => (

    <div className="pr-section-header">

      <div className="pr-section-header-top">

        {eyebrow && (
          <span className="pr-section-eyebrow">
            {eyebrow}
          </span>
        )}

        <svg
          className="pr-pulse-line"
          viewBox="0 0 120 24"
          preserveAspectRatio="none"
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


      <h2 className="pr-section-title">
        {title}
      </h2>


      {description && (
        <p className="pr-section-description">
          {description}
        </p>
      )}

    </div>
  );


  // =========================================================
  // INFO CARD
  // =========================================================

  const InfoCard = ({
    label,
    value: cardValue,
  }) => (

    <div className="pr-info-item">

      <span className="pr-info-label">
        {label}
      </span>

      <span className="pr-info-value">
        {value(cardValue)}
      </span>

    </div>
  );


  // =========================================================
  // EMPTY STATE
  // =========================================================

  const EmptyState = ({
    text,
  }) => (

    <div className="pr-empty">

      <div className="pr-empty-line" />

      <p>
        {text}
      </p>

    </div>
  );


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div className="pr-root">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="pr-navbar">

        <div className="pr-navbar-left">

          <div className="pr-logo-mark">

            <svg
              viewBox="0 0 24 24"
              fill="none"
            >

              <path
                d="M12 3v18M3 12h18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

            </svg>

          </div>


          <span className="pr-app-name">
            Hemophilia Care
          </span>

        </div>


        <div className="pr-navbar-right">

          <button
            className="pr-dashboard-btn"
            onClick={() =>
              navigate(
                "/doctor-dashboard"
              )
            }
            type="button"
          >

            Dashboard

          </button>


          <div className="pr-doctor-block">

            <div className="pr-avatar">
              {initials}
            </div>


            <div>

              <div className="pr-doctor-name">
                {doctorName}
              </div>

              <div className="pr-doctor-role">
                {roleName}
              </div>

            </div>

          </div>


          <button
            className="pr-logout-btn"
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="pr-main">

        <div className="pr-page-header">

          <h1 className="pr-title">
            Patient Research
          </h1>

          <p className="pr-subtitle">
            Search and review the complete
            clinical history of an individual
            patient.
          </p>

        </div>


        {/* =====================================================
            SEARCH
        ===================================================== */}

        <section className="pr-search-card">

          <div className="pr-search-heading">

            <span className="pr-search-eyebrow">
              Patient Lookup
            </span>

            <h2>
              Search Patient Record
            </h2>

            <p>
              Enter the patient's registered
              Patient ID to retrieve their
              clinical information.
            </p>

            

          </div>


          <form
            className="pr-search-form"
            onSubmit={searchPatient}
          >

            <div className="pr-input-wrapper">

              <label htmlFor="patientId">
                Patient ID
              </label>

              <input
                id="patientId"
                type="text"
                value={patientId}
                onChange={(e) =>
                  setPatientId(
                    e.target.value
                  )
                }
                placeholder="Enter Patient ID"
                autoComplete="off"
              />

            </div>


            <button
              className="pr-search-btn"
              type="submit"
              disabled={loading}
            >

              {loading
                ? "Searching..."
                : "Search Patient"}

            </button>

          </form>

          <button
                type="button"
                className="pdf-btn"
                onClick={downloadPatientPDF}
                disabled={loading}
            >
                {loading
                ? "Generating PDF..."
                : "Download Patient Record"}
            </button>


          {error && (
            <div className="pr-error">
              {error}
            </div>
          )}

        </section>


        {/* =====================================================
            INITIAL STATE
        ===================================================== */}

        {!patient &&
          !loading &&
          !error && (

            <div className="pr-initial-state">

              <h3>
                Search for a patient
              </h3>

              <p>
                Enter a valid Patient ID above
                to view the patient's clinical
                record.
              </p>

            </div>
          )}


        {/* =====================================================
            PATIENT RECORD
        ===================================================== */}

        {patient && (

          <div className="pr-record">

            {/* =================================================
                PATIENT HEADER
            ================================================= */}

            <div className="pr-patient-header">

              <div className="pr-patient-identity">

                <div className="pr-patient-avatar">

                  {String(
                    value(
                      profile.fullName,
                      "P"
                    )
                  )
                    .split(" ")
                    .map(
                      (x) => x[0]
                    )
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}

                </div>


                <div>

                  <span className="pr-record-label">
                    Patient Record
                  </span>

                  <h2>
                    {value(
                      profile.fullName
                    )}
                  </h2>

                  <p>
                    Patient ID:{" "}
                    <strong>
                      {value(
                        profile.patientId ||
                        patientId
                      )}
                    </strong>
                  </p>

                </div>

              </div>


              <div className="pr-patient-meta">

                <span>
                  Record Status
                </span>

                <strong className="pr-active">
                  Active
                </strong>

              </div>

            </div>


            {/* =================================================
                PATIENT SUMMARY
            ================================================= */}

            <SectionHeader
              eyebrow="Clinical Overview"
              title="Patient Summary"
              description="A concise overview compiled from the patient's stored clinical records."
            />


            <div className="pr-stat-grid">

              <div className="pr-stat-card">

                <span>
                  Hemophilia Type
                </span>

                <strong>
                  {value(
                    hemophilia.type
                  )}
                </strong>

              </div>


              <div className="pr-stat-card">

                <span>
                  Severity
                </span>

                <strong>
                  {value(
                    hemophilia.severity
                  )}
                </strong>

              </div>


              <div className="pr-stat-card">

                <span>
                  Latest Risk
                </span>

                <strong>

                  <StatusBadge
                    text={
                      selectedAssessment?.riskLevel ||
                      "Not available"
                    }
                  />

                </strong>

              </div>


              <div className="pr-stat-card">

                <span>
                  Assessments
                </span>

                <strong>
                  {statistics.totalAssessments ??
                    assessmentHistory.length}
                </strong>

              </div>

            </div>


            {/* =================================================
                EXERCISE RECOMMENDATIONS
                Full exercise record belongs inside Patient Research.
            ================================================= */}

            <SectionHeader
              eyebrow="Personalised Rehabilitation"
              title="Exercise Recommendations"
              description="Review ML predictions and explicitly prescribe additional exercises when needed."
            />

            <div className="pr-card exercise-research-card">
              <div className="doctor-exercise-toolbar">
                <div>
                  <strong>Doctor-controlled exercise plan</strong>
                  <span>ML recommendations require approval. Doctor-added exercises become active immediately.</span>
                </div>
                <button
                  type="button"
                  className="doctor-add-exercise-btn"
                  onClick={openManualExercise}
                >
                  Add Exercise
                </button>
              </div>

              {showAddExercise && (
                <div className="doctor-add-exercise-panel">
                  <div className="doctor-add-exercise-head">
                    <div>
                      <strong>Add exercise to patient plan</strong>
                      <span>This exercise will be saved as ACTIVE and will appear in the patient's My Exercise Plan.</span>
                    </div>
                    <button
                      type="button"
                      className="doctor-add-close"
                      onClick={() => setShowAddExercise(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="doctor-exercise-form-grid">
                    <label>
                      <span>Exercise</span>
                      <select
                        value={manualExercise.exerciseId}
                        onChange={(e) => handleExerciseSelection(e.target.value)}
                      >
                        <option value="">Select exercise</option>
                        {exerciseCatalog.map((exercise) => (
                          <option key={exercise.exerciseId} value={exercise.exerciseId}>
                            {exercise.exerciseName} — {exercise.category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Type</span>
                      <select
                        value={manualExercise.type}
                        onChange={(e) => handleManualExerciseChange("type", e.target.value)}
                      >
                        <option value="JOINT">Joint-specific</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </label>

                    <label>
                      <span>Joint</span>
                      <select
                        value={manualExercise.joint}
                        onChange={(e) => handleManualExerciseChange("joint", e.target.value)}
                        disabled={manualExercise.type === "GENERAL"}
                      >
                        <option value="">No specific joint</option>
                        <option value="knee">Knee</option>
                        <option value="ankle">Ankle</option>
                        <option value="elbow">Elbow</option>
                        <option value="shoulder">Shoulder</option>
                        <option value="hip">Hip</option>
                        <option value="wrist">Wrist</option>
                      </select>
                    </label>

                    <label>
                      <span>Sets</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={manualExercise.sets}
                        onChange={(e) => handleManualExerciseChange("sets", e.target.value)}
                      />
                    </label>

                    <label>
                      <span>Reps / Duration</span>
                      <input
                        type="text"
                        value={manualExercise.repetitionsOrDuration}
                        onChange={(e) => handleManualExerciseChange("repetitionsOrDuration", e.target.value)}
                        placeholder="10-15 or 5 minutes"
                      />
                    </label>

                    <label>
                      <span>Frequency</span>
                      <input
                        type="text"
                        value={manualExercise.frequency}
                        onChange={(e) => handleManualExerciseChange("frequency", e.target.value)}
                        placeholder="3 times/week"
                      />
                    </label>

                    <label className="doctor-form-wide">
                      <span>Purpose</span>
                      <input
                        type="text"
                        value={manualExercise.purpose}
                        onChange={(e) => handleManualExerciseChange("purpose", e.target.value)}
                        placeholder="Purpose of the exercise"
                      />
                    </label>

                    <label className="doctor-form-wide">
                      <span>Doctor Note</span>
                      <textarea
                        value={manualExercise.doctorNote}
                        onChange={(e) => handleManualExerciseChange("doctorNote", e.target.value)}
                        placeholder="Optional note for this prescription"
                        rows="3"
                      />
                    </label>
                  </div>

                  <div className="doctor-add-actions">
                    <button
                      type="button"
                      className="doctor-cancel-btn"
                      onClick={() => setShowAddExercise(false)}
                      disabled={addingExercise}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="doctor-save-exercise-btn"
                      onClick={addManualExercise}
                      disabled={addingExercise || !manualExercise.exerciseId}
                    >
                      {addingExercise ? "Adding…" : "Add to Patient Plan"}
                    </button>
                  </div>
                </div>
              )}

              {exerciseRecommendations.length === 0 ? (
                <div className="exercise-research-empty">
                  <strong>No exercise recommendations recorded.</strong>
                  <span>Use Add Exercise to explicitly prescribe an exercise for this patient.</span>
                </div>
              ) : (
                <div className="exercise-research-list">
                  {exerciseRecommendations.map((item) => (
                    <div className="exercise-research-item" key={String(item._id)}>
                      <div className="exercise-research-main">
                        <div className="exercise-research-icon">✦</div>
                        <div>
                          <h3>{item.exerciseName || "Exercise"}</h3>
                          <p>{item.purpose || "Personalised rehabilitation exercise."}</p>
                          <div className="exercise-research-meta">
                            <span>{item.joint ? `Joint: ${item.joint}` : `Category: ${item.category || "General"}`}</span>
                            <span>{item.sets ?? "—"} sets</span>
                            <span>{item.repetitionsOrDuration || "—"}</span>
                            <span>{item.frequency || "As advised"}</span>
                            <span>{item.source === "DOCTOR" ? "Doctor prescribed" : "ML prediction"}</span>
                          </div>
                          {item.mlConfidence != null && (
                            <small>ML confidence: {Math.round(Number(item.mlConfidence) * 100)}%</small>
                          )}
                        </div>
                      </div>

                      <div className="exercise-research-actions">
                        <span className={`exercise-research-status ${item.status === "ACTIVE" ? "active" : item.status === "REMOVED" ? "removed" : "pending"}`}>
                          {item.status === "ACTIVE" ? "ACTIVE" : item.status === "REMOVED" ? "REMOVED" : "PENDING REVIEW"}
                        </span>

                        {item.status === "PENDING_DOCTOR_REVIEW" && (
                          <div className="exercise-review-buttons">
                            <button
                              type="button"
                              className="exercise-approve-btn"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("staffAuthToken");
                                  await api.post(
                                    `/exercise-recommendations/doctor/${item._id}/approve`,
                                    {},
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  await searchPatient(undefined, profile.patientId || patientId);
                                } catch (err) {
                                  setError(err.response?.data?.message || "Unable to approve exercise.");
                                }
                              }}
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="exercise-remove-btn"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("staffAuthToken");
                                  await api.post(
                                    `/exercise-recommendations/doctor/${item._id}/remove`,
                                    {},
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  await searchPatient(undefined, profile.patientId || patientId);
                                } catch (err) {
                                  setError(err.response?.data?.message || "Unable to remove exercise.");
                                }
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* =================================================
                G2-G4: SESSION HISTORY -- our physiosessions collection.
                Doctor portal has no language toggle anywhere else in this
                file (unlike the patient-facing ExercisePlan.jsx) -- kept
                English-only here to match, not translated to three
                languages (G2-G5 is about the PATIENT experience; the
                report TEXT itself carries the session's own language,
                G2-G6, and is rendered as-is below regardless).

                Coaching-narrative framing only (§8): "Coaching notes", never
                "Diagnosis" or "Assessment" -- this is prose Gemini wrote
                about rule-based rep data, not a model's clinical verdict.
            ================================================= */}

            <SectionHeader
              eyebrow="Rehabilitation Sessions"
              title="Session History"
              description="Live camera-assessed sessions and their coaching notes. Not a diagnostic assessment."
            />

            <div className="pr-card exercise-research-card">
              {sessionsLoading ? (
                <div className="exercise-research-empty">
                  <strong>Loading session history…</strong>
                </div>
              ) : sessionsError ? (
                <div className="exercise-research-empty">
                  <strong>Unable to load session history.</strong>
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="exercise-research-empty">
                  <strong>No sessions recorded yet.</strong>
                  <span>This patient has not run a camera-assessed exercise session.</span>
                </div>
              ) : (
                <div className="exercise-research-list">
                  {pastSessions.map((s) => (
                    <SessionHistoryItem key={s.sessionId} session={s} />
                  ))}
                </div>
              )}
            </div>

            {/* D29 TEMPORARY -- 2026-09-22 demo; unscoped Flask surface via /emg/, revert after */}

            <SectionHeader
              eyebrow="Muscle Activity"
              title="EMG Recordings"
              description="Recorded EMG sessions and their dashboard, served by the EMG service."
            />

            <div className="pr-card exercise-research-card">
              {/* D29 TEMPORARY -- 2026-09-22 demo; open the Flask EMG pages directly (no iframe), loopback only. */}
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <a className="pr-btn" href="http://127.0.0.1:5000/progress.html" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"10px 18px",borderRadius:10,background:"#1d4ed8",color:"#fff",textDecoration:"none",fontWeight:600}}>Open EMG dashboard</a>
                <a className="pr-btn" href="http://127.0.0.1:5000/history.html" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"10px 18px",borderRadius:10,background:"#1d4ed8",color:"#fff",textDecoration:"none",fontWeight:600}}>Open EMG recordings</a>
              </div>
            </div>

            {/* =================================================
                DEMOGRAPHICS
            ================================================= */}

            <SectionHeader
              eyebrow="Demographics"
              title="Patient Information"
              description="Basic demographic information registered for this patient."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Full Name"
                  value={
                    profile.fullName
                  }
                />

                <InfoCard
                  label="Patient ID"
                  value={
                    profile.patientId
                  }
                />

                <InfoCard
                  label="Gender"
                  value={
                    profile.gender
                  }
                />

                <InfoCard
                  label="Age"
                  value={
                    profile.age
                  }
                />

                <InfoCard
                  label="Date of Birth"
                  value={
                    formatDate(
                      profile.dateOfBirth
                    )
                  }
                />

                <InfoCard
                  label="Blood Group"
                  value={
                    profile.bloodGroup
                  }
                />

                <InfoCard
                  label="City"
                  value={
                    profile.city
                  }
                />

                <InfoCard
                  label="State"
                  value={
                    profile.state
                  }
                />

                <InfoCard
                  label="PIN Code"
                  value={
                    profile.pinCode
                  }
                />

              </div>

            </div>


            {/* =================================================
                CONTACT
            ================================================= */}

            <SectionHeader
              eyebrow="Contact"
              title="Patient Contact Information"
              description="Contact information available in the authenticated clinical record."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Mobile"
                  value={
                    contact.mobile
                  }
                />

                <InfoCard
                  label="Alternate Contact"
                  value={
                    contact.alternateContact
                  }
                />

                <InfoCard
                  label="Email"
                  value={
                    contact.email
                  }
                />

                

                <InfoCard
                  label="City"
                  value={
                    contact.city
                  }
                />

                <InfoCard
                  label="State"
                  value={
                    contact.state
                  }
                />

                <InfoCard
                  label="PIN Code"
                  value={
                    contact.pinCode
                  }
                />

              </div>

            </div>


            {/* =================================================
                HEMOPHILIA
            ================================================= */}

            <SectionHeader
              eyebrow="Hemophilia Profile"
              title="Disease Information"
              description="Clinical information related to the patient's hemophilia diagnosis and management."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Hemophilia Type"
                  value={
                    hemophilia.type
                  }
                />

                <InfoCard
                  label="Severity"
                  value={
                    hemophilia.severity
                  }
                />

                <InfoCard
                  label="Age at Diagnosis"
                  value={
                    hemophilia.ageAtDiagnosis
                  }
                />

                <InfoCard
                  label="Family History"
                  value={
                    familyGeneticHistory.familyHistory
                  }
                />

                

                <InfoCard
                  label="Factor Therapy"
                  value={
                    hemophilia.currentFactorTherapy
                  }
                />

                <InfoCard
                  label="Other Medications"
                  value={
                    hemophilia.otherMedications
                  }
                />

                <InfoCard
                  label="Bleed Frequency"
                  value={
                    hemophilia.bleedFrequency
                  }
                />

                <InfoCard
                  label="Last Bleed"
                  value={
                    formatDate(
                      hemophilia.lastBleedDate
                    )
                  }
                />

                <InfoCard
                  label="Physiotherapy"
                  value={
                    formatBoolean(
                      hemophilia.underPhysiotherapy
                    )
                  }
                />
                <InfoCard
                  label="Male Relative Flag"
                  value={
                    formatBoolean(
                      familyGeneticHistory.maleRelativeFlag
                    )
                  }
                />

              </div>

            </div>


            {/* =================================================
                FAMILY / GENETIC
            ================================================= */}

            {/* <SectionHeader
              eyebrow="Family & Genetics"
              title="Family Genetic History"
              description="Family-history and genetic-testing information recorded in the clinical system."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Family History"
                  value={
                    familyGeneticHistory.familyHistory
                  }
                />

                <InfoCard
                  label="Genetic Testing Done"
                  value={
                    familyGeneticHistory.geneticTestingDone
                  }
                />

                <InfoCard
                  label="Previous Testing"
                  value={
                    familyGeneticHistory.previousTesting
                  }
                />

                <InfoCard
                  label="Low Factor History"
                  value={
                    familyGeneticHistory.factorLow
                  }
                />

                <InfoCard
                  label="Male Relative Flag"
                  value={
                    formatBoolean(
                      familyGeneticHistory.maleRelativeFlag
                    )
                  }
                />

              </div>

            </div> */}


            {/* =================================================
                BLEEDING HISTORY
            ================================================= */}

            <SectionHeader
              eyebrow="Bleeding History"
              title="Bleeding Profile"
              description="Bleeding information recorded in the patient's clinical history."
            />


            <div className="pr-stat-grid">

              <div className="pr-stat-card">

                <span>
                  Bleed Frequency
                </span>

                <strong>
                  {value(
                    bleedingHistory.bleedFrequency ||
                    hemophilia.bleedFrequency
                  )}
                </strong>

              </div>


              <div className="pr-stat-card">

                <span>
                  Last Bleeding Event
                </span>

                <strong>
                  {formatDate(
                    bleedingHistory.lastBleedDate ||
                    hemophilia.lastBleedDate
                  )}
                </strong>

              </div>


              <div className="pr-stat-card">

                <span>
                  Affected Joints
                </span>

                <strong>
                  {
                    Array.isArray(
                      bleedingHistory.jointsAffected
                    )
                      ? bleedingHistory
                          .jointsAffected
                          .length
                      : 0
                  }
                </strong>

              </div>

            </div>


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Minor-cut Bleeding"
                  value={
                    bleedingHistory.bleedingAfterMinorCuts
                  }
                />

                <InfoCard
                  label="Dental / Surgery Bleeding"
                  value={
                    bleedingHistory.dentalSurgeryBleeding
                  }
                />

                <InfoCard
                  label="Bruising"
                  value={
                    bleedingHistory.bruising
                  }
                />

                <InfoCard
                  label="Muscle Swelling"
                  value={
                    bleedingHistory.muscleSwelling
                  }
                />

                <InfoCard
                  label="Joint Swelling"
                  value={
                    bleedingHistory.jointSwelling
                  }
                />

                <InfoCard
                  label="Blood in Urine / Stool"
                  value={
                    bleedingHistory.bloodUrineStool
                  }
                />

              </div>

            </div>


            {/* =================================================
                JOINT HEALTH
            ================================================= */}

            <SectionHeader
              eyebrow="Musculoskeletal"
              title="Joint Health"
              description="Joints recorded as affected in the patient's clinical history."
            />


            <div className="pr-card">

              {Array.isArray(
                bleedingHistory.jointsAffected
              ) &&
              bleedingHistory
                .jointsAffected
                .length > 0 ? (

                <div className="pr-joint-grid">

                  {bleedingHistory
                    .jointsAffected
                    .map(
                      (joint, index) => (

                        <div
                          className="pr-joint"
                          key={index}
                        >
                          {joint}
                        </div>

                      )
                    )}

                </div>

              ) : (

                <EmptyState
                  text="No affected joints recorded."
                />

              )}


              <div className="pr-info-grid">

                <InfoCard
                  label="Target Joint"
                  value={
                    bleedingHistory.targetJoint ||
                    hemophilia.targetJoint
                  }
                />

              </div>

            </div>


            {/* =================================================
                TREATMENT
            ================================================= */}

            <SectionHeader
              eyebrow="Treatment"
              title="Treatment & Therapy"
              description="Current treatment information available in the patient's record."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Factor Therapy"
                  value={
                    treatment.currentFactorTherapy
                  }
                />

                <InfoCard
                  label="Other Medications"
                  value={
                    treatment.otherMedications
                  }
                />

                <InfoCard
                  label="Physiotherapy"
                  value={
                    formatBoolean(
                      treatment.underPhysiotherapy
                    )
                  }
                />

                <InfoCard
                  label="Mobility Limitation"
                  value={
                    treatment.mobilityLimitation
                  }
                />

                <InfoCard
                  label="Assistive Devices"
                  value={
                    treatment.assistiveDevices
                  }
                />

              </div>

            </div>


            {/* =================================================
                ASSESSMENT GRAPH
            ================================================= */}

            <SectionHeader
              eyebrow="Assessment Analytics"
              title="Assessment Risk Trend"
              description="Every point represents one stored clinical assessment."
            />


            <div className="pr-card">

              {assessmentChartData.length > 0 ? (

                <div className="pr-chart">

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >

                    <LineChart
                      data={
                        assessmentChartData
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="assessmentNumber"
                        tickFormatter={(v) =>
                          `A${v}`
                        }
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip
                        formatter={(
                          value,
                          name
                        ) => {

                          if (
                            name ===
                            "score"
                          ) {

                            return [
                              value,
                              "Score",
                            ];
                          }

                          return [
                            value,
                            name,
                          ];
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2C5CE0"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                        }}
                        activeDot={{
                          r: 7,
                        }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              ) : (

                <EmptyState
                  text="No assessment scores available."
                />

              )}

            </div>


            {/* =================================================
                ASSESSMENT REVIEW
            ================================================= */}

            <SectionHeader
              eyebrow="Assessment Review"
              title="Assessment History & Explanation"
              description="Select any assessment to see the exact answers, score, risk level and explanation stored for that assessment."
            />


            <div className="pr-card">

              {assessmentHistory.length > 0 ? (

                <>

                  {/* =========================================
                      SELECT
                  ========================================= */}

                  <div className="assessment-selector">

                    <label htmlFor="assessmentSelect">
                      Select Assessment
                    </label>


                    <select
                      id="assessmentSelect"
                      value={
                        selectedAssessmentId
                      }
                      onChange={(e) =>
                        setSelectedAssessmentId(
                          e.target.value
                        )
                      }
                    >

                      {assessmentHistory.map(
                        (
                          assessment,
                          index
                        ) => (

                          <option
                            key={
                              assessment.id ||
                              assessment._id ||
                              index
                            }
                            value={String(
                              assessment.id ||
                              assessment._id ||
                              ""
                            )}
                          >

                            Assessment{" "}
                            {assessment.assessmentNumber ??
                              index + 1}

                            {" — Score "}
                            {assessment.score ?? 0}

                            {" — "}
                            {assessment.riskLevel ||
                              "Unknown"}

                            {" — "}
                            {formatDate(
                              assessment.date ||
                              assessment.createdAt
                            )}

                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* =========================================
                      SELECTED ASSESSMENT
                  ========================================= */}

                  {selectedAssessment && (

                    <div className="selected-assessment">

                      {/* SCORE */}

                      <div className="selected-score-header">

                        <div>

                          <span>
                            Assessment{" "}
                            {selectedAssessment.assessmentNumber}
                          </span>


                          <h3>
                            Score{" "}
                            {value(
                              selectedAssessment.score
                            )}
                          </h3>


                          <p>
                            Recorded on{" "}
                            {formatDateTime(
                              selectedAssessment.date ||
                              selectedAssessment.createdAt
                            )}
                          </p>

                        </div>


                        <div className="selected-risk">

                          <span>
                            Risk Level
                          </span>

                          <StatusBadge
                            text={
                              selectedAssessment.riskLevel
                            }
                          />

                        </div>

                      </div>


                      {/* FLAGS */}

                      <div className="assessment-flags">

                        <div>

                          <span>
                            Emergency Symptoms
                          </span>

                          <strong>
                            {formatBoolean(
                              selectedAssessment.emergencyFlag
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Strong Suspicion
                          </span>

                          <strong>
                            {formatBoolean(
                              selectedAssessment.strongSuspicionFlag
                            )}
                          </strong>

                        </div>

                      </div>


                      {/* SUMMARY */}

                      {selectedAssessment.summaryText && (

                        <div className="assessment-summary">

                          <div className="assessment-box-title">
                            Assessment Summary
                          </div>

                          <p>
                            {
                              selectedAssessment.summaryText
                            }
                          </p>

                        </div>

                      )}


                      {/* =======================================
                          EXPLANATION
                      ======================================= */}

                      <div className="assessment-explanation">

                        <div className="assessment-box-title">
                          Why this assessment produced this result
                        </div>


                        {selectedExplanation.length > 0 ? (

                          <div className="explanation-list">

                            {selectedExplanation.map(
                              (
                                explanation,
                                index
                              ) => (

                                <div
                                  className="explanation-item"
                                  key={index}
                                >

                                  <span>
                                    {index + 1}
                                  </span>

                                  <p>
                                    {explanation}
                                  </p>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <EmptyState
                            text="No explanation was stored for this assessment."
                          />

                        )}

                      </div>


                      {/* =======================================
                          EXACT ANSWERS
                      ======================================= */}

                      <div className="assessment-answers">

                        <div className="assessment-box-title">
                          Recorded Responses
                        </div>


                        <p className="assessment-note">

                          These are the exact
                          questions and answers
                          stored for Assessment{" "}
                          {
                            selectedAssessment.assessmentNumber
                          }.

                        </p>


                        {selectedAnswers.length > 0 ? (

                          <div className="answer-grid">

                            {selectedAnswers.map(
                              (item) => (

                                <div
                                  className="answer-item"
                                  key={item.id}
                                >

                                  <span>
                                    {item.question}
                                  </span>

                                  <strong>
                                    {item.answer}
                                  </strong>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <EmptyState
                            text="No recorded responses available for this assessment."
                          />

                        )}

                      </div>


                      {/* =======================================
                          DERIVED FACTORS
                      ======================================= */}

                      <div className="assessment-factors">
                        <br></br>
                        <br></br>
                        <div className="assessment-box-title">
                          Clinical Factors From This Assessment
                        </div>


                        <div className="pr-info-grid">

                          <InfoCard
                            label="Family History"
                            value={
                              selectedFactors.familyHistory
                            }
                          />

                          <InfoCard
                            label="Male Relative"
                            value={
                              formatBoolean(
                                selectedFactors.maleRelativeFlag
                              )
                            }
                          />

                          <InfoCard
                            label="Minor Cut Bleeding"
                            value={
                              selectedFactors.bleedMinorCuts
                            }
                          />

                          <InfoCard
                            label="Dental / Surgery Bleeding"
                            value={
                              selectedFactors.dentalSurgeryBleeding
                            }
                          />

                          <InfoCard
                            label="Bruising"
                            value={
                              selectedFactors.bruises
                            }
                          />

                          <InfoCard
                            label="Muscle Swelling"
                            value={
                              selectedFactors.muscleSwelling
                            }
                          />

                          <InfoCard
                            label="Joint Swelling"
                            value={
                              selectedFactors.jointSwelling
                            }
                          />

                          

                          <InfoCard
                            label="Blood in Urine / Stool"
                            value={
                              selectedFactors.bloodUrineStool
                            }
                          />

                          <InfoCard
                            label="Heavy Menstrual Bleeding"
                            value={
                              selectedFactors.heavyMenstrual
                            }
                          />

                          

                          

                        </div>


                        {Array.isArray(
                          selectedFactors.jointsList
                        ) &&
                        selectedFactors
                          .jointsList
                          .length > 0 && (

                          <div className="pr-joint-grid">

                            {selectedFactors
                              .jointsList
                              .map(
                                (
                                  joint,
                                  index
                                ) => (

                                  <div
                                    className="pr-joint"
                                    key={index}
                                  >
                                    {joint}
                                  </div>

                                )
                              )}

                          </div>

                        )}

                      </div>

                    </div>

                  )}

                </>

              ) : (

                <EmptyState
                  text="No assessment history available."
                />

              )}

            </div>


            {/* =================================================
                CARE TEAM
            ================================================= */}

            <SectionHeader
              eyebrow="Care Team"
              title="Clinical Care Information"
              description="Healthcare facility and care-team information associated with the patient."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="HTC Name"
                  value={
                    careTeam.htcName
                  }
                />

                <InfoCard
                  label="Hematologist"
                  value={
                    careTeam.hematologistName
                  }
                />

                <InfoCard
                  label="Hospital"
                  value={
                    careTeam.hospitalName
                  }
                />

                <InfoCard
                  label="Existing Patient Number"
                  value={
                    careTeam.existingPatientNumber
                  }
                />

              </div>

            </div>


            {/* =================================================
                EMERGENCY CONTACT
            ================================================= */}

            <SectionHeader
              eyebrow="Emergency"
              title="Emergency Contact"
              description="Emergency contact information recorded for this patient."
            />


            <div className="pr-card">

              <div className="pr-info-grid">

                <InfoCard
                  label="Name"
                  value={
                    emergencyContact.name
                  }
                />

                <InfoCard
                  label="Relationship"
                  value={
                    emergencyContact.relationship
                  }
                />

                <InfoCard
                  label="Phone"
                  value={
                    emergencyContact.phone
                  }
                />

              </div>

            </div>


            {/* =================================================
                TIMELINE
            ================================================= */}

            <SectionHeader
              eyebrow="Patient History"
              title="Clinical Timeline"
              description="Chronological record of important clinical events available in the system."
            />


            <div className="pr-card">

              {timeline.length > 0 ? (

                <div className="pr-timeline">

                  {timeline.map(
                    (event, index) => (

                      <div
                        className="pr-timeline-item"
                        key={index}
                      >

                        <div className="pr-timeline-dot" />


                        <div className="pr-timeline-content">

                          <div className="pr-timeline-top">

                            <strong>
                              {value(
                                event.title ||
                                event.type
                              )}
                            </strong>

                            <span>
                              {formatDate(
                                event.date ||
                                event.createdAt
                              )}
                            </span>

                          </div>


                          <p>
                            {value(
                              event.description ||
                              event.details,
                              "No additional details available."
                            )}
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <EmptyState
                  text="No timeline events are currently available."
                />

              )}

            </div>


            {/* =================================================
                IMPORTANT DATA NOTE
            ================================================= */}

            <div className="pr-privacy">

              <div className="pr-privacy-title">
                Authorized Clinical Access
              </div>

              <p>
                Patient information displayed here
                is retrieved from the authenticated
                clinical system and is intended for
                authorized healthcare professionals
                only.
              </p>

            </div>

          </div>

        )}

      </main>


      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .pr-root {
          --color-bg: #F5F8FC;
          --color-surface: #FFFFFF;
          --color-primary: #2C5CE0;
          --color-primary-dark: #163B85;
          --color-primary-soft: #EAF0FE;
          --color-accent: #0BA5A0;
          --color-border: #DCE6F2;
          --color-text: #10233F;
          --color-text-secondary: #5B7291;
          --color-text-faint: #93A6C2;

          min-height: 100vh;

          background:
            var(--color-bg);

          color:
            var(--color-text);

          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        }

        .pr-root * {
          box-sizing: border-box;
        }

        /* =========================
           NAVBAR
        ========================= */

        .pr-navbar {
          position: sticky;
          top: 0;
          z-index: 100;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 14px 28px;

          background:
            var(--color-surface);

          border-bottom:
            1px solid var(--color-border);
        }

        .pr-navbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pr-logo-mark {
          width: 34px;
          height: 34px;

          border-radius: 9px;

          background:
            linear-gradient(
              145deg,
              #2C5CE0,
              #163B85
            );

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;
        }

        .pr-logo-mark svg {
          width: 18px;
          height: 18px;
        }

        .pr-app-name {
          font-family:
            'Manrope',
            'Inter',
            sans-serif;

          font-weight: 700;
          font-size: 16px;

          color:
            var(--color-text);
        }

        .pr-navbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pr-dashboard-btn,
        .pr-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 8px 12px;

          border-radius: 9px;

          border:
            1px solid var(--color-border);

          background:
            var(--color-surface);

          color:
            var(--color-text-secondary);

          font-size: 12.5px;
          font-weight: 600;

          cursor: pointer;

          transition:
            all 0.15s ease;
        }

        .pr-dashboard-btn:hover,
        .pr-logout-btn:hover {
          border-color:
            var(--color-primary);

          color:
            var(--color-primary-dark);

          background:
            var(--color-primary-soft);
        }

        .pr-dashboard-btn svg {
          width: 15px;
          height: 15px;
        }

        .pr-doctor-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pr-avatar {
          width: 34px;
          height: 34px;

          border-radius: 50%;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary-dark);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 12px;
          font-weight: 700;

          border:
            1px solid var(--color-border);
        }

        .pr-doctor-name {
          font-size: 13.5px;
          font-weight: 600;
        }

        .pr-doctor-role {
          font-size: 11.5px;
          color:
            var(--color-text-secondary);
        }

        /* =========================
           MAIN
        ========================= */

        .pr-main {
          max-width: 1240px;

          margin: 0 auto;

          padding:
            32px 28px 64px;
        }

        /* =========================
           HEADER
        ========================= */

        .pr-page-header {
          margin-bottom: 24px;
        }

        .pr-title {
          font-family:
            'Manrope',
            'Inter',
            sans-serif;

          font-size: 28px;

          font-weight: 800;

          letter-spacing: -0.02em;

          margin:
            0 0 6px;
        }

        .pr-subtitle {
          margin: 0;

          font-size: 14.5px;

          color:
            var(--color-text-secondary);
        }

        /* =========================
           SEARCH
        ========================= */

        .pr-search-card {
          background:
            var(--color-surface);

          border:
            1px solid var(--color-border);

          border-radius: 16px;

          padding: 22px;

          margin-bottom: 32px;

          box-shadow:
            0 1px 2px rgba(16,35,63,0.04),
            0 6px 20px rgba(16,35,63,0.05);
        }

        .pr-search-eyebrow {
          display: block;

          font-size: 10.5px;

          font-weight: 700;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;

          color:
            var(--color-primary);

          margin-bottom: 5px;
        }

        .pr-search-heading h2 {
          font-size: 17px;

          margin:
            0 0 4px;

          font-weight: 700;
        }

        .pr-search-heading p {
          margin: 0;

          color:
            var(--color-text-secondary);

          font-size: 12.5px;
        }

        .pr-search-heading {
          margin-bottom: 18px;
        }

        .pr-search-form {
          display: flex;

          align-items: flex-end;

          gap: 12px;
        }

        .pr-input-wrapper {
          flex: 1;
        }

        .pr-input-wrapper label {
          display: block;

          font-size: 12px;

          font-weight: 600;

          color:
            var(--color-text-secondary);

          margin-bottom: 7px;
        }

        .pr-input-wrapper input {
          width: 100%;

          padding:
            12px 14px;

          border:
            1px solid var(--color-border);

          border-radius: 9px;

          outline: none;

          font-size: 13px;

          color:
            var(--color-text);
        }

        .pr-input-wrapper input:focus {
          border-color:
            var(--color-primary);

          box-shadow:
            0 0 0 3px
            rgba(44,92,224,0.08);
        }

        .pr-search-btn {
          padding:
            12px 20px;

          border: none;

          border-radius: 9px;

          background:
            var(--color-primary);

          color: white;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;
        }

        .pr-search-btn:hover {
          background:
            var(--color-primary-dark);
        }

        .pr-search-btn:disabled {
          opacity: 0.65;

          cursor:
            not-allowed;
        }

        .pr-error {
          margin-top: 14px;

          padding: 10px 12px;

          border-radius: 8px;

          background: #FFF1F1;

          border:
            1px solid #FFD2D2;

          color: #B42318;

          font-size: 12.5px;
        }

        /* =========================
           INITIAL
        ========================= */

        .pr-initial-state {
          padding: 70px 20px;

          text-align: center;

          color:
            var(--color-text-secondary);
        }

        .pr-initial-icon {
          width: 60px;
          height: 60px;

          margin:
            0 auto 18px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 16px;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary);
        }

        .pr-initial-icon svg {
          width: 32px;
          height: 32px;
        }

        .pr-initial-state h3 {
          margin:
            0 0 6px;

          color:
            var(--color-text);
        }

        .pr-initial-state p {
          margin: 0;

          font-size: 13px;
        }

        /* =========================
           PATIENT HEADER
        ========================= */

        .pr-patient-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 20px;

          padding: 22px;

          background:
            white;

          border:
            1px solid var(--color-border);

          border-radius: 16px;

          margin-bottom: 35px;
        }

        .pr-patient-identity {
          display: flex;

          align-items: center;

          gap: 14px;
        }

        .pr-patient-avatar {
          width: 52px;
          height: 52px;

          border-radius: 14px;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary-dark);

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 16px;

          font-weight: 800;
        }

        .pr-record-label {
          display: block;

          color:
            var(--color-primary);

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;

          font-size: 10px;

          font-weight: 700;

          margin-bottom: 3px;
        }

        .pr-patient-identity h2 {
          margin:
            0 0 4px;

          font-size: 21px;
        }

        .pr-patient-identity p {
          margin: 0;

          font-size: 12px;

          color:
            var(--color-text-secondary);
        }

        .pr-patient-meta {
          text-align: right;
        }

        .pr-patient-meta span {
          display: block;

          font-size: 11px;

          color:
            var(--color-text-secondary);
        }

        .pr-active {
          color: #138A5B;
          font-size: 13px;
        }

        /* =========================
           SECTION HEADERS
        ========================= */

        .pr-section-header {
          margin:
            36px 0 14px;
        }

        .pr-section-header-top {
          display: flex;

          align-items: center;

          gap: 10px;
        }

        .pr-section-eyebrow {
          font-size: 10px;

          font-weight: 800;

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;

          color:
            var(--color-primary);
        }

        .pr-pulse-line {
          width: 70px;
          height: 18px;

          color:
            var(--color-primary);
        }

        .pr-section-title {
          margin:
            4px 0 4px;

          font-size: 19px;

          font-weight: 750;
        }

        .pr-section-description {
          margin: 0;

          color:
            var(--color-text-secondary);

          font-size: 12.5px;

          line-height: 1.5;
        }

        /* =========================
           CARDS
        ========================= */

        .pr-card {
          background:
            var(--color-surface);
            margin-top : 20px;

          border:
            1px solid var(--color-border);

          border-radius: 16px;

          padding: 22px;

          box-shadow:
            0 1px 2px rgba(16,35,63,0.04),
            0 6px 20px rgba(16,35,63,0.05);
        }

        .pr-info-grid {
          display: grid;
          

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 18px;
        }

        .pr-info-grid-single {
          margin-top: 20px;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

        .pr-info-item {
          min-width: 0;
        }

        .pr-info-label {
          display: block;

          margin-bottom: 5px;

          font-size: 10.5px;

          text-transform:
            uppercase;

          letter-spacing:
            0.06em;

          font-weight: 700;

          color:
            var(--color-text-faint);
        }

        .pr-info-value {
          display: block;

          font-size: 13px;

          font-weight: 600;

          color:
            var(--color-text);

          word-break:
            break-word;
        }

        /* =========================
           STATS
        ========================= */

        .pr-stat-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 14px;
        }

        .pr-stat-card {
          background:
            white;

          border:
            1px solid var(--color-border);

          border-radius: 14px;

          padding: 18px;
        }

        .pr-stat-card span {
          display: block;

          color:
            var(--color-text-secondary);

          font-size: 11px;

          margin-bottom: 7px;
        }

        .pr-stat-card strong {
          font-size: 18px;

          font-weight: 800;
        }

        /* =========================
           STATUS
        ========================= */

        .pr-status {
          display: inline-flex;

          padding:
            5px 9px;

          border-radius: 999px;

          font-size: 11px;

          font-weight: 700;

          background: #EEF2F7;

          color:
            var(--color-text-secondary);
        }

        .pr-status-safe {
          background: #E8F7F0;
          color: #147A52;
        }

        .pr-status-warning {
          background: #FFF4D9;
          color: #9A6700;
        }

        .pr-status-danger {
          background: #FFE8E8;
          color: #B42318;
        }

        /* =========================
           JOINTS
        ========================= */

        .pr-joint-grid {
          display: flex;

          flex-wrap: wrap;

          gap: 10px;
        }

        .pr-joint {
          padding:
            9px 13px;

          border-radius: 9px;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary-dark);

          font-size: 12px;

          font-weight: 700;
        }

        /* =========================
           EMPTY
        ========================= */

        .pr-empty {
          padding: 30px;

          text-align: center;

          color:
            var(--color-text-secondary);
        }

        .pr-empty-line {
          width: 42px;

          height: 3px;

          margin:
            0 auto 12px;

          border-radius: 3px;

          background:
            var(--color-border);
        }

        .pr-empty p {
          margin: 0;

          font-size: 12.5px;
        }

        /* =========================
           LINE CHART
        ========================= */

        .chart-explanation {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 20px;

          margin-bottom: 15px;
        }

        .chart-explanation strong {
          font-size: 14px;
        }

        .chart-explanation p {
          margin:
            4px 0 0;

          font-size: 12px;

          color:
            var(--color-text-secondary);
        }

        .chart-count {
          padding:
            7px 10px;

          border-radius: 8px;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary-dark);

          font-size: 11px;

          font-weight: 700;

          white-space: nowrap;
        }

        .pr-chart {
          width: 100%;

          min-height: 320px;
        }

        .chart-tooltip {
          background:
            white;

          border:
            1px solid var(--color-border);

          border-radius: 10px;

          padding: 10px 12px;

          box-shadow:
            0 8px 24px
            rgba(16,35,63,0.12);

          font-size: 11px;
        }

        .chart-tooltip strong {
          display: block;

          margin-bottom: 6px;

          font-size: 12px;
        }

        .chart-tooltip div {
          margin-top: 3px;
        }

        /* =========================
           ASSESSMENT SELECTOR
        ========================= */

        .assessment-selector {
          display: flex;

          align-items: flex-end;

          gap: 15px;

          margin-bottom: 24px;
        }

        .assessment-selector label {
          display: block;

          min-width: 180px;

          font-size: 11px;

          font-weight: 700;

          color:
            var(--color-text-secondary);
        }

        .assessment-selector select {
          flex: 1;

          padding:
            12px 14px;

          border:
            1px solid var(--color-border);

          border-radius: 9px;

          background: white;

          color:
            var(--color-text);

          font-size: 13px;

          font-weight: 600;

          outline: none;

          cursor: pointer;
        }

        .assessment-selector select:focus {
          border-color:
            var(--color-primary);

          box-shadow:
            0 0 0 3px
            rgba(44,92,224,0.08);
        }

        /* =========================
           SELECTED ASSESSMENT
        ========================= */

        .selected-assessment {
          border-top:
            1px solid var(--color-border);

          padding-top: 22px;
        }

        .selected-score-header {
          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 20px;

          padding: 18px;

          border-radius: 12px;

          background:
            var(--color-primary-soft);
        }

        .selected-score-header span,
        .selected-risk span {
          display: block;

          font-size: 10.5px;

          text-transform:
            uppercase;

          letter-spacing:
            0.06em;

          color:
            var(--color-text-secondary);

          font-weight: 700;

          margin-bottom: 5px;
        }

        .selected-score-header h3 {
          margin:
            0 0 4px;

          font-size: 28px;

          color:
            var(--color-primary-dark);
        }

        .selected-score-header p {
          margin: 0;

          font-size: 11.5px;

          color:
            var(--color-text-secondary);
        }

        .selected-risk {
          text-align: right;
        }

        .assessment-flags {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 12px;

          margin:
            16px 0;
        }

        .assessment-flags > div {
          padding: 13px;

          border:
            1px solid var(--color-border);

          border-radius: 10px;

          background: white;
        }

        .assessment-flags span {
          display: block;

          font-size: 10.5px;

          color:
            var(--color-text-secondary);

          margin-bottom: 5px;
        }

        .assessment-flags strong {
          font-size: 13px;
        }

        .assessment-explanation,
        .assessment-answers {
          margin-top: 20px;

          padding-top: 20px;

          border-top:
            1px solid var(--color-border);
        }

        .assessment-box-title {
          font-size: 14px;

          font-weight: 800;

          margin-bottom: 5px;
        }

        .assessment-note {
          margin:
            0 0 15px;

          color:
            var(--color-text-secondary);

          font-size: 12px;

          line-height: 1.55;
        }

        .explanation-list {
          display: grid;

          gap: 9px;
        }

        .explanation-item {
          display: flex;

          align-items: flex-start;

          gap: 10px;

          padding: 11px 12px;

          border:
            1px solid var(--color-border);

          border-radius: 9px;

          background:
            #FAFCFF;
        }

        .explanation-item > span {
          width: 22px;
          height: 22px;

          flex: 0 0 22px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            var(--color-primary-soft);

          color:
            var(--color-primary-dark);

          font-size: 10px;

          font-weight: 800;
        }

        .explanation-item p {
          margin: 2px 0 0;

          font-size: 12.5px;

          line-height: 1.45;
        }

        .answer-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 10px;
        }

        .answer-item {
          padding: 13px;

          border:
            1px solid var(--color-border);

          border-radius: 10px;

          background:
            #FAFCFF;
        }

        .answer-item span {
          display: block;

          color:
            var(--color-text-secondary);

          font-size: 11px;

          line-height: 1.4;

          margin-bottom: 6px;
        }

        .answer-item strong {
          display: block;

          font-size: 13px;

          color:
            var(--color-text);
        }

        /* =========================
           TIMELINE
        ========================= */

        .pr-timeline {
          position: relative;

          padding-left: 24px;
        }

        .pr-timeline::before {
          content: "";

          position: absolute;

          left: 5px;

          top: 5px;

          bottom: 5px;

          width: 1px;

          background:
            var(--color-border);
        }

        .pr-timeline-item {
          position: relative;

          padding:
            0 0 22px 20px;
        }

        .pr-timeline-dot {
          position: absolute;

          left: -24px;

          top: 4px;

          width: 11px;
          height: 11px;

          border-radius: 50%;

          background:
            var(--color-primary);

          border:
            2px solid white;

          box-shadow:
            0 0 0 1px
            var(--color-border);
        }

        .pr-timeline-top {
          display: flex;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 5px;
        }

        .pr-timeline-top strong {
          font-size: 13px;
        }

        .pr-timeline-top span {
          font-size: 10.5px;

          color:
            var(--color-text-secondary);

          white-space: nowrap;
        }

        .pr-timeline-content p {
          margin: 0;

          font-size: 12px;

          color:
            var(--color-text-secondary);

          line-height: 1.5;
        }

        /* =========================
           RELIABILITY
        ========================= */

        .reliability-note {
          margin-top: 20px;

          padding: 12px 14px;

          border-radius: 9px;

          background:
            #F7F9FC;

          color:
            var(--color-text-secondary);

          font-size: 11.5px;

          line-height: 1.5;
        }

        /* =========================
           NOTES
        ========================= */

        .pr-notes {
          display: grid;

          grid-template-columns:
            repeat(2, 1fr);

          gap: 14px;
        }

        .pr-note {
          padding: 15px;

          border:
            1px solid var(--color-border);

          border-radius: 10px;

          background:
            #FAFCFF;
        }

        .pr-note span {
          display: block;

          font-size: 10.5px;

          text-transform:
            uppercase;

          letter-spacing:
            0.06em;

          font-weight: 700;

          color:
            var(--color-text-faint);

          margin-bottom: 6px;
        }

        .pr-note p {
          margin: 0;

          font-size: 13px;

          font-weight: 600;
        }

        /* =========================
           PRIVACY
        ========================= */

        .pr-privacy {
          margin-top: 28px;

          padding: 16px 18px;

          border:
            1px solid var(--color-border);

          border-radius: 12px;

          background:
            white;
        }

        .pr-privacy-title {
          font-size: 12px;

          font-weight: 800;

          margin-bottom: 5px;
        }

        .pr-privacy p {
          margin: 0;

          color:
            var(--color-text-secondary);

          font-size: 11.5px;

          line-height: 1.5;
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 900px) {

          .pr-navbar {
            padding:
              12px 16px;
          }

          .pr-doctor-block {
            display: none;
          }

          .pr-main {
            padding:
              24px 16px 50px;
          }

          .pr-search-form {
            flex-direction: column;

            align-items: stretch;
          }

          .pr-stat-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .pr-info-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .pr-info-grid-single {
            grid-template-columns:
              1fr;
          }

          .pr-patient-header {
            flex-direction: column;

            align-items: flex-start;
          }

          .pr-patient-meta {
            text-align: left;
          }

          .assessment-selector {
            flex-direction: column;

            align-items: stretch;
          }

          .answer-grid {
            grid-template-columns: 1fr;
          }

          .pr-notes {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 600px) {

          .pr-dashboard-btn {
            font-size: 0;
          }

          .pr-dashboard-btn svg {
            width: 17px;
            height: 17px;
          }

          .pr-app-name {
            font-size: 14px;
          }

          .pr-stat-grid,
          .pr-info-grid {
            grid-template-columns: 1fr;
          }

          .selected-score-header {
            flex-direction: column;

            align-items: flex-start;
          }

          .selected-risk {
            text-align: left;
          }

          .assessment-flags {
            grid-template-columns: 1fr;
          }

          .pr-timeline-top {
            flex-direction: column;

            gap: 3px;
          }
            .patient-record-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 24px;
                }
                
                }

                /* =========================
   DOWNLOAD PDF BUTTON
========================= */

.pdf-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    margin-top: 14px;
    padding: 11px 20px;

    border: none;
    border-radius: 9px;

    background: #2C5CE0;
    color: #ffffff;

    font-family: 'Inter', -apple-system, BlinkMacSystemFont,
        'Segoe UI', sans-serif;

    font-size: 13px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;

    box-shadow:
        0 4px 10px rgba(44, 92, 224, 0.18);
}

.pdf-btn:hover {
    background: #163B85;

    transform: translateY(-1px);

    box-shadow:
        0 7px 16px rgba(44, 92, 224, 0.25);
}

.pdf-btn:active {
    transform: translateY(0);
}

.pdf-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

        }

        .doctor-exercise-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 15px;margin-bottom:15px;border:1px solid #dce7f4;border-radius:12px;background:#f8fbff}
        .doctor-exercise-toolbar strong{display:block;color:#244463;font-size:13px}.doctor-exercise-toolbar span{display:block;color:#7489a1;font-size:11px;margin-top:4px;line-height:1.45}
        .doctor-add-exercise-btn{margin-top:10px;margin-bottom :20px;border:0;border-radius:9px;padding:9px 13px; background:#2f72d6;color:#fff;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}.doctor-add-exercise-btn:hover{opacity:.92}
        .doctor-add-exercise-panel{border:1px solid #cfddec;border-radius:14px;padding:17px;margin-bottom:16px;background:#fff}
        .doctor-add-exercise-head{display:flex;justify-content:space-between;gap:15px;margin-bottom:15px}.doctor-add-exercise-head strong{display:block;color:#203d5c;font-size:14px}.doctor-add-exercise-head span{display:block;color:#71849b;font-size:11px;margin-top:4px}.doctor-add-close{border:0;background:#eef3f9;border-radius:8px;width:30px;height:30px;font-size:20px;color:#5e7189;cursor:pointer}
        .doctor-exercise-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.doctor-exercise-form-grid label{display:flex;flex-direction:column;gap:6px}.doctor-exercise-form-grid label>span{font-size:10px;font-weight:800;color:#5b718b}.doctor-exercise-form-grid input,.doctor-exercise-form-grid select,.doctor-exercise-form-grid textarea{width:100%;box-sizing:border-box;border:1px solid #d9e3ee;border-radius:8px;padding:9px 10px;background:#fbfdff;color:#263f5e;font:inherit;font-size:11px;outline:none}.doctor-exercise-form-grid input:focus,.doctor-exercise-form-grid select:focus,.doctor-exercise-form-grid textarea:focus{border-color:#5d88d8}.doctor-form-wide{grid-column:1/-1}
        .doctor-add-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.doctor-cancel-btn,.doctor-save-exercise-btn{border:0;border-radius:8px;padding:9px 13px;font-size:11px;font-weight:800;cursor:pointer}.doctor-cancel-btn{background:#edf2f7;color:#52677e}.doctor-save-exercise-btn{background:#2f72d6;color:#fff}.doctor-save-exercise-btn:disabled{opacity:.55;cursor:not-allowed}
        .exercise-research-card { margin-top: 4px; }
        .exercise-research-list { display: grid; gap: 14px; }
        .exercise-research-item { display:flex; justify-content:space-between; gap:18px; padding:18px; border:1px solid #dfe7f1; border-radius:14px; background:#fbfdff; }
        .exercise-research-main { display:flex; gap:12px; min-width:0; }
        .exercise-research-icon { width:40px; height:40px; flex:0 0 40px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#edf3ff; color:#3869d7; font-weight:800; }
        .exercise-research-main h3 { margin:0 0 5px; color:#173c64; font-size:16px; }
        .exercise-research-main p { margin:0 0 9px; color:#6d8199; font-size:12px; line-height:1.45; }
        .exercise-research-meta { display:flex; flex-wrap:wrap; gap:7px; }
        .exercise-research-meta span { padding:5px 8px; border:1px solid #e1e8f1; border-radius:8px; background:#fff; color:#526b88; font-size:10px; }
        .exercise-research-main small { display:block; margin-top:8px; color:#7a8ca3; font-size:10px; }
        .exercise-research-actions { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
        .exercise-research-status { padding:6px 9px; border-radius:20px; font-size:9px; font-weight:800; background:#fff4dc; color:#98691b; white-space:nowrap; }
        .exercise-research-status.active { background:#e7f7ef; color:#277d50; }
        .exercise-research-status.removed { background:#f5e8e8; color:#9a4141; }
        .exercise-review-buttons { display:flex; gap:7px; }
        .exercise-approve-btn, .exercise-remove-btn { border:0; border-radius:8px; padding:8px 11px; font-size:11px; font-weight:700; cursor:pointer; }
        .exercise-approve-btn { background:#2f72d6; color:#fff; }
        .exercise-remove-btn { background:#fff0f0; color:#a34444; border:1px solid #edcaca; }
        .exercise-research-empty { display:flex; flex-direction:column; gap:5px; padding:25px; text-align:center; color:#74879e; }
        .exercise-research-empty strong { color:#2a405f; }
        .session-history-notes { margin-top:10px; padding:10px 12px; border-radius:9px; background:#f4f8ff; border:1px solid #dfe8f5; }
        .session-history-notes strong { display:block; font-size:11px; color:#2a405f; margin-bottom:4px; }
        .session-history-notes p { margin:0; font-size:12px; color:#44577a; white-space:pre-wrap; }
        .session-history-notes--error { background:#fff3f3; border-color:#f0d0d0; }
        .session-history-notes--pending { color:#8b98aa; font-size:12px; background:transparent; border:none; padding:6px 0; }
        .session-history-video { display:block; margin-top:10px; max-width:320px; border-radius:9px; }
        .session-history-video-unavailable { margin-top:10px; font-size:11px; color:#8b98aa; font-style:italic; }
        @media(max-width:720px){ .exercise-research-item{flex-direction:column}.exercise-research-actions{align-items:flex-start}.exercise-review-buttons{width:100%}.exercise-approve-btn,.exercise-remove-btn{flex:1}.doctor-exercise-toolbar{flex-direction:column;align-items:flex-start}.doctor-add-exercise-btn{width:100%}.doctor-exercise-form-grid{grid-template-columns:1fr}.doctor-form-wide{grid-column:auto}.doctor-add-actions{flex-direction:column}.doctor-cancel-btn,.doctor-save-exercise-btn{width:100%} }
      `}
</style>

    </div>
  );
}

// =========================================================
// G2-G4: one row of the doctor's Session History list.
//
// Video gate, non-negotiable per the task brief: playable ONLY when
// clinical.video.consentVideoMonitoring is true AND the file has not been
// swept (deletedAt is null). A session with consent=false, or one whose
// video already aged out of the 30-day retention window (video_retention.py),
// shows "not available" -- never a broken player, never a silent guess.
//
// KNOWN GAP (named, not fixed here -- report.py is out of this agent's
// ownership): there is no GET route yet to actually stream the file bytes.
// This assumes the natural counterpart to the existing
// `POST /session/{id}/video` upload route -- `GET /engine/session/{id}/video`
// -- and renders a <video> tag pointed at it once the two consent/deletion
// conditions pass. Until that GET route exists on the backend, the element
// will 404 in the browser network tab even though the gate itself is
// correct; the fix is one route in report.py, not a UI change here.
function SessionHistoryItem({ session }) {
  const video = session.clinical?.video || {};
  const report = session.clinical?.report || {};
  const videoPlayable = !!video.consentVideoMonitoring && !video.deletedAt && !!video.path;

  const reps = session.repCount ?? 0;
  const clean = session.cleanReps ?? 0;
  const cleanRate = reps > 0 ? `${Math.round((clean / reps) * 100)}%` : "—";
  const started = session.startedAt ? new Date(session.startedAt).toLocaleString() : "—";

  return (
    <div className="exercise-research-item session-history-item">
      <div className="exercise-research-main">
        <div className="exercise-research-icon">◔</div>
        <div>
          <h3>{session.engineExercise || session.exerciseId || "Session"}</h3>
          <div className="exercise-research-meta">
            <span>{started}</span>
            <span>{reps} reps</span>
            <span>{cleanRate} clean</span>
            <span>{session.status || "—"}</span>
          </div>

          {report.text ? (
            <div className="session-history-notes">
              <strong>Coaching notes</strong>
              <p>{report.text}</p>
            </div>
          ) : report.error ? (
            <div className="session-history-notes session-history-notes--error">
              <strong>Coaching notes unavailable</strong>
              <p>{report.error}</p>
            </div>
          ) : (
            <div className="session-history-notes session-history-notes--pending">
              <span>Coaching notes not generated yet.</span>
            </div>
          )}

          {videoPlayable ? (
            <video
              className="session-history-video"
              controls
              preload="none"
              src={`/engine/session/${encodeURIComponent(session.sessionId)}/video`}
            />
          ) : (
            <div className="session-history-video-unavailable">
              {video.consentVideoMonitoring
                ? "Video no longer available (retention period passed)."
                : "Video not available — patient did not consent to video monitoring."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}