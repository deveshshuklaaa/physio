

// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import "./Report.css";

// export default function Report() {
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   // =========================================================
//   // LOAD REPORT + PROFILE
//   // =========================================================

//   let data = {};
//   let profile = {};

//   try {
//     data = JSON.parse(
//       localStorage.getItem("report") || "{}"
//     );
//   } catch (error) {
//     console.error("Unable to read report data:", error);
//     data = {};
//   }

//   try {
//     profile = JSON.parse(
//       localStorage.getItem("profile") || "{}"
//     );
//   } catch (error) {
//     console.error("Unable to read profile data:", error);
//     profile = {};
//   }

//   // =========================================================
//   // SAFE JSON PARSER
//   // =========================================================

//   const parseJSON = (value, fallback = {}) => {
//     if (
//       value === null ||
//       value === undefined ||
//       value === ""
//     ) {
//       return fallback;
//     }

//     if (typeof value === "object") {
//       return value;
//     }

//     try {
//       return JSON.parse(value);
//     } catch {
//       return fallback;
//     }
//   };

//   // =========================================================
//   // ML DATA
//   //
//   // Supports BOTH:
//   //
//   // New:
//   // mlPrediction
//   // mlPredictionLabel
//   // mlPredictionProbability
//   // mlProbabilities
//   // mlFeatures
//   //
//   // Older:
//   // prediction
//   // predictionLabel
//   // predictionProbability
//   // probabilities
//   // features
//   // =========================================================

//   const mlFeatures = parseJSON(
//     data.mlFeatures || data.features,
//     {}
//   );

//   const mlProbabilities = parseJSON(
//     data.mlProbabilities || data.probabilities,
//     {}
//   );

//   // =========================================================
//   // ML PREDICTION NUMBER
//   // =========================================================

//   let predictionNumber = null;

//   if (
//     data.mlPrediction !== undefined &&
//     data.mlPrediction !== null
//   ) {
//     predictionNumber = Number(data.mlPrediction);
//   } else if (
//     data.prediction !== undefined &&
//     data.prediction !== null
//   ) {
//     predictionNumber = Number(data.prediction);
//   }

//   if (
//     Number.isNaN(predictionNumber)
//   ) {
//     predictionNumber = null;
//   }

//   // =========================================================
//   // ML LABEL
//   // =========================================================

//   const predictionLabels = {
//   0: t("report.predictions.healthy"),
//   1: t("report.predictions.mild"),
//   2: t("report.predictions.moderate"),
//   3: t("report.predictions.severe"),
// };

//   const mlLabel =
//     data.mlPredictionLabel ||
//     data.predictionLabel ||
//     (
//       predictionNumber !== null
//         ? predictionLabels[predictionNumber]
//         : null
//     ) ||
//     "N/A";

//   // =========================================================
//   // ML PROBABILITY
//   // =========================================================

//   let probability = null;

//   if (
//     data.mlPredictionProbability !== undefined &&
//     data.mlPredictionProbability !== null
//   ) {
//     probability = Number(
//       data.mlPredictionProbability
//     );
//   } else if (
//     data.predictionProbability !== undefined &&
//     data.predictionProbability !== null
//   ) {
//     probability = Number(
//       data.predictionProbability
//     );
//   }

//   if (
//     probability !== null &&
//     Number.isNaN(probability)
//   ) {
//     probability = null;
//   }

//   /*
//    * Sometimes probability may arrive as 56.63
//    * instead of 0.5663.
//    *
//    * The Python model normally returns 0.5663,
//    * so only convert if it is already percentage-like.
//    */

//   let probabilityPercentage = null;

//   if (probability !== null) {
//     probabilityPercentage =
//       probability <= 1
//         ? probability * 100
//         : probability;
//   }

//   // =========================================================
//   // PROBABILITY BREAKDOWN
//   // =========================================================

//   const getProbability = (classNumber) => {
//     const value =
//       mlProbabilities?.[classNumber] ??
//       mlProbabilities?.[String(classNumber)];

//     if (
//       value === undefined ||
//       value === null
//     ) {
//       return null;
//     }

//     const numericValue = Number(value);

//     if (Number.isNaN(numericValue)) {
//       return null;
//     }

//     const percentage =
//       numericValue <= 1
//         ? numericValue * 100
//         : numericValue;

//     return percentage.toFixed(2);
//   };

//   // =========================================================
//   // FEATURE LABELS
//   // =========================================================

//   const featureLabels = {
//     age: "Age",

//     sex: "Sex",

//     prolonged_bleeding_minor_cut:
//       "Prolonged bleeding after minor cuts",

//     excessive_post_surgery_bleeding:
//       "Excessive bleeding after surgery",

//     excessive_dental_bleeding:
//       "Excessive bleeding after dental procedures",

//     easy_bruising:
//       "Easy bruising",

//     muscle_hematoma:
//       "Muscle swelling / hematoma",

//     recurrent_joint_bleeding:
//       "Recurrent joint bleeding",

//     joint_warmth:
//       "Joint warmth",

//     joint_tightness:
//       "Joint tightness",

//     reduced_joint_mobility:
//       "Reduced joint mobility",

//     hematuria:
//       "Blood in urine",

//     hematochezia:
//       "Blood in stool",

//     family_history_bleeding_disorder:
//       "Family history of bleeding disorder",

//     male_relative_with_hemophilia:
//       "Male relative with hemophilia",

//     previous_factor_test:
//       "Previous factor testing",
//   };

//   // =========================================================
//   // FORMAT FEATURE VALUE
//   // =========================================================

//   const formatFeatureValue = (
//     key,
//     value
//   ) => {
//     // AGE
//     if (key === "age") {
//       return value !== undefined &&
//         value !== null
//         ? `${value} years`
//         : "N/A";
//     }

//     // SEX
//     if (key === "sex") {
//       if (
//         value === 1 ||
//         value === "1" ||
//         value === "male" ||
//         value === "Male"
//       ) {
//         return "Male";
//       }

