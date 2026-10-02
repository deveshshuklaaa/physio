
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");

const DoctorRegistrationRequest = require(
  "../models/DoctorRegistrationRequest"
);

const adminAuth = require("../middleware/adminAuth");

const {
  sendDoctorCredentials,
  sendDoctorRejectionEmail,
  sendAdminCredentials,
} = require("../services/emailService");

const { createLoginOTP, verifyLoginOTP } = require("../services/otpService");

const router = express.Router();

// =====================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================================

router.get(
  "/dashboard",
  adminAuth,
  async (req, res) => {
    try {
      // =================================================
      // DOCTOR REQUEST COUNTS
      // =================================================

      const pendingDoctorRequests =
        await DoctorRegistrationRequest.countDocuments({
          status: "PENDING",
        });

      const approvedDoctorRequests =
        await DoctorRegistrationRequest.countDocuments({
          status: "APPROVED",
        });

      const rejectedDoctorRequests =
        await DoctorRegistrationRequest.countDocuments({
          status: "REJECTED",
        });

      // =================================================
      // DOCTOR COUNTS
      // =================================================

      const totalDoctors =
        await User.countDocuments({
          role: "doctor",
        });

      const activeDoctors =
        await User.countDocuments({
          role: "doctor",
          accountStatus: "APPROVED",
        });

      // =================================================
      // RECENT REQUESTS
      // =================================================

      const recentRequests =
        await DoctorRegistrationRequest.find({})
          .sort({
            createdAt: -1,
          })
          .limit(8)
          .select(
            "fullName email specialization hospitalName medicalRegistrationNumber roleRequested status createdAt"
          )
          .lean();

      // =================================================
      // TODAY'S APPROVALS
      // =================================================

      const startOfToday =
        new Date();

      startOfToday.setHours(
        0,
        0,
        0,
        0
      );

      const approvedToday =
        await DoctorRegistrationRequest.countDocuments({
          status: "APPROVED",

          reviewedAt: {
            $gte: startOfToday,
          },
        });

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        stats: {
          pendingDoctorRequests,

          totalDoctors,

          activeDoctors,

          approvedDoctorRequests,

          rejectedDoctorRequests,

          approvedToday,
        },

        recentRequests,
      });

    } catch (error) {

      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load admin dashboard",
      });
    }
  }
);

// =====================================================
// GET APPROVED DOCTORS
// GET /api/admin/doctors
// =====================================================
//
// This endpoint returns only approved doctor accounts.
//
// Doctor account information comes from:
// User
//
// Registration / professional information comes from:
// DoctorRegistrationRequest
//
// They are connected using the doctor's email address.
// =====================================================

// =====================================================
// GET ALL APPROVED DOCTORS
// GET /api/admin/doctors
// =====================================================

