import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import api from "../apiClient";

const DoctorRegistration = () => {
  const navigate = useNavigate();

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",

    // India-only registration
    country: "India",
    countryCode: "IN",

    stateProvince: "",
    stateCode: "",

    city: "",

    medicalRegistrationNumber: "",
    medicalCouncil: "",
    qualification: "",
    specialization: "",
    yearsOfExperience: "",
    hospitalName: "",
  });

  // =========================================================
  // DOCUMENTS
  // =========================================================

  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    professionalIdDocument: null,
  });

  // =========================================================
  // OTHER STATE
  // =========================================================

  const [declarationAccepted, setDeclarationAccepted] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // =========================================================
  // COUNTRIES
  // =========================================================

  // =========================================================
  // COUNTRY
  // India only
  // =========================================================

  const countries = useMemo(() => {
    return Country.getAllCountries().filter(
      (country) => country.isoCode === "IN"
    );
  }, []);

  // =========================================================
  // STATES / PROVINCES
  // =========================================================

  const states = useMemo(() => {
    if (!formData.countryCode) {
      return [];
    }

    return State.getStatesOfCountry(
      formData.countryCode
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [formData.countryCode]);

  // =========================================================
  // CITIES
  // =========================================================

  const cities = useMemo(() => {
    if (!formData.countryCode) {
      return [];
    }

    // If country has states/provinces,
    // get cities from selected state.
    if (formData.stateCode) {
      return City.getCitiesOfState(
        formData.countryCode,
        formData.stateCode
      ).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    // Some countries do not have state/province data.
    // In that case use the country's cities directly.
    return (
      City.getCitiesOfCountry(
        formData.countryCode
      ) || []
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [
    formData.countryCode,
    formData.stateCode,
  ]);

  // =========================================================
  // MEDICAL COUNCILS / REGULATORY AUTHORITIES
  // =========================================================

  const medicalCouncils = {
    Afghanistan: [
      "Afghanistan Medical Council",
    ],

    Albania: [
      "Albanian Order of Physicians",
    ],

    Algeria: [
      "Algerian Medical Regulatory Authority",
    ],

    Argentina: [
      "National / Provincial Medical Authorities",
    ],

    Australia: [
      "Medical Board of Australia",
    ],

    Austria: [
      "Austrian Medical Chamber",
    ],

    Bangladesh: [
      "Bangladesh Medical & Dental Council (BMDC)",
    ],

    Belgium: [
      "Order of Physicians / Ordre des Médecins",
    ],

    Brazil: [
      "Federal Council of Medicine (CFM)",
      "Regional Council of Medicine",
    ],

    Canada: [
      "Medical Council of Canada (MCC)",
      "Provincial / Territorial Medical Regulatory Authority",
    ],

    Chile: [
      "Chilean Medical Regulatory Authority",
    ],

    China: [
      "National Health Commission",
    ],

    Colombia: [
      "Colombian Medical Regulatory Authority",
    ],

    Croatia: [
      "Croatian Medical Chamber",
    ],

    "Czech Republic": [
      "Czech Medical Chamber",
    ],

    Denmark: [
      "Danish Patient Safety Authority",
    ],

    Egypt: [
      "Egyptian Medical Syndicate",
    ],

    Estonia: [
      "Estonian Health Board",
    ],

    Finland: [
      "Finnish Supervisory Authority for Health and Welfare",
    ],

    France: [
      "Ordre des Médecins",
    ],

    Germany: [
      "State Medical Chambers",
    ],

    Ghana: [
      "Medical and Dental Council of Ghana",
    ],

    Greece: [
      "Panhellenic Medical Association",
    ],

    Hungary: [
      "Hungarian Medical Chamber",
    ],

    Iceland: [
      "Directorate of Health",
    ],

    India: [
      "National Medical Commission (NMC)",
      "State Medical Council",
    ],

    Indonesia: [
      "Indonesian Medical Council",
    ],

    Ireland: [
      "Medical Council of Ireland",
    ],

    Israel: [
      "Israel Ministry of Health — Medical Licensing Authority",
    ],

    Italy: [
      "FNOMCeO — National Federation of Orders of Doctors",
    ],

    Japan: [
      "Ministry of Health, Labour and Welfare",
    ],

    Jordan: [
      "Jordan Medical Association",
    ],

    Kenya: [
      "Kenya Medical Practitioners and Dentists Council",
    ],

    Malaysia: [
      "Malaysian Medical Council (MMC)",
    ],

    Maldives: [
      "Maldives Medical and Dental Council",
    ],

    Mexico: [
      "Mexican Medical Regulatory Authority",
    ],

    Nepal: [
      "Nepal Medical Council",
    ],

    Netherlands: [
      "BIG-register",
    ],

    "New Zealand": [
      "Medical Council of New Zealand",
    ],

    Nigeria: [
      "Medical and Dental Council of Nigeria",
    ],

    Norway: [
      "Norwegian Directorate of Health",
    ],

    Oman: [
      "Oman Medical Specialty Board",
      "Ministry of Health",
    ],

    Pakistan: [
      "Pakistan Medical & Dental Council (PMDC)",
    ],

    Philippines: [
      "Professional Regulation Commission — Board of Medicine",
    ],

    Poland: [
      "Supreme Medical Chamber",
    ],

    Portugal: [
      "Ordem dos Médicos",
    ],

    Qatar: [
      "Department of Healthcare Professions",
    ],

    Romania: [
      "Romanian College of Physicians",
    ],

    Russia: [
      "Russian Medical Regulatory Authority",
    ],

    "Saudi Arabia": [
      "Saudi Commission for Health Specialties (SCFHS)",
    ],

    Singapore: [
      "Singapore Medical Council (SMC)",
    ],

    Slovakia: [
      "Slovak Medical Chamber",
    ],

    Slovenia: [
      "Medical Chamber of Slovenia",
    ],

    "South Africa": [
      "Health Professions Council of South Africa (HPCSA)",
    ],

    "South Korea": [
      "Ministry of Health and Welfare",
    ],

    Spain: [
      "Regional Medical Colleges",
    ],

    "Sri Lanka": [
      "Sri Lanka Medical Council (SLMC)",
    ],

    Sweden: [
      "National Board of Health and Welfare",
    ],

    Switzerland: [
      "Swiss Medical Association / Cantonal Medical Authorities",
    ],

    Taiwan: [
      "Taiwan Ministry of Health and Welfare",
    ],

    Thailand: [
      "Medical Council of Thailand",
    ],

    Turkey: [
      "Turkish Medical Association",
    ],

    Uganda: [
      "Uganda Medical and Dental Practitioners Council",
    ],

    Ukraine: [
      "Ukrainian Medical Regulatory Authority",
    ],

    "United Arab Emirates": [
      "Ministry of Health and Prevention (MOHAP)",
      "Department of Health — Abu Dhabi (DOH)",
      "Dubai Health Authority (DHA)",
    ],

    "United Kingdom": [
      "General Medical Council (GMC)",
    ],

    "United States": [
      "State Medical Board",
    ],

    Vietnam: [
      "Vietnam Ministry of Health",
    ],

    Zimbabwe: [
      "Medical and Dental Professions Council of Zimbabwe",
    ],
  };

  // =========================================================
  // QUALIFICATIONS
  // =========================================================

  const qualifications = [
    {
      short: "MBBS",
      full: "Bachelor of Medicine, Bachelor of Surgery",
    },
    {
      short: "MBChB",
      full: "Bachelor of Medicine, Bachelor of Surgery",
    },
    {
      short: "MD",
      full: "Doctor of Medicine",
    },
    {
      short: "DO",
      full: "Doctor of Osteopathic Medicine",
    },
    {
      short: "MS",
      full: "Master of Surgery",
    },
    {
      short : "BPT",
      full : "Bachelor of Physiotherapy",
    },{
      short : "MPT",
      full : "Master of Physiotherapy",
    },{
      short : "DPT",
      full :"Doctor of Physical Therapy",
    },
    {
      short: "DNB",
      full: "Diplomate of National Board",
    },
    {
      short: "DM",
      full: "Doctorate of Medicine",
    },
    {
      short: "MCh",
      full: "Master of Chirurgiae (Master of Surgery)",
    },
    {
      short: "MRCP",
      full: "Membership of the Royal Colleges of Physicians",
    },
    {
      short: "FRCP",
      full: "Fellow of the Royal Colleges of Physicians",
    },
    {
      short: "MRCS",
      full: "Membership of the Royal Colleges of Surgeons",
    },
    {
      short: "FRCS",
      full: "Fellow of the Royal Colleges of Surgeons",
    },
    {
      short: "MRCPCH",
      full:
        "Membership of the Royal College of Paediatrics and Child Health",
    },
    {
      short: "FRACP",
      full:
        "Fellow of the Royal Australasian College of Physicians",
    },
    {
      short: "FACP",
      full: "Fellow of the American College of Physicians",
    },
    {
      short: "FACG",
      full:
        "Fellow of the American College of Gastroenterology",
    },
    {
      short: "PhD",
      full: "Doctor of Philosophy",
    },
    {
      short: "Other",
      full: "Other Medical Qualification",
    },
  ];

  // =========================================================
  // MEDICAL SPECIALIZATIONS
  // =========================================================

  const specializations = [
    "Hematologist",
    "Hematologist-Oncologist",
    "Pediatric Hematologist",
    "Transfusion Medicine Specialist",

    "General Physician / Internist",
    "Family Medicine Specialist",
    "General Surgeon",

    "Cardiologist",
    "Interventional Cardiologist",
    "Cardiothoracic Surgeon",

    "Neurologist",
    "Neurosurgeon",

    "Pediatrician",
    "Pediatric Surgeon",

    "Medical Oncologist",
    "Surgical Oncologist",

    "Orthopedic Surgeon",

    "Dermatologist",
    "Psychiatrist",

    "Radiologist",
    "Interventional Radiologist",

    "Anesthesiologist",

    "Obstetrician & Gynecologist",

    "Ophthalmologist",

    "ENT Specialist",
    "Otolaryngologist",

    "Gastroenterologist",
    "Hepatologist",

    "Nephrologist",

    "Pulmonologist",
    "Respiratory Medicine Specialist",

    "Endocrinologist",

    "Rheumatologist",

    "Urologist",

    "Infectious Disease Specialist",

    "Emergency Medicine Specialist",

    "Pathologist",

    "Critical Care Specialist",
    "Intensive Care Specialist",

    "Geriatric Medicine Specialist",

    "Palliative Medicine Specialist",

    "Clinical Immunologist",

    "Vascular Surgeon",
    "Plastic Surgeon",
    "Colorectal Surgeon",
    "Bariatric Surgeon",

    "Rehabilitation Medicine Specialist",

    "Nuclear Medicine Specialist",

    "Forensic Medicine Specialist",

    "Preventive Medicine Specialist",

    "Other",
  ];

  // =========================================================
  // AVAILABLE MEDICAL COUNCILS
  // =========================================================

  const availableCouncils =
    medicalCouncils[formData.country] || [
      "Medical Regulatory Authority",
      "Other",
    ];

  // =========================================================
  // FORMAT FULL NAME
  // Capitalize the first letter of every name word.
  // Applied when the user leaves the Full Name field.
  // =========================================================

  const formatFullName = (name) => {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =========================================================
  // HANDLE INPUT CHANGES
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // -------------------------------------------------------
    // COUNTRY
    // India only
    // -------------------------------------------------------

    if (name === "countryCode") {
      const selectedCountry = countries.find(
        (country) => country.isoCode === value
      );

      setFormData((prev) => ({
        ...prev,

        country:
          selectedCountry?.name || "India",

        countryCode: value || "IN",

        stateProvince: "",
        stateCode: "",

        city: "",

        medicalCouncil: "",
      }));

      setError("");
      return;
    }

    // -------------------------------------------------------
    // STATE / PROVINCE
    // -------------------------------------------------------

    if (name === "stateCode") {
      const selectedState = states.find(
        (state) => state.isoCode === value
      );

      setFormData((prev) => ({
        ...prev,

        stateCode: value,

        stateProvince:
          selectedState?.name || "",

        city: "",
      }));

      setError("");
      return;
    }

    // -------------------------------------------------------
    // MOBILE NUMBER
    // Only digits, maximum 10 digits
    // -------------------------------------------------------

    if (name === "mobileNumber") {
      const digitsOnly = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobileNumber: digitsOnly,
      }));

      setError("");
      return;
    }

    // -------------------------------------------------------
    // NORMAL INPUT
    // -------------------------------------------------------

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // =========================================================
  // HANDLE FIELD BLUR
  // =========================================================

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      setFormData((prev) => ({
        ...prev,
        fullName: formatFullName(value),
      }));
    }
  };

  // =========================================================
  // HANDLE FILE CHANGES
  // =========================================================

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    // 5 MB maximum
    if (file.size > 5 * 1024 * 1024) {
      setError(
        `${file.name} is larger than 5 MB. Please select a smaller file.`
      );

      e.target.value = "";
      return;
    }

    // Allowed file types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only PDF, JPG, JPEG or PNG files are allowed."
      );

      e.target.value = "";
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [name]: file,
    }));

    setError("");
  };

  // =========================================================
  // SUBMIT REGISTRATION
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!formData.mobileNumber.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

    if (
      !/^[0-9]{10}$/.test(
        formData.mobileNumber.trim()
      )
    ) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (!formData.country.trim()) {
      setError("Please select a country.");
      return;
    }

    if (!formData.city.trim()) {
      setError("Please select a city.");
      return;
    }

    if (!formData.medicalRegistrationNumber.trim()) {
      setError(
        "Please enter your medical registration number."
      );
      return;
    }

    if (!formData.medicalCouncil.trim()) {
      setError(
        "Please select your medical council."
      );
      return;
    }

    if (!formData.qualification.trim()) {
      setError(
        "Please select your qualification."
      );
      return;
    }

    if (!formData.specialization.trim()) {
      setError(
        "Please select your specialization."
      );
      return;
    }

    if (
      formData.yearsOfExperience === "" ||
      formData.yearsOfExperience === null ||
      formData.yearsOfExperience === undefined
    ) {
      setError(
        "Please enter your years of experience."
      );
      return;
    }

    if (
      Number(formData.yearsOfExperience) < 0 ||
      Number(formData.yearsOfExperience) > 70
    ) {
      setError(
        "Years of experience must be between 0 and 70."
      );
      return;
    }

    if (!formData.hospitalName.trim()) {
      setError(
        "Please enter your hospital / organization."
      );
      return;
    }

    if (!documents.registrationCertificate) {
      setError(
        "Please upload your medical registration certificate."
      );
      return;
    }

    if (!documents.professionalIdDocument) {
      setError(
        "Please upload your professional ID document."
      );
      return;
    }

    if (!declarationAccepted) {
      setError(
        "You must accept the declaration before submitting."
      );
      return;
    }

    // =======================================================
    // CREATE FORM DATA
    // =======================================================

    setLoading(true);

    try {
      const data = new FormData();

      // -----------------------------------------------------
      // PERSONAL INFORMATION
      // -----------------------------------------------------

      data.append(
        "fullName",
        formData.fullName.trim()
      );

      data.append(
        "email",
        formData.email.trim()
      );

      data.append(
        "mobileNumber",
        formData.mobileNumber.trim()
      );

      // -----------------------------------------------------
      // LOCATION
      // -----------------------------------------------------

      data.append(
        "country",
        formData.country.trim()
      );

      data.append(
        "countryCode",
        formData.countryCode || ""
      );

      data.append(
        "stateProvince",
        formData.stateProvince.trim() || "N/A"
      );

      data.append(
        "stateCode",
        formData.stateCode || ""
      );

      data.append(
        "city",
        formData.city.trim()
      );

      // -----------------------------------------------------
      // PROFESSIONAL INFORMATION
      // -----------------------------------------------------

      data.append(
        "medicalRegistrationNumber",
        formData.medicalRegistrationNumber
          .trim()
          .toUpperCase()
      );

      data.append(
        "medicalCouncil",
        formData.medicalCouncil.trim()
      );

      data.append(
        "qualification",
        formData.qualification.trim()
      );

      data.append(
        "specialization",
        formData.specialization.trim()
      );

      data.append(
        "yearsOfExperience",
        String(formData.yearsOfExperience)
      );

      data.append(
        "hospitalName",
        formData.hospitalName.trim()
      );

      // -----------------------------------------------------
      // DECLARATION
      // -----------------------------------------------------

      data.append(
        "declarationAccepted",
        "true"
      );

      // -----------------------------------------------------
      // DOCUMENTS
      // IMPORTANT:
      // These names MUST match Multer backend names.
      // -----------------------------------------------------

      data.append(
        "registrationCertificate",
        documents.registrationCertificate
      );

      data.append(
        "professionalIdDocument",
        documents.professionalIdDocument
      );

      // =====================================================
      // DEBUG
      // =====================================================

      console.log(
        "========== DOCTOR REGISTRATION =========="
      );

      for (const [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}:`,
            value.name
          );
        } else {
          console.log(
            `${key}:`,
            value
          );
        }
      }

      console.log(
        "=========================================="
      );

      // =====================================================
      // API REQUEST
      // =====================================================

      const response = await api.post(
        "/doctor/register",
        data
        );

      console.log(
        "Doctor registration successful:",
        response.data
      );

      setSubmitted(true);

    } catch (error) {
      console.error(
        "Doctor registration error:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "";

      setError(
        serverMessage ||
          "Unable to submit doctor registration request. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SUCCESS PAGE
  // =========================================================

  if (submitted) {
    return (
      <div className="doctor-register-page">
        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Registration Submitted
          </h1>

          <p className="success-main">
            Your doctor registration details have
            been submitted successfully.
          </p>

          <p className="success-text">
            Your application is now waiting for
            administrator verification and approval.
          </p>

          <div className="info-box">

            <div className="info-icon">
              ✉
            </div>

            <div>
              <strong>
                What happens next?
              </strong>

              <p>
                Once your application is approved,
                your Doctor / Clinician ID and
                temporary password will be sent to
                your registered email address.
              </p>
            </div>

          </div>

          <p className="login-note">
            You can use those credentials to log in
            through the Doctor / Clinician Login page.
          </p>

          <button
            className="submit-btn success-btn"
            onClick={() =>
              navigate("/doctor-login")
            }
            type="button"
          >
            Go to Doctor Login
          </button>

          <button
            className="back-btn"
            onClick={() => navigate("/")}
            type="button"
          >
            ← Back to Patient Login
          </button>

        </div>

        <style>{`

          * {
            box-sizing: border-box;
          }

          .doctor-register-page {
            min-height: 100vh;
            width: 100%;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 40px 20px;

            background:
              radial-gradient(
                circle at 10% 10%,
                rgba(74,125,252,0.14),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 90%,
                rgba(99,102,241,0.12),
                transparent 30%
              ),
              linear-gradient(
                135deg,
                #f7faff 0%,
                #eef5ff 50%,
                #f8faff 100%
              );
          }

          .success-card {
            width: 600px;
            max-width: 100%;

            background: rgba(255,255,255,0.98);

            border-radius: 28px;

            padding: 55px;

            text-align: center;

            box-shadow:
              0 30px 80px
              rgba(45,76,120,0.15);

            border: 1px solid
              rgba(214,226,244,0.9);
          }

          .success-icon {
            width: 70px;
            height: 70px;

            margin: 0 auto 25px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background: #e8f7ee;

            color: #218838;

            font-size: 36px;

            font-weight: 700;
          }

          .success-card h1 {
            color: #163b63;

            font-size: 28px;

            font-weight: 700;

            margin: 0 0 15px;
          }

          .success-main {
            color: #345a7d;

            font-size: 16px;

            line-height: 1.6;

            margin: 0 0 10px;
          }

          .success-text {
            color: #6c8aa8;

            font-size: 14px;

            line-height: 1.6;

            margin: 0 0 25px;
          }

          .info-box {
            display: flex;

            align-items: flex-start;

            gap: 14px;

            text-align: left;

            background: #f3f8ff;

            border: 1px solid #d8e6f7;

            border-radius: 14px;

            padding: 18px;

            margin-bottom: 20px;
          }

          .info-icon {
            width: 38px;
            height: 38px;

            flex-shrink: 0;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background: #e0ecff;

            color: #4a7dfc;

            font-size: 18px;
          }

          .info-box strong {
            display: block;

            color: #163b63;

            font-size: 14px;

            margin-bottom: 5px;
          }

          .info-box p {
            margin: 0;

            color: #6c8aa8;

            font-size: 13px;

            line-height: 1.6;
          }

          .login-note {
            color: #6c8aa8;

            font-size: 13px;

            line-height: 1.5;

            margin-bottom: 25px;
          }

          .success-btn {
            max-width: 320px;
            margin: 0 auto;
          }

          .back-btn {
            display: block;

            margin: 20px auto 0;

            background: transparent;

            border: none;

            color: #4a7dfc;

            font-size: 13px;

            font-weight: 600;

            cursor: pointer;
          }

          .back-btn:hover {
            text-decoration: underline;
          }

          @media (max-width: 600px) {

            .doctor-register-page {
              padding: 20px 15px;
            }

            .success-card {
              padding: 40px 25px;
              border-radius: 22px;
            }

            .success-card h1 {
              font-size: 25px;
            }

          }

        `}</style>
      </div>
    );
  }

  // =========================================================
  // MAIN FORM
  // =========================================================

  return (
    <div className="doctor-register-page">

      <div className="registration-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="registration-header">

          <button
            className="top-back-btn"
            onClick={() =>
              navigate("/doctor-login")
            }
            type="button"
          >
            ← Back to Login
          </button>

          <div className="header-icon">
            ⚕
          </div>

          <h1>
            physiotherapist Registration
          </h1>

          <p>
            Submit your professional details for
            verification and approval.
          </p>

        </div>

        {/* ===================================================
            FORM
        =================================================== */}

        <form onSubmit={handleSubmit}>

          {/* =================================================
              SECTION 1
          ================================================= */}

          <div className="section">

            <div className="section-heading">

              <div className="section-number">
                1
              </div>

              <div>
                <h2>
                  Personal Information
                </h2>

                <p>
                  Provide your basic contact details.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* FULL NAME */}

              <div className="field full-width">

                <label>
                  Full Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="name"
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="field">

                <label>
                  Email Address
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your professional email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

              </div>

              {/* MOBILE */}

              <div className="field">

                <label>
                  Mobile Number
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  autoComplete="tel"
                  required
                />

              </div>

              {/* COUNTRY */}

              <div className="field">

                <label>
                  Country
                  <span>*</span>
                </label>

                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  required
                >
                  <option value="IN">
                    India
                  </option>
                </select>

              </div>

              {/* STATE / PROVINCE */}

              <div className="field">

                <label>
                  State / Province
                  <span>*</span>
                </label>

                <select
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleChange}
                  disabled={
                    !formData.countryCode ||
                    states.length === 0
                  }
                  required={
                    states.length > 0
                  }
                >

                  <option value="">
                    {!formData.countryCode
                      ? "Select country first"
                      : states.length > 0
                      ? "Select state / province"
                      : "Not applicable"}
                  </option>

                  {states.map((state) => (
                    <option
                      key={`${state.countryCode}-${state.isoCode}`}
                      value={state.isoCode}
                    >
                      {state.name}
                    </option>
                  ))}

                </select>

                {formData.countryCode &&
                  states.length === 0 && (
                    <div className="field-hint">
                      This country does not have
                      state/province data available.
                    </div>
                  )}

              </div>

              {/* CITY */}

              <div className="field">

                <label>
                  City
                  <span>*</span>
                </label>

                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={
                    !formData.countryCode ||
                    (
                      states.length > 0 &&
                      !formData.stateCode
                    )
                  }
                  required
                >

                  <option value="">
                    {!formData.countryCode
                      ? "Select country first"
                      : states.length > 0 &&
                        !formData.stateCode
                      ? "Select state / province first"
                      : "Select city"}
                  </option>

                  {cities.map((city, index) => (
                    <option
                      key={`${city.countryCode}-${city.stateCode || "none"}-${city.name}-${index}`}
                      value={city.name}
                    >
                      {city.name}
                    </option>
                  ))}

                </select>

                {formData.countryCode &&
                  states.length > 0 &&
                  !formData.stateCode && (
                    <div className="field-hint">
                      Select a state/province first.
                    </div>
                  )}

                {formData.stateCode &&
                  cities.length === 0 && (
                    <div className="field-hint">
                      No city list is available for
                      this region.
                    </div>
                  )}

              </div>

            </div>

          </div>

          {/* =================================================
              SECTION 2
          ================================================= */}

          <div className="section">

            <div className="section-heading">

              <div className="section-number">
                2
              </div>

              <div>
                <h2>
                  Professional Information
                </h2>

                <p>
                  Provide your medical qualifications
                  and professional details.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* MEDICAL REGISTRATION NUMBER */}

              <div className="field">

                <label>
                  Medical Registration Number
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="medicalRegistrationNumber"
                  placeholder="Enter registration number"
                  value={
                    formData.medicalRegistrationNumber
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              {/* MEDICAL COUNCIL */}

              <div className="field">

                <label>
                  Medical Council /
                  Regulatory Authority
                  <span>*</span>
                </label>

                <select
                  name="medicalCouncil"
                  value={
                    formData.medicalCouncil
                  }
                  onChange={handleChange}
                  disabled={!formData.country}
                  required
                >

                  <option value="">
                    {!formData.country
                      ? "Select country first"
                      : "Select medical council"}
                  </option>

                  {availableCouncils.map(
                    (council, index) => (
                      <option
                        key={`${council}-${index}`}
                        value={council}
                      >
                        {council}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* QUALIFICATION */}

              <div className="field">

                <label>
                  Medical Qualification
                  <span>*</span>
                </label>

                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select your qualification
                  </option>

                  {qualifications.map(
                    (qualification) => (
                      <option
                        key={qualification.short}
                        value={qualification.short}
                      >
                        {qualification.short}
                        {" — "}
                        {qualification.full}
                      </option>
                    )
                  )}

                </select>

                {formData.qualification && (
                  <div className="selected-info">

                    <strong>
                      Qualification:
                    </strong>{" "}

                    {
                      qualifications.find(
                        (item) =>
                          item.short ===
                          formData.qualification
                      )?.full
                    }

                  </div>
                )}

              </div>

              {/* SPECIALIZATION */}

              <div className="field">

                <label>
                  Medical Specialization
                  <span>*</span>
                </label>

                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select your specialization
                  </option>

                  {specializations.map(
                    (specialization) => (
                      <option
                        key={specialization}
                        value={specialization}
                      >
                        {specialization}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* HOSPITAL */}

              <div className="field">

                <label>
                  Hospital / Organization
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="hospitalName"
                  placeholder="Enter hospital / organization"
                  value={
                    formData.hospitalName
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              {/* EXPERIENCE */}

              <div className="field">

                <label>
                  Years of Experience
                  <span>*</span>
                </label>

                <input
                  type="number"
                  name="yearsOfExperience"
                  placeholder="e.g. 5"
                  min="0"
                  max="70"
                  value={
                    formData.yearsOfExperience
                  }
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </div>

          {/* =================================================
              SECTION 3
          ================================================= */}

          <div className="section">

            <div className="section-heading">

              <div className="section-number">
                3
              </div>

              <div>
                <h2>
                  Professional Documents
                </h2>

                <p>
                  Upload valid documents for
                  administrator verification.
                </p>
              </div>

            </div>

            <div className="documents-grid">

              {/* REGISTRATION CERTIFICATE */}

              <div className="file-box">

                <div className="file-header">

                  <div className="file-icon">
                    📄
                  </div>

                  <div>

                    <label>
                      Medical Registration Certificate
                      <span>*</span>
                    </label>

                    <p>
                      Official medical registration
                      certificate
                    </p>

                  </div>

                </div>

                <input
                  type="file"
                  name="registrationCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />

                {documents.registrationCertificate && (
                  <div className="file-name">

                    <span>✓</span>

                    <span>
                      {
                        documents
                          .registrationCertificate
                          .name
                      }
                    </span>

                  </div>
                )}

                <small>
                  PDF, JPG, JPEG or PNG •
                  Maximum 5 MB
                </small>

              </div>

              {/* PROFESSIONAL ID */}

              <div className="file-box">

                <div className="file-header">

                  <div className="file-icon">
                    🪪
                  </div>

                  <div>

                    <label>
                      Professional ID Document
                      <span>*</span>
                    </label>

                    <p>
                      Government / professional
                      identification document
                    </p>

                  </div>

                </div>

                <input
                  type="file"
                  name="professionalIdDocument"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />

                {documents.professionalIdDocument && (
                  <div className="file-name">

                    <span>✓</span>

                    <span>
                      {
                        documents
                          .professionalIdDocument
                          .name
                      }
                    </span>

                  </div>
                )}

                <small>
                  PDF, JPG, JPEG or PNG •
                  Maximum 5 MB
                </small>

              </div>

            </div>

          </div>

          {/* =================================================
              VERIFICATION NOTICE
          ================================================= */}

          <div className="notice">

            <div className="notice-icon">
              ✓
            </div>

            <div>

              <strong>
                Verification & Approval Process
              </strong>

              <p>
                Your registration will first be
                reviewed by the administrator.
                No login credentials are created
                during registration. If your
                application is approved, your
                Doctor / Clinician ID and temporary
                password will be sent to your
                registered email address.
              </p>

            </div>

          </div>

          {/* =================================================
              DECLARATION
          ================================================= */}

          <div className="declaration-box">

            <label className="declaration-label">

              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) =>
                  setDeclarationAccepted(
                    e.target.checked
                  )
                }
              />

              <span>
                I declare that the information
                provided above is true and
                accurate to the best of my
                knowledge, and I authorize the
                administrator to verify my
                professional credentials and
                submitted documents.
              </span>

            </label>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="error">

              <span>⚠</span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            className="submit-btn"
            type="submit"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="spinner"></span>

                Submitting Application...
              </>
            ) : (
              <>
                Submit Registration

                <span className="arrow">
                  →
                </span>
              </>
            )}

          </button>

          <p className="required-note">
            <span>*</span>{" "}
            Required fields
          </p>

        </form>

      </div>

      <style>{`
        /* =====================================================
           REGISTRATION PAGE
        ===================================================== */

        .doctor-register-page {
          min-height: 100vh;
          width: 100%;
          padding: 38px 22px 55px;
          box-sizing: border-box;

          display: flex;
          justify-content: center;
          align-items: flex-start;

          background:
            radial-gradient(
              circle at 8% 5%,
              rgba(74,125,252,0.12),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 95%,
              rgba(99,102,241,0.09),
              transparent 28%
            ),
            #f4f8fe;
        }

        /* =====================================================
           REGISTRATION CARD
        ===================================================== */

        .registration-card {
          width: min(1080px, 100%);
          margin: 0 auto;

          background: #ffffff;
          border: 1px solid #e1eaf5;
          border-radius: 24px;

          padding: 42px 52px 46px;
          box-sizing: border-box;

          box-shadow:
            0 22px 65px rgba(40,75,120,0.12);
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .registration-header {
          position: relative;
          text-align: center;
          padding-top: 2px;
          margin-bottom: 38px;
        }

        .top-back-btn {
          position: absolute;
          left: 0;
          top: 0;

          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 8px 11px;

          background: #f5f8ff;
          border: 1px solid #dce7f5;
          border-radius: 8px;

          color: #426fcf;
          font-size: 12px;
          font-weight: 650;

          cursor: pointer;
          transition: 0.2s ease;
        }

        .top-back-btn:hover {
          background: #edf3ff;
          border-color: #c7d8f0;
          transform: translateX(-2px);
        }

        .header-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          background:
            linear-gradient(
              135deg,
              #4a7dfc,
              #638bff
            );

          color: #ffffff;
          font-size: 27px;

          box-shadow:
            0 10px 25px rgba(74,125,252,0.22);
        }

        .registration-header h1 {
          margin: 0 0 8px;

          color: #163b63;
          font-size: 30px;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.4px;
        }

        .registration-header p {
          margin: 0;

          color: #718aa4;
          font-size: 13px;
          line-height: 1.6;
        }

        /* =====================================================
           SECTIONS
        ===================================================== */

        .section {
          margin-bottom: 28px;
          padding-bottom: 28px;

          border-bottom: 1px solid #e8eef6;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 12px;

          margin-bottom: 21px;
        }

        .section-number {
          width: 34px;
          height: 34px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #edf3ff;
          color: #4a7dfc;

          font-size: 13px;
          font-weight: 700;
        }

        .section-heading h2 {
          margin: 0 0 3px;

          color: #183f65;
          font-size: 17px;
          font-weight: 700;
        }

        .section-heading p {
          margin: 0;

          color: #8aa0b8;
          font-size: 11px;
          line-height: 1.5;
        }

        /* =====================================================
           FORM GRID
        ===================================================== */

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        /* =====================================================
           LABELS
        ===================================================== */

        .field label,
        .file-box label {
          margin-bottom: 7px;

          color: #345a7d;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 650;
        }

        .field label span,
        .file-box label span {
          color: #d93025;
          margin-left: 3px;
        }

        /* =====================================================
           INPUTS / SELECTS
        ===================================================== */

        .field input,
        .field select {
          width: 100%;
          height: 49px;

          padding: 0 14px;
          box-sizing: border-box;

          border: 1px solid #d7e2ef;
          border-radius: 9px;

          background: #f9fbfe;
          color: #163b63;

          font-family: inherit;
          font-size: 13px;

          outline: none;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .field input::placeholder {
          color: #a1b1c2;
        }

        .field input:focus,
        .field select:focus {
          background: #ffffff;
          border-color: #4a7dfc;

          box-shadow:
            0 0 0 3px rgba(74,125,252,0.08);
        }

        .field select {
          cursor: pointer;
        }

        .field select:disabled {
          background: #f0f3f7;
          color: #9aaabd;
          cursor: not-allowed;
        }

        .field select option {
          color: #163b63;
          background: #ffffff;
        }

        /* =====================================================
           HINT / SELECTED INFO
        ===================================================== */

        .field-hint {
          margin-top: 6px;

          color: #8aa0b8;
          font-size: 10px;
          line-height: 1.4;
        }

        .selected-info {
          margin-top: 7px;
          padding: 8px 10px;

          border-radius: 8px;
          background: #f3f8ff;
          border: 1px solid #dce9f8;

          color: #6c8aa8;
          font-size: 10px;
          line-height: 1.5;
        }

        .selected-info strong {
          color: #345a7d;
        }

        /* =====================================================
           DOCUMENTS
        ===================================================== */

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .file-box {
          min-width: 0;
          padding: 18px;

          border: 1px dashed #c7d7ea;
          border-radius: 13px;

          background: #f8fbff;
          transition: 0.2s ease;
        }

        .file-box:hover {
          background: #f5f9ff;
          border-color: #9eb9e4;
        }

        .file-header {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          margin-bottom: 13px;
        }

        .file-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;
          background: #eaf1ff;

          font-size: 18px;
        }

        .file-header label {
          display: block;
          margin-bottom: 3px;
        }

        .file-header p {
          margin: 0;

          color: #8aa0b8;
          font-size: 10px;
          line-height: 1.5;
        }

        .file-box input[type="file"] {
          width: 100%;
          padding: 9px;

          box-sizing: border-box;

          border: 1px solid #d8e3f2;
          border-radius: 8px;

          background: #ffffff;
          color: #6c8aa8;

          font-size: 11px;
          cursor: pointer;
        }

        .file-box input[type="file"]::file-selector-button {
          margin-right: 9px;
          padding: 6px 10px;

          border: none;
          border-radius: 6px;

          background: #eaf1ff;
          color: #4a7dfc;

          font-size: 10px;
          font-weight: 650;

          cursor: pointer;
        }

        .file-name {
          margin-top: 9px;
          padding: 8px 9px;

          display: flex;
          align-items: center;
          gap: 7px;

          border-radius: 7px;
          background: #eaf6ef;

          color: #218838;
          font-size: 10px;
        }

        .file-name span:last-child {
          word-break: break-word;
        }

        .file-box small {
          display: block;
          margin-top: 7px;

          color: #9aabba;
          font-size: 9px;
        }

        /* =====================================================
           VERIFICATION NOTICE
        ===================================================== */

        .notice {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          padding: 15px;
          margin-bottom: 17px;

          border: 1px solid #d8e6f7;
          border-radius: 11px;

          background: #f3f8ff;
        }

        .notice-icon {
          width: 29px;
          height: 29px;
          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;
          background: #e0ecff;

          color: #4a7dfc;
          font-size: 13px;
          font-weight: 700;
        }

        .notice strong {
          display: block;
          margin-bottom: 4px;

          color: #163b63;
          font-size: 12px;
        }

        .notice p {
          margin: 0;

          color: #6c8aa8;
          font-size: 11px;
          line-height: 1.6;
        }

        /* =====================================================
           DECLARATION
        ===================================================== */

        .declaration-box {
          margin-bottom: 16px;
          padding: 14px;

          border: 1px solid #e0e8f3;
          border-radius: 11px;

          background: #fbfcff;
        }

        .declaration-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          cursor: pointer;
        }

        .declaration-label input {
          width: 16px;
          height: 16px;
          flex-shrink: 0;

          margin-top: 2px;

          accent-color: #4a7dfc;
          cursor: pointer;
        }

        .declaration-label span {
          color: #5e7895;
          font-size: 11px;
          line-height: 1.6;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          margin-bottom: 14px;
          padding: 11px;

          border: 1px solid #ffd1d1;
          border-radius: 9px;

          background: #fff1f1;
          color: #d93025;

          font-size: 12px;
          line-height: 1.5;
          text-align: center;
        }

        /* =====================================================
           SUBMIT BUTTON
        ===================================================== */

        .submit-btn {
          width: 100%;
          min-height: 52px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          padding: 13px 18px;

          border: none;
          border-radius: 10px;

          background:
            linear-gradient(
              90deg,
              #4a7dfc,
              #5f8dff
            );

          color: #ffffff;

          font-size: 13px;
          font-weight: 650;

          cursor: pointer;
          transition: 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 9px 22px rgba(74,125,252,0.25);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .arrow {
          font-size: 17px;
          line-height: 1;
        }

        .spinner {
          width: 15px;
          height: 15px;

          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #ffffff;

          border-radius: 50%;

          animation:
            doctorSpin 0.7s linear infinite;
        }

        @keyframes doctorSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .required-note {
          margin: 10px 0 0;

          color: #8aa0b8;
          font-size: 10px;
          text-align: center;
        }

        .required-note span {
          color: #d93025;
        }

        /* =====================================================
           SUCCESS CARD
        ===================================================== */

        .success-card {
          width: min(600px, 100%);
          max-width: 100%;

          padding: 52px;

          box-sizing: border-box;

          text-align: center;

          background: #ffffff;

          border: 1px solid #e1eaf5;
          border-radius: 24px;

          box-shadow:
            0 25px 70px rgba(45,76,120,0.13);
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 750px) {

          .doctor-register-page {
            padding: 20px 12px 35px;
          }

          .registration-card {
            padding: 30px 22px 34px;
            border-radius: 20px;
          }

          .registration-header {
            padding-top: 48px;
            margin-bottom: 30px;
          }

          .top-back-btn {
            left: 0;
            top: 0;
          }

          .registration-header h1 {
            font-size: 25px;
            line-height: 1.3;
          }

          .registration-header p {
            font-size: 12px;
          }

          .form-grid,
          .documents-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }

          .section {
            margin-bottom: 24px;
            padding-bottom: 24px;
          }

          .field input,
          .field select {
            height: 50px;
            font-size: 13px;
          }

          .notice {
            padding: 13px;
          }

          .notice p {
            font-size: 10px;
          }

          .success-card {
            padding: 40px 24px;
            border-radius: 20px;
          }

          .success-card h1 {
            font-size: 24px;
          }
        }

        @media (max-width: 400px) {

          .registration-card {
            padding: 24px 15px 30px;
          }

          .registration-header h1 {
            font-size: 22px;
          }

          .section-heading {
            gap: 9px;
          }

          .section-number {
            width: 30px;
            height: 30px;

            border-radius: 8px;
            font-size: 12px;
          }

          .file-box {
            padding: 14px;
          }

          .top-back-btn {
            font-size: 11px;
          }
        }
`}</style>

    </div>
  );
};

export default DoctorRegistration;