//       if (
//         value === 0 ||
//         value === "0" ||
//         value === "female" ||
//         value === "Female"
//       ) {
//         return "Female";
//       }

//       return "N/A";
//     }

//     /*
//      * ML MODEL ENCODING
//      *
//      * 0 = No / Never
//      * 1 = Sometimes
//      * 2 = Yes / Often
//      */

//     const ordinalFeatures = [
//       "prolonged_bleeding_minor_cut",
//       "excessive_post_surgery_bleeding",
//       "excessive_dental_bleeding",
//       "easy_bruising",
//       "muscle_hematoma",
//       "recurrent_joint_bleeding",
//       "joint_warmth",
//       "joint_tightness",
//       "reduced_joint_mobility",
//       "hematuria",
//       "hematochezia",
//       "family_history_bleeding_disorder",
//       "male_relative_with_hemophilia",
//       "previous_factor_test",
//     ];

//     if (
//       ordinalFeatures.includes(key)
//     ) {
//       const numericValue = Number(value);

//       if (numericValue === 0) {
//         return "No";
//       }

//       if (numericValue === 1) {
//         return "Sometimes";
//       }

//       if (numericValue === 2) {
//         return "Yes / Often";
//       }

//       return "N/A";
//     }

//     return String(
//       value ?? "N/A"
//     );
//   };

//   // =========================================================
//   // AVAILABLE FEATURES
//   // =========================================================

//   const availableFeatures =
//     Object.entries(
//       mlFeatures || {}
//     ).filter(
//       ([key, value]) =>
//         featureLabels[key] &&
//         value !== undefined &&
//         value !== null
//     );

//   // =========================================================
//   // RESULT CSS CLASS
//   // =========================================================

//   const getResultClass = () => {
//     if (predictionNumber === 0) {
//       return "result-healthy";
//     }

//     if (predictionNumber === 1) {
//       return "result-mild";
//     }

//     if (predictionNumber === 2) {
//       return "result-moderate";
//     }

//     if (predictionNumber === 3) {
//       return "result-severe";
//     }

//     return "";
//   };

//   // =========================================================
//   // EXPLANATION
//   // =========================================================

//   let explanation = [];

//   if (Array.isArray(data.explanation)) {
//     explanation = data.explanation;
//   } else if (
//     typeof data.explanation === "string" &&
//     data.explanation.trim()
//   ) {
//     explanation = [data.explanation];
//   }

//   // =========================================================
//   // IF EXPLANATION IS MISSING BUT ML RESULT EXISTS
//   // =========================================================

//   if (
//     explanation.length === 0 &&
//     mlLabel !== "N/A"
//   ) {
//     explanation = [
//       `Random Forest prediction: ${mlLabel}`,
//     ];
//   }

//   // =========================================================
//   // EMERGENCY FLAG
//   // =========================================================

//   const emergencyFlag =
//     data.emergencyFlag === true ||
//     data.emergencyFlag === "true";

//   // =========================================================
//   // DOWNLOAD PDF
//   // =========================================================

//   const downloadPDF = async () => {
//     const element =
//       document.getElementById(
//         "report-content"
//       );

//     if (!element) {
//       return;
//     }

//     try {
//       const canvas =
//         await html2canvas(element, {
//           scale: 2,
//           backgroundColor: "#ffffff",
//           useCORS: true,
//         });

//       const imgData =
//         canvas.toDataURL("image/png");

//       const pdf = new jsPDF(
//         "p",
//         "mm",
//         "a4"
//       );

//       const pageWidth =
//         pdf.internal.pageSize.getWidth();

//       const pageHeight =
//         pdf.internal.pageSize.getHeight();

//       const margin = 10;

//       const pdfWidth =
//         pageWidth - margin * 2;

//       const pdfHeight =
//         (canvas.height * pdfWidth) /
//         canvas.width;

//       /*
//        * Multi-page PDF
//        */

//       let heightLeft = pdfHeight;

//       let position = margin;

//       pdf.addImage(
//         imgData,
//         "PNG",
//         margin,
//         position,
//         pdfWidth,
//         pdfHeight
//       );

//       heightLeft -=
//         pageHeight - margin * 2;

//       while (heightLeft > 0) {
//         position =
//           heightLeft -
//           pdfHeight +
//           margin;

//         pdf.addPage();

//         pdf.addImage(
//           imgData,
//           "PNG",
//           margin,
//           position,
//           pdfWidth,
//           pdfHeight
//         );

//         heightLeft -=
//           pageHeight - margin * 2;
//       }

//       pdf.save(
//         "Hemophilia_Screening_Report.pdf"
//       );
//     } catch (error) {
//       console.error(
//         "PDF generation error:",
//         error
//       );

//       alert(
//         "Unable to generate the PDF. Please try again."
//       );
//     }
//   };

//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (
//     <div className="report-page">

//       <div className="report-container">

//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div className="report-header">

//           <div className="report-header-left">

//             <div className="report-icon">
//               +
//             </div>

//             <div>
//               <h1>
//                 Hemophilia Report
//               </h1>

//               <p>
//                 ML Screening Assessment Report
//               </p>
//             </div>

//           </div>

//           <div className="report-status">
//             <span className="status-dot"></span>

//             Assessment Complete
//           </div>

//         </div>


//         {/* =================================================
//             REPORT CONTENT
//         ================================================= */}

//         <div
//           id="report-content"
//           className="report-content"
//         >

//           {/* =================================================
//               TITLE
//           ================================================= */}

//           <div className="report-title-section">

//             <div>

//               <h2>
//                 Screening Assessment
//               </h2>

//               <p>
//                 Summary of your hemophilia
//                 screening assessment
//               </p>

//             </div>

//             <div className="report-badge">
//               ML SCREENING
//             </div>

//           </div>


//           {/* =================================================
//               PATIENT INFORMATION
//           ================================================= */}

//           <section className="report-section">

//             <div className="section-heading">

//               <span className="section-icon">
//                 👤
//               </span>

//               <h3>
//                 Patient Information
//               </h3>

//             </div>