router.get(
  "/doctors",
  adminAuth,
  async (req, res) => {
    try {
      // =================================================
      // GET APPROVED DOCTOR ACCOUNTS
      // =================================================

      const doctors =
        await User.find({
          role: "doctor",
          accountStatus: "APPROVED",
        })
          .select(
            "_id fullName email professionalId role accountStatus mustChangePassword createdAt"
          )
          .lean();

      // =================================================
      // GET APPROVED REGISTRATION REQUESTS
      // =================================================

      const approvedRequests =
        await DoctorRegistrationRequest.find({
          status: "APPROVED",
        })
          .select(
            "fullName email mobileNumber country stateProvince city medicalRegistrationNumber medicalCouncil qualification specialization yearsOfExperience hospitalName status createdAt reviewedAt reviewedBy"
          )
          .lean();

      // =================================================
      // CREATE EMAIL LOOKUP
      // =================================================

      const requestByEmail =
        new Map();

      approvedRequests.forEach(
        (request) => {
          if (!request.email) {
            return;
          }

          requestByEmail.set(
            String(request.email)
              .trim()
              .toLowerCase(),
            request
          );
        }
      );

      // =================================================
      // GET ADMIN IDs WHO APPROVED DOCTORS
      // =================================================

      const reviewerIds =
        approvedRequests
          .map(
            (request) =>
              request.reviewedBy
          )
          .filter(Boolean);

      // =================================================
      // FIND ADMIN USERS
      // =================================================

      const reviewers =
        await User.find({
          _id: {
            $in: reviewerIds,
          },
        })
          .select(
            "_id fullName email role"
          )
          .lean();

      // =================================================
      // CREATE ADMIN LOOKUP
      // =================================================

      const reviewerById =
        new Map();

      reviewers.forEach(
        (admin) => {
          reviewerById.set(
            String(admin._id),
            admin
          );
        }
      );

      // =================================================
      // COMBINE USER + REGISTRATION DATA
      // =================================================

      const result =
        doctors.map(
          (doctor) => {
            const emailKey =
              String(
                doctor.email || ""
              )
                .trim()
                .toLowerCase();

            const request =
              requestByEmail.get(
                emailKey
              );

            // =================================================
            // FIND ADMIN WHO APPROVED THIS DOCTOR
            // =================================================

            const reviewer =
              request?.reviewedBy
                ? reviewerById.get(
                    String(
                      request.reviewedBy
                    )
                  )
                : null;

            return {
              // =================================================
              // USER ACCOUNT
              // =================================================

              _id:
                doctor._id,

              fullName:
                doctor.fullName ||
                request?.fullName ||
                "",

              email:
                doctor.email ||
                request?.email ||
                "",

              professionalId:
                doctor.professionalId ||
                "",

              role:
                doctor.role,

              accountStatus:
                doctor.accountStatus,

              mustChangePassword:
                doctor.mustChangePassword ===
                true,

              doctorCreatedAt:
                doctor.createdAt,

              // =================================================
              // REGISTRATION INFORMATION
              // =================================================

              mobileNumber:
                request?.mobileNumber ||
                "",

              country:
                request?.country ||
                "",

              stateProvince:
                request?.stateProvince ||
                "",

              city:
                request?.city ||
                "",

              medicalRegistrationNumber:
                request?.medicalRegistrationNumber ||
                "",

              medicalCouncil:
                request?.medicalCouncil ||
                "",

              qualification:
                request?.qualification ||
                "",

              specialization:
                request?.specialization ||
                "",

              yearsOfExperience:
                request?.yearsOfExperience ??
                "",

              hospitalName:
                request?.hospitalName ||
                "",

              // =================================================
              // APPROVAL INFORMATION
              // =================================================

              registrationDate:
                request?.createdAt ||
                null,

              approvedAt:
                request?.reviewedAt ||
                null,

              // =================================================
              // APPROVED BY
              // FULL NAME OF ADMINISTRATOR
              // =================================================

              approvedBy:
                reviewer?.fullName ||
                "Administrator",

              // Keep reviewer ID also
              // in case we need it later

              reviewedBy:
                request?.reviewedBy ||
                null,

              registrationStatus:
                request?.status ||
                "APPROVED",
            };
          }
        );

      // =================================================
      // SORT BY DOCTOR NAME
      // =================================================

      result.sort(
        (a, b) =>
          String(
            a.fullName || ""
          ).localeCompare(
            String(
              b.fullName || ""
            )
          )
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        count:
          result.length,

        doctors:
          result,
      });
    } catch (error) {
      console.error(
        "GET APPROVED DOCTORS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load approved doctors",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);


// =====================================================
// GET ONE DOCTOR REGISTRATION REQUEST
// GET /api/admin/doctor-requests/:requestId
// =====================================================

router.get(
  "/doctor-requests/:requestId",
  adminAuth,
  async (req, res) => {
    try {
      const {
        requestId,
      } = req.params;

      // =================================================
      // FIND REQUEST
      // =================================================

      const request =
        await DoctorRegistrationRequest.findById(
          requestId
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Doctor registration request not found",
        });
      }

      // =================================================
      // FIND ADMIN WHO REVIEWED THE REQUEST
      // =================================================

      let reviewer = null;

      if (request.reviewedBy) {
        reviewer =
          await User.findById(
            request.reviewedBy
          )
            .select(
              "_id fullName email role"
            )
            .lean();
      }

      // =================================================
      // RETURN REQUEST DETAILS
      // =================================================

      return res.status(200).json({
        success: true,

        request: {
          // =================================================
          // BASIC INFORMATION
          // =================================================

          _id:
            request._id,

          fullName:
            request.fullName,

          email:
            request.email,

          mobileNumber:
            request.mobileNumber,

          // =================================================
          // PROFESSIONAL INFORMATION
          // =================================================

          medicalRegistrationNumber:
            request.medicalRegistrationNumber,

          medicalCouncil:
            request.medicalCouncil,

          qualification:
            request.qualification,

          specialization:
            request.specialization,

          yearsOfExperience:
            request.yearsOfExperience,

          hospitalName:
            request.hospitalName,

          // =================================================
          // LOCATION
          // =================================================

          country:
            request.country,

          stateProvince:
            request.stateProvince,

          city:
            request.city,

          // =================================================
          // DOCUMENTS
          // =================================================

          registrationCertificate: {
            fileName:
              request.registrationCertificateName,

            mimeType:
              request.registrationCertificateMimeType,

            size:
              request.registrationCertificate
                ? request.registrationCertificate.length
                : 0,
          },

          professionalIdDocument: {
            fileName:
              request.professionalIdDocumentName,

            mimeType:
              request.professionalIdDocumentMimeType,

            size:
              request.professionalIdDocument
                ? request.professionalIdDocument.length
                : 0,
          },

          // =================================================
          // DECLARATION
          // =================================================

          declarationAccepted:
            request.declarationAccepted,

          // =================================================
          // STATUS
          // =================================================

          status:
            request.status,

          rejectionReason:
            request.rejectionReason ||
            null,

          // =================================================
          // REVIEW INFORMATION
          // =================================================

          reviewedBy:
            request.reviewedBy ||
            null,

          // FULL NAME OF ADMIN WHO APPROVED/REVIEWED
          approvedBy:
            reviewer?.fullName ||
            null,

          reviewedAt:
            request.reviewedAt ||
            null,

          // =================================================
          // DATES
          // =================================================

          createdAt:
            request.createdAt,

          updatedAt:
            request.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GET DOCTOR REGISTRATION REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load doctor registration request",
      });
    }
  }
);


// =====================================================
// GET PENDING DOCTOR REGISTRATION REQUESTS
// GET /api/admin/doctor-requests
// =====================================================

router.get(
  "/doctor-requests",
  adminAuth,
  async (req, res) => {
    try {
      const requests =
        await DoctorRegistrationRequest.find({
          status: "PENDING",
        })
          .sort({
            createdAt: -1,
          })
          .select(
            "fullName email mobileNumber country stateProvince city medicalRegistrationNumber medicalCouncil qualification specialization yearsOfExperience hospitalName registrationCertificateName registrationCertificateMimeType professionalIdDocumentName professionalIdDocumentMimeType declarationAccepted status createdAt"
          )
          .lean();

      return res.status(200).json({
        success: true,

        count:
          requests.length,

        requests,
      });
    } catch (error) {
      console.error(
        "GET PENDING DOCTOR REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load pending doctor registration requests",
      });
    }
  }
);


// =====================================================
// VIEW REGISTRATION CERTIFICATE
// GET /api/admin/doctor-requests/:requestId/certificate
// =====================================================

router.get(
  "/doctor-requests/:requestId/certificate",
  adminAuth,
  async (req, res) => {

    try {

      const {
        requestId,
      } = req.params;

      const request =
        await DoctorRegistrationRequest.findById(
          requestId
        );

      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Doctor registration request not found",
        });
      }

      if (!request.registrationCertificate) {

        return res.status(404).json({

          success: false,

          message:
            "Registration certificate not found",
        });
      }

      // =================================================
      // SEND DECRYPTED FILE
      // =================================================

      res.setHeader(
        "Content-Type",
        request.registrationCertificateMimeType ||
          "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${
          request.registrationCertificateName ||
          "registration-certificate"
        }"`
      );

      return res.send(
        request.registrationCertificate
      );

    } catch (error) {

      console.error(
        "VIEW REGISTRATION CERTIFICATE ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to load registration certificate",
      });
    }
  }
);


// =====================================================
// VIEW PROFESSIONAL ID DOCUMENT
// GET /api/admin/doctor-requests/:requestId/professional-id
// =====================================================

router.get(
  "/doctor-requests/:requestId/professional-id",
  adminAuth,
  async (req, res) => {

    try {

      const {
        requestId,
      } = req.params;

      const request =
        await DoctorRegistrationRequest.findById(
          requestId
        );

      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Doctor registration request not found",
        });
      }

      if (!request.professionalIdDocument) {

        return res.status(404).json({

          success: false,

          message:
            "Professional ID document not found",
        });
      }

      // =================================================
      // SEND DECRYPTED FILE
      // =================================================

      res.setHeader(
        "Content-Type",
        request.professionalIdDocumentMimeType ||
          "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${
          request.professionalIdDocumentName ||
          "professional-id"
        }"`
      );

      return res.send(
        request.professionalIdDocument
      );

    } catch (error) {

      console.error(
        "VIEW PROFESSIONAL ID ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to load professional ID document",
      });
    }
  }
);