//             <div className="patient-grid">

//               <div className="patient-field">

//                 <span>
//                   Name
//                 </span>

//                 <strong>
//                   {profile.fullName ||
//                     "N/A"}
//                 </strong>

//               </div>


//               <div className="patient-field">

//                 <span>
//                   Patient ID
//                 </span>

//                 <strong>
//                   {profile.patientId ||
//                     "N/A"}
//                 </strong>

//               </div>


//               {mlFeatures.age !==
//                 undefined && (
//                 <div className="patient-field">

//                   <span>
//                     Age
//                   </span>

//                   <strong>
//                     {mlFeatures.age} years
//                   </strong>

//                 </div>
//               )}


//               {mlFeatures.sex !==
//                 undefined && (
//                 <div className="patient-field">

//                   <span>
//                     Sex
//                   </span>

//                   <strong>
//                     {formatFeatureValue(
//                       "sex",
//                       mlFeatures.sex
//                     )}
//                   </strong>

//                 </div>
//               )}

//             </div>

//           </section>


//           {/* =================================================
//               ML SCREENING RESULT
//           ================================================= */}

//           <section className="risk-section">

//             <div className="risk-header">

//               <div>

//                 <span className="small-label">
//                   ML SCREENING RESULT
//                 </span>

//                 <h3>
//                   Hemophilia Screening Prediction
//                 </h3>

//               </div>

//             </div>


//             <div className="risk-result">

//               <div>

//                 <span className="risk-label">
//                   Predicted Category
//                 </span>

//                 <div
//                   className={`risk-value ${getResultClass()}`}
//                 >
//                   {mlLabel}
//                 </div>

//               </div>


//               <div className="score-box">

//                 <span>
//                   Model Probability
//                 </span>

//                 <strong>
//                   {probabilityPercentage !==
//                     null
//                     ? `${probabilityPercentage.toFixed(
//                         2
//                       )}%`
//                     : "N/A"}
//                 </strong>

//               </div>

//             </div>

//           </section>


//           {/* =================================================
//               MODEL PROBABILITY BREAKDOWN
//           ================================================= */}

//           {Object.keys(
//             mlProbabilities || {}
//           ).length > 0 && (

//             <section className="report-section">

//               <div className="section-heading">

//                 <span className="section-icon">
//                   📊
//                 </span>

//                 <h3>
//                   Model Probability Breakdown
//                 </h3>

//               </div>


//               <div className="probability-list">

//                 <div className="probability-item">

//                   <span>
//                     Healthy         :   
//                   </span>

//                   <strong>
                            
//                     {getProbability(0) !==
//                       null
//                       ? `${getProbability(
//                           0
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Mild
//                   </span>

//                   <strong>
//                     {getProbability(1) !==
//                       null
//                       ? `${getProbability(
//                           1
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Moderate
//                   </span>

//                   <strong>
//                     {getProbability(2) !==
//                       null
//                       ? `${getProbability(
//                           2
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Severe
//                   </span>

//                   <strong>
//                     {getProbability(3) !==
//                       null
//                       ? `${getProbability(
//                           3
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>

//               </div>

//             </section>
//           )}


//           {/* =================================================
//               SCREENING FEATURES
//           ================================================= */}

//           {availableFeatures.length >
//             0 && (

//             <section className="report-section">

//               <div className="section-heading">

//                 <span className="section-icon">
//                   🩺
//                 </span>

//                 <h3>
//                   Screening Information
//                 </h3>

//               </div>


//               <div className="feature-grid">

//                 {availableFeatures.map(
//                   ([key, value]) => (

//                     <div
//                       className="feature-item"
//                       key={key}
//                     >

//                       <span>
//                         {featureLabels[key]}
//                       </span>

//                       <strong>
//                         {formatFeatureValue(
//                           key,
//                           value
//                         )}
//                       </strong>

//                     </div>

//                   )
//                 )}

//               </div>

//             </section>
//           )}


//           {/* =================================================
//               ASSESSMENT EXPLANATION
//           ================================================= */}

//           <section className="report-section">

//             <div className="section-heading">

//               <span className="section-icon">
//                 🔍
//               </span>

//               <h3>
//                 Assessment Explanation
//               </h3>

//             </div>


//             {explanation.length > 0 ? (

//               <div className="explanation-list">

//                 {explanation.map(
//                   (item, index) => (

//                     <div
//                       className="explanation-item"
//                       key={index}
//                     >

//                       <span className="explanation-number">
//                         {index + 1}
//                       </span>

//                       <span>
//                         {item}
//                       </span>

//                     </div>

//                   )
//                 )}

//               </div>

//             ) : (

//               <p className="no-data">
//                 The screening assessment was
//                 completed using the collected
//                 information and machine
//                 learning model.
//               </p>

//             )}

//           </section>


//           {/* =================================================
//               EMERGENCY NOTICE
//           ================================================= */}

//           {emergencyFlag && (

//             <div className="report-emergency">

//               <div className="warning-icon">
//                 !
//               </div>

//               <div>

//                 <strong>
//                   Urgent Medical Attention
//                 </strong>

//                 <p>
//                   One or more emergency bleeding
//                   symptoms were identified during
//                   the screening. Please seek
//                   appropriate medical attention
//                   promptly.
//                 </p>

//               </div>

//             </div>

//           )}


//           {/* =================================================
//               IMPORTANT MEDICAL NOTICE
//           ================================================= */}

//           <div className="report-disclaimer">

//             <div className="warning-icon">
//               !
//             </div>

//             <div>

//               <strong>
//                 Important Medical Notice
//               </strong>

//               <p>
//                 This report is generated from
//                 an AI-assisted screening
//                 assessment and is not a medical
//                 diagnosis. The machine learning
//                 prediction represents a screening
//                 result based on the information
//                 provided during the assessment.
//                 Model probability should not be
//                 interpreted as a clinical
//                 probability or diagnosis. Please
//                 consult a qualified healthcare
//                 professional for proper evaluation,
//                 diagnosis, and treatment.
//               </p>

//             </div>

//           </div>


//           {/* =================================================
//               FOOTER
//           ================================================= */}

//           <div className="report-footer">

//             <span>
//               Hemophilia AI Assistant
//             </span>

//             <span>
//               ML screening guidance only
//             </span>

//           </div>

//         </div>


//         {/* =================================================
//             ACTION BUTTONS
//         ================================================= */}

//         <div className="report-actions">

//           <button
//             className="download-button"
//             onClick={downloadPDF}
//           >
//             📥 Download Report
//           </button>


//           <button
//             className="back-button"
//             onClick={() =>
//               navigate("/chatbbot")
//             }
//           >
//             🔙 Back to Chat
//           </button>

//         </div>

//       </div>


//       {/* =================================================
//           OUTSIDE DISCLAIMER
//       ================================================= */}

//       <div className="page-disclaimer">

//         <span className="info-icon">
//           i
//         </span>

//         This assessment provides screening
//         guidance only and does not replace
//         diagnosis or treatment from a qualified
//         medical professional.

//       </div>

//     </div>
//   );
// }


import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Report.css";

export default function Report() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // =========================================================
  // CURRENT LANGUAGE
  // =========================================================

  const currentLanguage =
    (i18n.language || "en").split("-")[0];

  const language =
    ["en", "hi", "mr"].includes(currentLanguage)
      ? currentLanguage
      : "en";

  // =========================================================
  // REPORT TRANSLATIONS
  // =========================================================

  const TEXT = {
    en: {
      reportTitle: "Hemophilia Report",
      reportSubtitle: "ML Screening Assessment Report",

      assessmentComplete: "Assessment Complete",

      screeningAssessment: "Screening Assessment",

      summary:
        "Summary of your hemophilia screening assessment",

      mlScreening: "ML SCREENING",

      patientInformation:
        "Patient Information",

      name: "Name",

      patientId: "Patient ID",

      age: "Age",

      years: "years",

      sex: "Sex",

      male: "Male",

      female: "Female",

      mlScreeningResult:
        "ML SCREENING RESULT",

      hemophiliaScreeningPrediction:
        "Hemophilia Screening Prediction",

      predictedCategory:
        "Predicted Category",

      modelProbability:
        "Model Probability",

      probabilityBreakdown:
        "Model Probability Breakdown",

      healthy: "Healthy",

      mild: "Mild",

      moderate: "Moderate",

      severe: "Severe",

      screeningInformation:
        "Screening Information",

      assessmentExplanation:
        "Assessment Explanation",

      randomForestPrediction:
        "Random Forest prediction",

      urgentMedicalAttention:
        "Urgent Medical Attention",

      emergencyText:
        "One or more emergency bleeding symptoms were identified during the screening. Please seek appropriate medical attention promptly.",

      importantMedicalNotice:
        "Important Medical Notice",

      medicalNoticeText:
        "This report is generated from an AI-assisted screening assessment and is not a medical diagnosis. The machine learning prediction represents a screening result based on the information provided during the assessment. Model probability should not be interpreted as a clinical probability or diagnosis. Please consult a qualified healthcare professional for proper evaluation, diagnosis, and treatment.",

      noExplanation:
        "The screening assessment was completed using the collected information and machine learning model.",

      downloadReport:
        "Download Report",

      backToChat:
        "Back to Chat",

      footer:
        "ML screening guidance only",

      outsideDisclaimer:
        "This assessment provides screening guidance only and does not replace diagnosis or treatment from a qualified medical professional.",

      no: "No",

      sometimes: "Sometimes",

      yesOften: "Yes / Often",

      notAvailable: "N/A",

      features: {
        prolongedMinorCut:
          "Prolonged bleeding after minor cuts",

        postSurgery:
          "Excessive bleeding after surgery",

        dental:
          "Excessive bleeding after dental procedures",

        easyBruising:
          "Easy bruising",

        muscleHematoma:
          "Muscle swelling / hematoma",

        recurrentJointBleeding:
          "Recurrent joint bleeding",

        jointWarmth:
          "Joint warmth",

        jointTightness:
          "Joint tightness",

        reducedMobility:
          "Reduced joint mobility",

        bloodUrine:
          "Blood in urine",

        bloodStool:
          "Blood in stool",

        familyHistory:
          "Family history of bleeding disorder",

        maleRelative:
          "Male relative with hemophilia",

        previousFactorTest:
          "Previous factor testing",
      },
    },

    // =======================================================
    // HINDI
    // =======================================================

    hi: {
      reportTitle: "हीमोफीलिया रिपोर्ट",

      reportSubtitle:
        "एमएल स्क्रीनिंग मूल्यांकन रिपोर्ट",

      assessmentComplete:
        "मूल्यांकन पूरा हुआ",

      screeningAssessment:
        "स्क्रीनिंग मूल्यांकन",

      summary:
        "आपके हीमोफीलिया स्क्रीनिंग मूल्यांकन का सारांश",

      mlScreening:
        "एमएल स्क्रीनिंग",

      patientInformation:
        "रोगी की जानकारी",

      name:
        "नाम",

      patientId:
        "रोगी आईडी",

      age:
        "उम्र",

      years:
        "वर्ष",

      sex:
        "लिंग",

      male:
        "पुरुष",

      female:
        "महिला",

      mlScreeningResult:
        "एमएल स्क्रीनिंग परिणाम",

      hemophiliaScreeningPrediction:
        "हीमोफीलिया स्क्रीनिंग अनुमान",

      predictedCategory:
        "अनुमानित श्रेणी",

      modelProbability:
        "मॉडल संभावना",

      probabilityBreakdown:
        "मॉडल संभावना विवरण",

      healthy:
        "स्वस्थ",

      mild:
        "हल्का",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      screeningInformation:
        "स्क्रीनिंग जानकारी",

      assessmentExplanation:
        "मूल्यांकन विवरण",

      randomForestPrediction:
        "रैंडम फॉरेस्ट अनुमान",

      urgentMedicalAttention:
        "तत्काल चिकित्सा सहायता",

      emergencyText:
        "स्क्रीनिंग के दौरान एक या अधिक आपातकालीन रक्तस्राव संबंधी लक्षण पाए गए। कृपया तुरंत उचित चिकित्सा सहायता लें।",

      importantMedicalNotice:
        "महत्वपूर्ण चिकित्सा सूचना",

      medicalNoticeText:
        "यह रिपोर्ट एआई-सहायता प्राप्त स्क्रीनिंग मूल्यांकन से तैयार की गई है और यह चिकित्सा निदान नहीं है। मशीन लर्निंग अनुमान मूल्यांकन के दौरान दी गई जानकारी के आधार पर एक स्क्रीनिंग परिणाम है। मॉडल संभावना को चिकित्सीय संभावना या निदान के रूप में नहीं समझा जाना चाहिए। उचित मूल्यांकन, निदान और उपचार के लिए योग्य स्वास्थ्य सेवा पेशेवर से परामर्श करें।",

      noExplanation:
        "स्क्रीनिंग मूल्यांकन एकत्र की गई जानकारी और मशीन लर्निंग मॉडल का उपयोग करके पूरा किया गया।",

      downloadReport:
        "रिपोर्ट डाउनलोड करें",

      backToChat:
        "चैट पर वापस जाएँ",

      footer:
        "केवल एमएल स्क्रीनिंग मार्गदर्शन",

      outsideDisclaimer:
        "यह मूल्यांकन केवल स्क्रीनिंग मार्गदर्शन प्रदान करता है और योग्य चिकित्सा पेशेवर द्वारा निदान या उपचार का विकल्प नहीं है।",

      no:
        "नहीं",

      sometimes:
        "कभी-कभी",

      yesOften:
        "हाँ / अक्सर",

      notAvailable:
        "उपलब्ध नहीं",

      features: {
        prolongedMinorCut:
          "छोटी चोट या कट के बाद लंबे समय तक रक्तस्राव",

        postSurgery:
          "सर्जरी के बाद अत्यधिक रक्तस्राव",

        dental:
          "दंत प्रक्रिया के बाद अत्यधिक रक्तस्राव",

        easyBruising:
          "आसानी से शरीर पर नीले निशान पड़ना",

        muscleHematoma:
          "मांसपेशियों में सूजन / हेमेटोमा",

        recurrentJointBleeding:
          "बार-बार जोड़ों में रक्तस्राव",

        jointWarmth:
          "जोड़ों में गर्माहट",

        jointTightness:
          "जोड़ों में जकड़न",

        reducedMobility:
          "जोड़ों की गति में कमी",

        bloodUrine:
          "पेशाब में रक्त",

        bloodStool:
          "मल में रक्त",

        familyHistory:
          "रक्तस्राव संबंधी विकार का पारिवारिक इतिहास",

        maleRelative:
          "हीमोफीलिया से पीड़ित पुरुष रिश्तेदार",

        previousFactorTest:
          "पहले फैक्टर परीक्षण हुआ है",
      },
    },

    // =======================================================
    // MARATHI
    // =======================================================

    mr: {
      reportTitle:
        "हिमोफिलिया रिपोर्ट",

      reportSubtitle:
        "एमएल स्क्रीनिंग मूल्यांकन रिपोर्ट",

      assessmentComplete:
        "मूल्यांकन पूर्ण",

      screeningAssessment:
        "स्क्रीनिंग मूल्यांकन",

      summary:
        "तुमच्या हिमोफिलिया स्क्रीनिंग मूल्यांकनाचा सारांश",

      mlScreening:
        "एमएल स्क्रीनिंग",

      patientInformation:
        "रुग्णाची माहिती",

      name:
        "नाव",

      patientId:
        "रुग्ण आयडी",

      age:
        "वय",

      years:
        "वर्षे",

      sex:
        "लिंग",

      male:
        "पुरुष",

      female:
        "स्त्री",

      mlScreeningResult:
        "एमएल स्क्रीनिंग निकाल",

      hemophiliaScreeningPrediction:
        "हिमोफिलिया स्क्रीनिंग अंदाज",

      predictedCategory:
        "अंदाजित श्रेणी",

      modelProbability:
        "मॉडेल संभाव्यता",

      probabilityBreakdown:
        "मॉडेल संभाव्यता तपशील",

      healthy:
        "निरोगी",

      mild:
        "सौम्य",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      screeningInformation:
        "स्क्रीनिंग माहिती",

      assessmentExplanation:
        "मूल्यांकनाचे स्पष्टीकरण",

      randomForestPrediction:
        "रँडम फॉरेस्ट अंदाज",

      urgentMedicalAttention:
        "तातडीची वैद्यकीय मदत",

      emergencyText:
        "स्क्रीनिंगदरम्यान एक किंवा अधिक आपत्कालीन रक्तस्त्रावाची लक्षणे आढळली. कृपया त्वरित योग्य वैद्यकीय मदत घ्या.",

      importantMedicalNotice:
        "महत्त्वाची वैद्यकीय सूचना",

      medicalNoticeText:
        "हा रिपोर्ट एआय-सहाय्यित स्क्रीनिंग मूल्यांकनातून तयार करण्यात आला आहे आणि हे वैद्यकीय निदान नाही. मशीन लर्निंग अंदाज हा मूल्यांकनादरम्यान दिलेल्या माहितीवर आधारित स्क्रीनिंग निकाल आहे. मॉडेल संभाव्यतेचा अर्थ वैद्यकीय संभाव्यता किंवा निदान असा लावू नये. योग्य तपासणी, निदान आणि उपचारासाठी पात्र आरोग्यसेवा व्यावसायिकांचा सल्ला घ्या.",

      noExplanation:
        "गोळा केलेली माहिती आणि मशीन लर्निंग मॉडेल वापरून स्क्रीनिंग मूल्यांकन पूर्ण करण्यात आले.",

      downloadReport:
        "रिपोर्ट डाउनलोड करा",

      backToChat:
        "चॅटकडे परत जा",

      footer:
        "फक्त एमएल स्क्रीनिंग मार्गदर्शन",

      outsideDisclaimer:
        "हे मूल्यांकन केवळ स्क्रीनिंग मार्गदर्शन देते आणि पात्र वैद्यकीय व्यावसायिकांकडून होणाऱ्या निदान किंवा उपचारांचा पर्याय नाही.",

      no:
        "नाही",

      sometimes:
        "कधीकधी",

      yesOften:
        "होय / अनेकदा",

      notAvailable:
        "उपलब्ध नाही",

      features: {
        prolongedMinorCut:
          "किरकोळ कटानंतर दीर्घकाळ रक्तस्त्राव",

        postSurgery:
          "शस्त्रक्रियेनंतर जास्त रक्तस्त्राव",

        dental:
          "दातांच्या उपचारानंतर जास्त रक्तस्त्राव",

        easyBruising:
          "सहजपणे निळे डाग पडणे",

        muscleHematoma:
          "स्नायूंमध्ये सूज / हेमॅटोमा",

        recurrentJointBleeding:
          "वारंवार सांध्यांमध्ये रक्तस्त्राव",

        jointWarmth:
          "सांध्यांमध्ये उष्णता",

        jointTightness:
          "सांध्यांमध्ये ताठरपणा",

        reducedMobility:
          "सांध्यांची हालचाल कमी होणे",

        bloodUrine:
          "लघवीमध्ये रक्त",

        bloodStool:
          "शौचामध्ये रक्त",

        familyHistory:
          "रक्तस्त्रावाच्या विकाराचा कौटुंबिक इतिहास",

        maleRelative:
          "हिमोफिलिया असलेला पुरुष नातेवाईक",

        previousFactorTest:
          "पूर्वी फॅक्टर चाचणी झाली आहे",
      },
    },
  };

  const txt =
    TEXT[language] || TEXT.en;

  // =========================================================
  // LOAD REPORT + PROFILE
  // =========================================================

  let data = {};
  let profile = {};

  try {
    data = JSON.parse(
      localStorage.getItem("report") || "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read report data:",
      error
    );

    data = {};
  }

  try {
    profile = JSON.parse(
      localStorage.getItem("profile") || "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read profile data:",
      error
    );

    profile = {};
  }

  // =========================================================
  // SAFE JSON PARSER
  // =========================================================

  const parseJSON = (
    value,
    fallback = {}
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    if (
      typeof value === "object"
    ) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  // =========================================================
  // ML DATA
  // =========================================================

  const mlFeatures = parseJSON(
    data.mlFeatures ||
      data.features,
    {}
  );

  const mlProbabilities =
    parseJSON(
      data.mlProbabilities ||
        data.probabilities,
      {}
    );

  // =========================================================
  // ML PREDICTION NUMBER
  // =========================================================

  let predictionNumber = null;

  if (
    data.mlPrediction !==
      undefined &&
    data.mlPrediction !== null
  ) {
    predictionNumber =
      Number(data.mlPrediction);
  } else if (
    data.prediction !==
      undefined &&
    data.prediction !== null
  ) {
    predictionNumber =
      Number(data.prediction);
  }

  if (
    Number.isNaN(
      predictionNumber
    )
  ) {
    predictionNumber = null;
  }

  // =========================================================
  // ML LABEL
  // =========================================================

  const predictionLabels = {
    0: txt.healthy,
    1: txt.mild,
    2: txt.moderate,
    3: txt.severe,
  };

  /*
   * IMPORTANT:
   *
   * We use the numeric prediction first for translation.
   *
   * This prevents the English backend value
   * "Severe" from appearing when Hindi/Marathi
   * is selected.
   */

  const mlLabel =
    predictionNumber !== null &&
    predictionLabels[
      predictionNumber
    ]
      ? predictionLabels[
          predictionNumber
        ]
      : data.mlPredictionLabel ||
        data.predictionLabel ||
        txt.notAvailable;

  // =========================================================
  // ML PROBABILITY
  // =========================================================

  let probability = null;

  if (
    data.mlPredictionProbability !==
      undefined &&
    data.mlPredictionProbability !==
      null
  ) {
    probability = Number(
      data.mlPredictionProbability
    );
  } else if (
    data.predictionProbability !==
      undefined &&
    data.predictionProbability !==
      null
  ) {
    probability = Number(
      data.predictionProbability
    );
  }

  if (
    probability !== null &&
    Number.isNaN(probability)
  ) {
    probability = null;
  }

  let probabilityPercentage =
    null;

  if (probability !== null) {
    probabilityPercentage =
      probability <= 1
        ? probability * 100
        : probability;
  }

  // =========================================================
  // PROBABILITY BREAKDOWN
  // =========================================================

  const getProbability = (
    classNumber
  ) => {
    const value =
      mlProbabilities?.[
        classNumber
      ] ??
      mlProbabilities?.[
        String(classNumber)
      ];

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return null;
    }

    const percentage =
      numericValue <= 1
        ? numericValue * 100
        : numericValue;

    return percentage.toFixed(2);
  };

  // =========================================================
  // FEATURE LABELS
  // =========================================================

  const featureLabels = {
    age:
      txt.age,

    sex:
      txt.sex,

    prolonged_bleeding_minor_cut:
      txt.features.prolongedMinorCut,

    excessive_post_surgery_bleeding:
      txt.features.postSurgery,

    excessive_dental_bleeding:
      txt.features.dental,

    easy_bruising:
      txt.features.easyBruising,

    muscle_hematoma:
      txt.features.muscleHematoma,

    recurrent_joint_bleeding:
      txt.features.recurrentJointBleeding,

    joint_warmth:
      txt.features.jointWarmth,

    joint_tightness:
      txt.features.jointTightness,

    reduced_joint_mobility:
      txt.features.reducedMobility,

    hematuria:
      txt.features.bloodUrine,

    hematochezia:
      txt.features.bloodStool,

    family_history_bleeding_disorder:
      txt.features.familyHistory,

    male_relative_with_hemophilia:
      txt.features.maleRelative,

    previous_factor_test:
      txt.features.previousFactorTest,
  };

  // =========================================================
  // FORMAT FEATURE VALUE
  // =========================================================

  const formatFeatureValue = (
    key,
    value
  ) => {
    // AGE

    if (key === "age") {
      return value !==
        undefined &&
        value !== null
        ? `${value} ${txt.years}`
        : txt.notAvailable;
    }

    // SEX

    if (key === "sex") {
      if (
        value === 1 ||
        value === "1" ||
        value === "male" ||
        value === "Male"
      ) {
        return txt.male;
      }

      if (
        value === 0 ||
        value === "0" ||
        value === "female" ||
        value === "Female"
      ) {
        return txt.female;
      }

      return txt.notAvailable;
    }

    // =====================================================
    // ML MODEL ENCODING
    //
    // 0 = No / Never
    // 1 = Sometimes
    // 2 = Yes / Often
    // =====================================================

    const ordinalFeatures = [
      "prolonged_bleeding_minor_cut",
      "excessive_post_surgery_bleeding",
      "excessive_dental_bleeding",
      "easy_bruising",
      "muscle_hematoma",
      "recurrent_joint_bleeding",
      "joint_warmth",
      "joint_tightness",
      "reduced_joint_mobility",
      "hematuria",
      "hematochezia",
      "family_history_bleeding_disorder",
      "male_relative_with_hemophilia",
      "previous_factor_test",
    ];

    if (
      ordinalFeatures.includes(key)
    ) {
      const numericValue =
        Number(value);

      if (
        numericValue === 0
      ) {
        return txt.no;
      }

      if (
        numericValue === 1
      ) {
        return txt.sometimes;
      }

      if (
        numericValue === 2
      ) {
        return txt.yesOften;
      }

      return txt.notAvailable;
    }

    return String(
      value ??
        txt.notAvailable
    );
  };

  // =========================================================
  // AVAILABLE FEATURES
  // =========================================================

  const availableFeatures =
    Object.entries(
      mlFeatures || {}
    ).filter(
      ([key, value]) =>
        featureLabels[key] &&
        value !== undefined &&
        value !== null
    );

  // =========================================================
  // RESULT CSS CLASS
  // =========================================================

  const getResultClass = () => {
    if (
      predictionNumber === 0
    ) {
      return "result-healthy";
    }

    if (
      predictionNumber === 1
    ) {
      return "result-mild";
    }

    if (
      predictionNumber === 2
    ) {
      return "result-moderate";
    }

    if (
      predictionNumber === 3
    ) {
      return "result-severe";
    }

    return "";
  };

  // =========================================================
  // EXPLANATION
  // =========================================================

  let explanation = [];

  if (
    Array.isArray(
      data.explanation
    )
  ) {
    explanation =
      data.explanation;
  } else if (
    typeof data.explanation ===
      "string" &&
    data.explanation.trim()
  ) {
    explanation = [
      data.explanation,
    ];
  }

  /*
   * Translate the standard Random Forest
   * explanation according to selected language.
   */

  explanation =
    explanation.map(
      (item) => {
        if (
          typeof item ===
            "string" &&
          item
            .toLowerCase()
            .startsWith(
              "random forest prediction:"
            )
        ) {
          return `${txt.randomForestPrediction}: ${mlLabel}`;
        }

        return item;
      }
    );

  // =========================================================
  // DEFAULT EXPLANATION
  // =========================================================

  if (
    explanation.length === 0 &&
    mlLabel !==
      txt.notAvailable
  ) {
    explanation = [
      `${txt.randomForestPrediction}: ${mlLabel}`,
    ];
  }

  // =========================================================
  // EMERGENCY FLAG
  // =========================================================

  const emergencyFlag =
    data.emergencyFlag ===
      true ||
    data.emergencyFlag ===
      "true";

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const downloadPDF =
    async () => {
      const element =
        document.getElementById(
          "report-content"
        );

      if (!element) {
        return;
      }

      try {
        const canvas =
          await html2canvas(
            element,
            {
              scale: 2,
              backgroundColor:
                "#ffffff",
              useCORS: true,
            }
          );

        const imgData =
          canvas.toDataURL(
            "image/png"
          );

        const pdf =
          new jsPDF(
            "p",
            "mm",
            "a4"
          );

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const margin = 10;

        const pdfWidth =
          pageWidth -
          margin * 2;

        const pdfHeight =
          (canvas.height *
            pdfWidth) /
          canvas.width;

        let heightLeft =
          pdfHeight;

        let position =
          margin;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          pdfWidth,
          pdfHeight
        );

        heightLeft -=
          pageHeight -
          margin * 2;

        while (
          heightLeft > 0
        ) {
          position =
            heightLeft -
            pdfHeight +
            margin;

          pdf.addPage();

          pdf.addImage(
            imgData,
            "PNG",
            margin,
            position,
            pdfWidth,
            pdfHeight
          );

          heightLeft -=
            pageHeight -
            margin * 2;
        }

        pdf.save(
          "Hemophilia_Screening_Report.pdf"
        );
      } catch (error) {
        console.error(
          "PDF generation error:",
          error
        );

        alert(
          "Unable to generate the PDF. Please try again."
        );
      }
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="report-page">

      <div className="report-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="report-header">

          <div className="report-header-left">

            <div className="report-icon">
              +
            </div>

            <div>

              <h1>
                {txt.reportTitle}
              </h1>

              <p>
                {txt.reportSubtitle}
              </p>

            </div>

          </div>


          <div className="report-status">

            <span className="status-dot"></span>

            {txt.assessmentComplete}

          </div>

        </div>


        {/* =================================================
            REPORT CONTENT
        ================================================= */}

        <div
          id="report-content"
          className="report-content"
        >

          {/* =================================================
              REPORT TITLE
          ================================================= */}

          <div className="report-title-section">

            <div>

              <h2>
                {txt.screeningAssessment}
              </h2>

              <p>
                {txt.summary}
              </p>

            </div>


            <div className="report-badge">
              {txt.mlScreening}
            </div>

          </div>


          {/* =================================================
              PATIENT INFORMATION
          ================================================= */}

          <section className="report-section">

            <div className="section-heading">

              <span className="section-icon">
                👤
              </span>

              <h3>
                {txt.patientInformation}
              </h3>

            </div>


            <div className="patient-grid">

              <div className="patient-field">

                <span>
                  {txt.name}
                </span>

                <strong>
                  {profile.fullName ||
                    txt.notAvailable}
                </strong>

              </div>


              <div className="patient-field">

                <span>
                  {txt.patientId}
                </span>

                <strong>
                  {profile.patientId ||
                    txt.notAvailable}
                </strong>

              </div>


              {mlFeatures.age !==
                undefined && (

                <div className="patient-field">

                  <span>
                    {txt.age}
                  </span>

                  <strong>
                    {mlFeatures.age}{" "}
                    {txt.years}
                  </strong>

                </div>

              )}


              {mlFeatures.sex !==
                undefined && (

                <div className="patient-field">

                  <span>
                    {txt.sex}
                  </span>

                  <strong>
                    {formatFeatureValue(
                      "sex",
                      mlFeatures.sex
                    )}
                  </strong>

                </div>

              )}

            </div>

          </section>


          {/* =================================================
              ML SCREENING RESULT
          ================================================= */}

          <section className="risk-section">

            <div className="risk-header">

              <div>

                <span className="small-label">
                  {txt.mlScreeningResult}
                </span>

                <h3>
                  {txt.hemophiliaScreeningPrediction}
                </h3>

              </div>

            </div>


            <div className="risk-result">

              <div>

                <span className="risk-label">
                  {txt.predictedCategory}
                </span>

                <div
                  className={`risk-value ${getResultClass()}`}
                >
                  {mlLabel}
                </div>

              </div>


              {/* =================================================
                  MODEL PROBABILITY BOX
              ================================================= */}

              <div className="score-box">

                <span>
                  {txt.modelProbability}
                </span>

                <strong>
                  {probabilityPercentage !==
                    null
                    ? `${probabilityPercentage.toFixed(
                        2
                      )}%`
                    : txt.notAvailable}
                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              MODEL PROBABILITY BREAKDOWN
          ================================================= */}

          {Object.keys(
            mlProbabilities || {}
          ).length > 0 && (

            <section className="report-section">

              <div className="section-heading">

                <span className="section-icon">
                  📊
                </span>

                <h3>
                  {txt.probabilityBreakdown}
                </h3>

              </div>


              <div className="probability-list">

                {/* HEALTHY */}

                <div className="probability-item">

                  <span>
                    {txt.healthy}
                  </span>

                  <strong>
                    {getProbability(0) !==
                      null
                      ? `${getProbability(
                          0
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* MILD */}

                <div className="probability-item">

                  <span>
                    {txt.mild}
                  </span>

                  <strong>
                    {getProbability(1) !==
                      null
                      ? `${getProbability(
                          1
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* MODERATE */}

                <div className="probability-item">

                  <span>
                    {txt.moderate}
                  </span>

                  <strong>
                    {getProbability(2) !==
                      null
                      ? `${getProbability(
                          2
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* SEVERE */}

                <div className="probability-item">

                  <span>
                    {txt.severe}
                  </span>

                  <strong>
                    {getProbability(3) !==
                      null
                      ? `${getProbability(
                          3
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              SCREENING FEATURES
          ================================================= */}

          {availableFeatures.length >
            0 && (

            <section className="report-section">

              <div className="section-heading">

                <span className="section-icon">
                  🩺
                </span>

                <h3>
                  {txt.screeningInformation}
                </h3>

              </div>


              <div className="feature-grid">

                {availableFeatures.map(
                  ([key, value]) => (

                    <div
                      className="feature-item"
                      key={key}
                    >

                      <span>
                        {featureLabels[key]}
                      </span>

                      <strong>
                        {formatFeatureValue(
                          key,
                          value
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================================
              ASSESSMENT EXPLANATION
          ================================================= */}

          <section className="report-section">

            <div className="section-heading">

              <span className="section-icon">
                🔍
              </span>

              <h3>
                {txt.assessmentExplanation}
              </h3>

            </div>


            {explanation.length > 0 ? (

              <div className="explanation-list">

                {explanation.map(
                  (item, index) => (

                    <div
                      className="explanation-item"
                      key={index}
                    >

                      <span className="explanation-number">
                        {index + 1}
                      </span>

                      <span>
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="no-data">
                {txt.noExplanation}
              </p>

            )}

          </section>


          {/* =================================================
              EMERGENCY NOTICE
          ================================================= */}

          {emergencyFlag && (

            <div className="report-emergency">

              <div className="warning-icon">
                !
              </div>

              <div>

                <strong>
                  {txt.urgentMedicalAttention}
                </strong>

                <p>
                  {txt.emergencyText}
                </p>

              </div>

            </div>

          )}


          {/* =================================================
              IMPORTANT MEDICAL NOTICE
          ================================================= */}

          <div className="report-disclaimer">

            <div className="warning-icon">
              !
            </div>

            <div>

              <strong>
                {txt.importantMedicalNotice}
              </strong>

              <p>
                {txt.medicalNoticeText}
              </p>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="report-footer">

            <span>
              Hemophilia AI Assistant
            </span>

            <span>
              {txt.footer}
            </span>

          </div>

        </div>


        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="report-actions">

          <button
            className="download-button"
            onClick={downloadPDF}
          >
            📥 {txt.downloadReport}
          </button>


          <button
            className="back-button"
            onClick={() =>
              navigate("/chatbbot")
            }
          >
            🔙 {txt.backToChat}
          </button>

        </div>

      </div>


      {/* =================================================
          OUTSIDE DISCLAIMER
      ================================================= */}

      <div className="page-disclaimer">

        <span className="info-icon">
          i
        </span>

        {txt.outsideDisclaimer}

      </div>

    </div>
  );
}