// =====================================================
// APPROVE DOCTOR REGISTRATION REQUEST
// POST /api/admin/doctor-requests/:requestId/approve
// =====================================================

router.post(
  "/doctor-requests/:requestId/approve",
  adminAuth,
  adminAuth.requirePermission("canManageDoctorRequests"),
  async (req, res) => {

    try {

      const {
        requestId,
      } = req.params;

      // =================================================
      // FIND PENDING REQUEST
      // =================================================

      const request =
        await DoctorRegistrationRequest.findById(
          requestId
        );

      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Doctor registration request not found",
        });
      }

      // =================================================
      // ONLY PENDING REQUESTS CAN BE APPROVED
      // =================================================

      if (
        request.status !== "PENDING"
      ) {

        return res.status(400).json({

          success: false,

          message:
            `This request has already been ${request.status.toLowerCase()}`,
        });
      }

      // =================================================
      // CHECK WHETHER EMAIL ALREADY EXISTS
      // =================================================
      //
      // Email is CSFLE encrypted, so we retrieve the
      // decrypted emails and compare them in Node.js.
      //
      // =================================================

      const existingUsers =
        await User.find({
          role: {
            $in: [
              "patient",
              "doctor",
              "admin",
            ],
          },
        }).select("email");

      const emailExists =
        existingUsers.some(
          (user) =>
            user.email?.toLowerCase() ===
            request.email?.toLowerCase()
        );

      if (emailExists) {

        return res.status(409).json({

          success: false,

          message:
            "A user account already exists with this email address",
        });
      }

      // =================================================
      // GENERATE UNIQUE PROFESSIONAL ID
      // =================================================

      let professionalId;

      let professionalIdExists =
        true;

      while (
        professionalIdExists
      ) {

        const doctorCount =
          await User.countDocuments({
            role: "doctor",
          });

        professionalId =
          `DOC${String(
            doctorCount + 1
          ).padStart(3, "0")}`;

        const existingDoctor =
          await User.findOne({
            professionalId,
          });

        professionalIdExists =
          !!existingDoctor;
      }

      // =================================================
      // GENERATE TEMPORARY PASSWORD
      // =================================================

      const temporaryPassword =
        `Doc@${Math.random()
          .toString(36)
          .slice(2, 8)}${Math.floor(
          Math.random() * 100
        )}`;

      // =================================================
      // HASH TEMPORARY PASSWORD
      // =================================================

      const salt =
        await bcrypt.genSalt(10);

      const passwordHash =
        await bcrypt.hash(
          temporaryPassword,
          salt
        );

      // =================================================
      // CREATE DOCTOR USER ACCOUNT
      // =================================================

      const doctor =
        await User.create({

          fullName:
            request.fullName,

          email:
            request.email,

          passwordHash,

          professionalId,

          registrationRequestId:
            request._id,

          role:
            "doctor",

          accountStatus:
            "APPROVED",

          mustChangePassword:
            true,
        });

      // =================================================
      // SEND LOGIN CREDENTIALS BY EMAIL
      // =================================================

      try {

        await sendDoctorCredentials({

          doctorName:
            doctor.fullName,

          doctorEmail:
            doctor.email,

          professionalId:
            doctor.professionalId,

          temporaryPassword,
        });

      } catch (emailError) {

        console.error(
          "❌ DOCTOR CREDENTIAL EMAIL FAILED:",
          emailError
        );

        // =================================================
        // EMAIL FAILED
        // DELETE CREATED DOCTOR ACCOUNT
        // =================================================

        await User.findByIdAndDelete(
          doctor._id
        );

        return res.status(500).json({

          success: false,

          message:
            "Doctor account was not finalized because the credential email could not be sent. Please try again.",
        });
      }

      // =================================================
      // UPDATE REGISTRATION REQUEST
      // =================================================

      // =================================================
// UPDATE REGISTRATION REQUEST
// =================================================

      request.status = "APPROVED";

      // ✅ SAVE GENERATED PROFESSIONAL ID
      request.professionalId = professionalId;

      request.reviewedBy = req.userId;
      request.reviewedAt = new Date();

      await request.save();

      // =================================================
      // LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "✅ DOCTOR REGISTRATION APPROVED"
      );

      console.log(
        "Doctor:",
        doctor.fullName
      );

      console.log(
        "Email:",
        doctor.email
      );

      console.log(
        "Professional ID:",
        doctor.professionalId
      );

      console.log(
        "Credentials Email: SENT"
      );

      console.log(
        "Approved By:",
        req.userId
      );

      console.log(
        "================================="
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({

        success: true,

        message:
          "Doctor registration approved successfully. Login credentials have been sent to the registered email address.",

        doctor: {

          id:
            doctor._id,

          fullName:
            doctor.fullName,

          email:
            doctor.email,

          professionalId:
            doctor.professionalId,

          role:
            doctor.role,

          accountStatus:
            doctor.accountStatus,

          mustChangePassword:
            doctor.mustChangePassword,
        },

        registrationRequest: {

          id:
            request._id,

          status:
            request.status,

          reviewedBy:
            request.reviewedBy,

          reviewedAt:
            request.reviewedAt,
        },
      });

    } catch (error) {

      console.error(
        "APPROVE DOCTOR REQUEST ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to approve doctor registration request",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);


// =====================================================
// REJECT DOCTOR REGISTRATION REQUEST
// POST /api/admin/doctor-requests/:requestId/reject
// =====================================================

router.post(
  "/doctor-requests/:requestId/reject",
  adminAuth,
  adminAuth.requirePermission("canManageDoctorRequests"),
  async (req, res) => {

    try {

      const {
        requestId,
      } = req.params;

      const {
        reason,
      } = req.body;

      // =================================================
      // VALIDATE REJECTION REASON
      // =================================================

      if (
        !reason ||
        !reason.trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "A rejection reason is required",
        });
      }

      const rejectionReason =
        reason.trim();

      // =================================================
      // FIND REQUEST
      // =================================================

      const request =
        await DoctorRegistrationRequest.findById(
          requestId
        );

      if (!request) {

        return res.status(404).json({

          success: false,

          message:
            "Doctor registration request not found",
        });
      }

      // =================================================
      // ONLY PENDING REQUESTS CAN BE REJECTED
      // =================================================

      if (
        request.status !== "PENDING"
      ) {

        return res.status(400).json({

          success: false,

          message:
            `This request has already been ${request.status.toLowerCase()}`,
        });
      }

      // =================================================
      // SAFETY CHECK
      // =================================================
      //
      // Normally a doctor account will NOT exist because
      // accounts are only created during approval.
      //
      // However, if an account was somehow created and
      // linked to this registration request, delete it.
      //
      // =================================================

      const existingDoctor =
        await User.findOne({

          registrationRequestId:
            request._id,

          role:
            "doctor",
        });

      if (existingDoctor) {

        await User.findByIdAndDelete(
          existingDoctor._id
        );

        console.log(
          "⚠️ Existing doctor account deleted because application was rejected:",
          existingDoctor.professionalId
        );
      }

      // =================================================
      // SEND REJECTION EMAIL
      // =================================================

      try {

        await sendDoctorRejectionEmail({

          doctorName:
            request.fullName,

          doctorEmail:
            request.email,

          rejectionReason,
        });

      } catch (emailError) {

        console.error(
          "❌ DOCTOR REJECTION EMAIL FAILED:",
          emailError
        );

        return res.status(500).json({

          success: false,

          message:
            "The rejection email could not be sent. The application has not been rejected. Please try again.",
        });
      }

      // =================================================
      // UPDATE REGISTRATION REQUEST
      // =================================================

      request.status =
        "REJECTED";

      request.rejectionReason =
        rejectionReason;

      request.reviewedBy =
        req.userId;

      request.reviewedAt =
        new Date();

      await request.save();

      // =================================================
      // LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "❌ DOCTOR REGISTRATION REJECTED"
      );

      console.log(
        "Doctor:",
        request.fullName
      );

      console.log(
        "Email:",
        request.email
      );

      console.log(
        "Rejection Reason:",
        rejectionReason
      );

      console.log(
        "Rejected By:",
        req.userId
      );

      console.log(
        "Rejection Email: SENT"
      );

      console.log(
        "================================="
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({

        success: true,

        message:
          "Doctor registration rejected successfully. A rejection email has been sent to the registered email address.",

        registrationRequest: {

          id:
            request._id,

          status:
            request.status,

          rejectionReason:
            request.rejectionReason,

          reviewedBy:
            request.reviewedBy,

          reviewedAt:
            request.reviewedAt,
        },
      });

    } catch (error) {

      console.error(
        "REJECT DOCTOR REQUEST ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to reject doctor registration request",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================



// =====================================================
// ADMIN MANAGEMENT
// =====================================================

// GET /api/admin/management
router.get(
  "/management",
  adminAuth,
  adminAuth.requirePermission("canManageAdmins"),
  async (req, res) => {
    try {
      const admins = await User.find({ role: "admin" })
        .select(
          "_id fullName email adminLevel permissions accountStatus mustChangePassword mobile alternateMobile designation hospitalName department city state pinCode employeeId createdBy createdAt updatedAt"
        )
        .sort({ createdAt: 1 })
        .lean();

      const creatorIds = admins.map((a) => a.createdBy).filter(Boolean);
      const creators = await User.find({ _id: { $in: creatorIds } })
        .select("_id fullName email")
        .lean();
      const creatorMap = new Map(
        creators.map((creator) => [String(creator._id), creator])
      );

      return res.status(200).json({
        success: true,
        admins: admins.map((admin) => ({
          ...admin,
          adminLevel: admin.adminLevel || "ADMIN",
          permissions: {
            canManageAdmins: !!admin.permissions?.canManageAdmins,
            canManageDoctors: admin.permissions?.canManageDoctors !== false,
            canViewPatients: admin.permissions?.canViewPatients !== false,
            canManageDoctorRequests:
              admin.permissions?.canManageDoctorRequests !== false,
          },
          createdBy: admin.createdBy
            ? creatorMap.get(String(admin.createdBy)) || null
            : null,
        })),
      });
    } catch (error) {
      console.error("GET ADMIN MANAGEMENT ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load administrator management",
      });
    }
  }
);

// POST /api/admin/management/create
router.post(
  "/management/create",
  adminAuth,
  adminAuth.requirePermission("canManageAdmins"),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        adminLevel = "ADMIN",
        permissions = {},
        mobile = "",
        designation = "",
        hospitalName = "",
        department = "",
      } = req.body || {};

      const cleanName = String(fullName || "").trim();
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Full name and email are required",
        });
      }

      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      if (mobile && !/^\d{10}$/.test(String(mobile))) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must contain exactly 10 digits",
        });
      }

      if (!["SUPER_ADMIN", "ADMIN"].includes(adminLevel)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin level",
        });
      }

      const existingUsers = await User.find({}).select("email").lean();
      const emailExists = existingUsers.some(
        (user) => user.email?.trim().toLowerCase() === cleanEmail
      );

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "An account already exists with this email address",
        });
      }

      // Only a SUPER_ADMIN can create another SUPER_ADMIN.
      if (adminLevel === "SUPER_ADMIN" && req.admin?.adminLevel !== "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Only a Super Admin can create another Super Admin",
        });
      }

      const temporaryPassword =
        `Adm@${crypto.randomBytes(6).toString("base64url")}`;
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      const admin = await User.create({
        fullName: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "admin",
        accountStatus: "APPROVED",
        mustChangePassword: true,
        mobile: String(mobile || "").trim(),
        designation: String(designation || "").trim(),
        hospitalName: String(hospitalName || "").trim(),
        department: String(department || "").trim(),
        adminLevel,
        permissions: {
          canManageAdmins:
            adminLevel === "SUPER_ADMIN"
              ? true
              : !!permissions.canManageAdmins,
          canManageDoctors: permissions.canManageDoctors !== false,
          canViewPatients: permissions.canViewPatients !== false,
          canManageDoctorRequests:
            permissions.canManageDoctorRequests !== false,
        },
        createdBy: req.userId,
      });

      try {
        await sendAdminCredentials({
          adminName: admin.fullName,
          adminEmail: admin.email,
          adminLevel: admin.adminLevel,
          temporaryPassword,
        });
      } catch (emailError) {
        console.error("ADMIN CREDENTIAL EMAIL FAILED:", emailError);
        await User.findByIdAndDelete(admin._id);
        return res.status(500).json({
          success: false,
          message:
            "Administrator account was not finalized because the credential email could not be sent. Please try again.",
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Administrator created successfully. Login credentials have been sent to the registered email address.",
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          adminLevel: admin.adminLevel,
          permissions: admin.permissions,
          accountStatus: admin.accountStatus,
          mustChangePassword: admin.mustChangePassword,
          createdBy: admin.createdBy,
        },
      });
    } catch (error) {
      console.error("CREATE ADMIN ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create administrator",
      });
    }
  }
);

// =====================================================
// MY ADMIN INFORMATION
// =====================================================

// GET /api/admin/me
router.get("/me", adminAuth, async (req, res) => {
  try {
    const admin = req.admin.toObject();
    delete admin.passwordHash;
    return res.status(200).json({
      success: true,
      admin: {
        ...admin,
        adminLevel: admin.adminLevel || "ADMIN",
        permissions: admin.permissions || {},
      },
    });
  } catch (error) {
    console.error("GET ADMIN PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load administrator information",
    });
  }
});

// PUT /api/admin/me
router.put("/me", adminAuth, async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "mobile",
      "alternateMobile",
      "designation",
      "hospitalName",
      "department",
      "hospitalAddress",
      "city",
      "state",
      "pinCode",
      "employeeId",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        req.admin[field] = String(req.body[field] ?? "").trim();
      }
    }

    if (req.admin.mobile && !/^\d{10}$/.test(req.admin.mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    if (
      req.admin.alternateMobile &&
      !/^\d{10}$/.test(req.admin.alternateMobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Alternate mobile number must contain exactly 10 digits",
      });
    }

    if (req.admin.pinCode && !/^\d{6}$/.test(req.admin.pinCode)) {
      return res.status(400).json({
        success: false,
        message: "PIN code must contain exactly 6 digits",
      });
    }

    await req.admin.save();

    const result = req.admin.toObject();
    delete result.passwordHash;

    return res.status(200).json({
      success: true,
      message: "Administrator information updated successfully",
      admin: result,
    });
  } catch (error) {
    console.error("UPDATE ADMIN PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update administrator information",
    });
  }
});

// =====================================================
// CHANGE LOGIN EMAIL — VERIFY NEW EMAIL FIRST
// =====================================================

// POST /api/admin/me/email/request
router.post("/me/email/request", adminAuth, async (req, res) => {
  try {
    const newEmail = String(req.body?.newEmail || "").trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid new email address",
      });
    }

    if (newEmail === String(req.admin.email).trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "This is already your registered email address",
      });
    }

    const users = await User.find({}).select("email").lean();
    const exists = users.some(
      (user) => user.email?.trim().toLowerCase() === newEmail
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    const otpResult = await createLoginOTP({
      userId: req.userId,
      email: newEmail,
      role: "admin-email-change",
      authPayload: { userId: req.userId, role: "admin-email-change" },
      userData: { id: req.userId, newEmail },
    });

    return res.status(200).json({
      success: true,
      message: "A verification code has been sent to the new email address",
      challengeId: otpResult.challengeId,
      maskedEmail: otpResult.maskedEmail,
      expiresInSeconds: otpResult.expiresInSeconds,
    });
  } catch (error) {
    if (error.code === "OTP_COOLDOWN") {
      return res.status(429).json({
        success: false,
        message: error.message,
        remainingSeconds: error.remainingSeconds,
      });
    }
    console.error("ADMIN EMAIL CHANGE REQUEST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send email verification code",
    });
  }
});

// POST /api/admin/me/email/verify
router.post("/me/email/verify", adminAuth, async (req, res) => {
  try {
    const { challengeId, otp } = req.body || {};
    const result = await verifyLoginOTP({ challengeId, otp });

    if (
      result.role !== "admin-email-change" ||
      String(result.authPayload?.userId) !== String(req.userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email verification session",
      });
    }

    const newEmail = result.userData?.newEmail;
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email address is missing",
      });
    }

    const users = await User.find({}).select("_id email").lean();
    const exists = users.some(
      (user) =>
        String(user._id) !== String(req.userId) &&
        user.email?.trim().toLowerCase() === newEmail.trim().toLowerCase()
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    req.admin.email = newEmail.trim().toLowerCase();
    await req.admin.save();

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully",
      email: req.admin.email,
    });
  } catch (error) {
    console.error("ADMIN EMAIL CHANGE VERIFY ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to verify email address",
    });
  }
});

// =====================================================
// ADMIN PASSWORD CHANGE
// POST /api/admin/change-password
// =====================================================

router.post("/change-password", adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password and confirmation are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const currentMatches = await bcrypt.compare(
      currentPassword,
      req.admin.passwordHash
    );

    if (!currentMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (await bcrypt.compare(newPassword, req.admin.passwordHash)) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    req.admin.passwordHash = await bcrypt.hash(newPassword, 12);
    req.admin.mustChangePassword = false;
    await req.admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("ADMIN PASSWORD CHANGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change administrator password",
    });
  }
});

module.exports = router;