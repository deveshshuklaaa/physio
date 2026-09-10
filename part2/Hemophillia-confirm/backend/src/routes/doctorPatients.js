// const express = require("express");

// const {
//   staffAuth,
// } = require("../middleware/roleMiddleware");

// const User =
//   require("../models/User");

// const PatientProfile =
//   require("../models/PatientProfile");

// const HemophiliaDetails =
//   require("../models/HemophiliaDetails");

// const Assessment =
//   require("../models/Assessment");

// const DoctorChangeRequest =
//   require("../models/DoctorChangeRequest");

// const router =
//   express.Router();


// // =====================================================
// // GET MY PATIENTS
// // =====================================================
// //
// // GET /api/doctor/patients
// //
// // A doctor can ONLY see patients whose
// // consultingDoctorId === req.userId
// // =====================================================

// router.get(
//   "/patients",
//   staffAuth,
//   async (req, res) => {
//     try {
//       const doctorId =
//         req.userId;

//       const records =
//         await HemophiliaDetails.find({
//           consultingDoctorId:
//             doctorId,
//         })
//           .select(
//             "userId patientId type severity bleedingPattern bleedFrequency lastBleedDate targetJoint jointsAffected underPhysiotherapy mobilityLimitation"
//           )
//           .lean();

//       if (!records.length) {
//         return res.json({
//           success: true,
//           patients: [],
//           totalPatients: 0,
//         });
//       }

//       const patientUserIds =
//         records.map(
//           (record) =>
//             record.userId
//         );

//       const profiles =
//         await PatientProfile.find({
//           userId: {
//             $in: patientUserIds,
//           },
//         })
//           .select(
//             "userId age sex"
//           )
//           .lean();

//       const profileMap =
//         new Map();

//       profiles.forEach(
//         (profile) => {
//           profileMap.set(
//             String(
//               profile.userId
//             ),
//             profile
//           );
//         }
//       );

//       const patients =
//         records.map(
//           (record) => {
//             const profile =
//               profileMap.get(
//                 String(
//                   record.userId
//                 )
//               ) || {};

//             return {
//               patientId:
//                 record.patientId,

//               userId:
//                 record.userId,

//               age:
//                 profile.age ??
//                 null,

//               sex:
//                 profile.sex ??
//                 null,

//               type:
//                 record.type ??
//                 null,

//               severity:
//                 record.severity ??
//                 null,

//               bleedingPattern:
//                 record.bleedingPattern ??
//                 null,

//               bleedFrequency:
//                 record.bleedFrequency ??
//                 null,

//               lastBleedDate:
//                 record.lastBleedDate ??
//                 null,

//               targetJoint:
//                 record.targetJoint ??
//                 null,

//               jointsAffected:
//                 Array.isArray(
//                   record.jointsAffected
//                 )
//                   ? record.jointsAffected
//                   : [],

//               underPhysiotherapy:
//                 record.underPhysiotherapy ??
//                 null,

//               mobilityLimitation:
//                 record.mobilityLimitation ??
//                 null,
//             };
//           }
//         );

//       return res.json({
//         success: true,
//         patients,
//         totalPatients:
//           patients.length,
//       });

//     } catch (error) {

//       console.error(
//         "GET MY PATIENTS ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to load your patients.",
//       });
//     }
//   }
// );


// // =====================================================
// // GET MY PATIENT DETAIL
// // =====================================================
// //
// // GET /api/doctor/patients/:patientId
// //
// // SECURITY:
// // The patient must belong to the logged-in doctor.
// // =====================================================

// router.get(
//   "/patients/:patientId",
//   staffAuth,
//   async (req, res) => {
//     try {
//       const patientId =
//         String(
//           req.params.patientId ||
//             ""
//         )
//           .trim()
//           .toUpperCase();

//       const doctorId =
//         req.userId;

//       const hemophilia =
//         await HemophiliaDetails.findOne(
//           {
//             patientId,
//             consultingDoctorId:
//               doctorId,
//           }
//         ).lean();

//       if (!hemophilia) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Patient not found in your assigned patients.",
//         });
//       }

//       const user =
//         await User.findById(
//           hemophilia.userId
//         )
//           .select(
//             "_id fullName email professionalId role"
//           )
//           .lean();

//       const profile =
//         await PatientProfile.findOne({
//           userId:
//             hemophilia.userId,
//         }).lean();

//       const assessments =
//         await Assessment.find({
//           userId:
//             hemophilia.userId,
//         })
//           .sort({
//             createdAt: -1,
//           })
//           .lean();

//       return res.json({
//         success: true,

//         patient: {
//           user,
//           profile,
//           hemophiliaDetails:
//             hemophilia,
//           assessments,
//         },
//       });

//     } catch (error) {

//       console.error(
//         "GET MY PATIENT DETAIL ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to load patient details.",
//       });
//     }
//   }
// );


// // =====================================================
// // GET DOCTOR CHANGE REQUESTS
// // =====================================================
// //
// // GET /api/doctor/doctor-change-requests
// //
// // Only requests belonging to this doctor.
// // =====================================================

// router.get(
//   "/doctor-change-requests",
//   staffAuth,
//   async (req, res) => {
//     try {
//       const doctorId =
//         req.userId;

//       const requests =
//         await DoctorChangeRequest.find({
//           currentDoctorId:
//             doctorId,
//           status:
//             "PENDING",
//         })
//           .populate({
//             path:
//               "patientUserId",
//             select:
//               "fullName email",
//           })
//           .sort({
//             createdAt: -1,
//           })
//           .lean();

//       return res.json({
//         success: true,
//         requests,
//         count:
//           requests.length,
//       });

//     } catch (error) {

//       console.error(
//         "GET CHANGE REQUESTS ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to load doctor change requests.",
//       });
//     }
//   }
// );


// // =====================================================
// // RELEASE PATIENT
// // =====================================================
// //
// // POST
// // /api/doctor/doctor-change-requests/:requestId/release
// //
// // Only the CURRENT doctor can release the patient.
// // =====================================================

// router.post(
//   "/doctor-change-requests/:requestId/release",
//   staffAuth,
//   async (req, res) => {
//     try {
//       const doctorId =
//         req.userId;

//       const request =
//         await DoctorChangeRequest.findOne({
//           _id:
//             req.params.requestId,

//           currentDoctorId:
//             doctorId,

//           status:
//             "PENDING",
//         });

//       if (!request) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Change request not found or it has already been processed.",
//         });
//       }

//       // -----------------------------------------------
//       // Find the patient's current assignment
//       // -----------------------------------------------

//       const details =
//         await HemophiliaDetails.findOne({
//           userId:
//             request.patientUserId,

//           consultingDoctorId:
//             doctorId,
//         });

//       if (!details) {
//         return res.status(409).json({
//           success: false,
//           message:
//             "This patient is no longer assigned to you.",
//         });
//       }

//       // -----------------------------------------------
//       // RELEASE PATIENT
//       // -----------------------------------------------

//       details.consultingDoctorId =
//         null;

//       await details.save();

//       // -----------------------------------------------
//       // UPDATE REQUEST
//       // -----------------------------------------------

//       request.status =
//         "RELEASED";

//       request.releasedAt =
//         new Date();

//       request.releasedBy =
//         doctorId;

//       await request.save();

//       return res.json({
//         success: true,

//         message:
//           "Patient released successfully. The patient can now select a new consulting doctor.",

//         patientId:
//           request.patientId,
//       });

//     } catch (error) {

//       console.error(
//         "RELEASE PATIENT ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to release patient.",
//       });
//     }
//   }
// );


// module.exports =
//   router;


const express = require("express");

const {
  staffAuth,
} = require("../middleware/roleMiddleware");

const User =
  require("../models/User");

const PatientProfile =
  require("../models/PatientProfile");

const HemophiliaDetails =
  require("../models/HemophiliaDetails");

const Assessment =
  require("../models/Assessment");

const DoctorChangeRequest =
  require("../models/DoctorChangeRequest");

const router =
  express.Router();


// =====================================================
// GET MY PATIENTS
// =====================================================
//
// GET /api/doctor/patients
//
// A doctor can ONLY see patients whose
// consultingDoctorId === req.userId
// =====================================================

router.get(
  "/patients",
  staffAuth,
  async (req, res) => {
    try {
      const doctorId =
        req.userId;

      const records =
        await HemophiliaDetails.find({
          consultingDoctorId:
            doctorId,
        })
          .select(
            "userId patientId type severity bleedingPattern bleedFrequency lastBleedDate targetJoint jointsAffected underPhysiotherapy mobilityLimitation"
          )
          .lean();

      if (!records.length) {
        return res.json({
          success: true,
          patients: [],
          totalPatients: 0,
        });
      }

      const patientUserIds =
        records.map(
          (record) =>
            record.userId
        );

      const profiles =
        await PatientProfile.find({
          userId: {
            $in: patientUserIds,
          },
        })
          .select(
            "userId age sex"
          )
          .lean();

      const profileMap =
        new Map();

      profiles.forEach(
        (profile) => {
          profileMap.set(
            String(
              profile.userId
            ),
            profile
          );
        }
      );

      const patients =
        records.map(
          (record) => {
            const profile =
              profileMap.get(
                String(
                  record.userId
                )
              ) || {};

            return {
              patientId:
                record.patientId,

              userId:
                record.userId,

              age:
                profile.age ??
                null,

              sex:
                profile.sex ??
                null,

              type:
                record.type ??
                null,

              severity:
                record.severity ??
                null,

              bleedingPattern:
                record.bleedingPattern ??
                null,

              bleedFrequency:
                record.bleedFrequency ??
                null,

              lastBleedDate:
                record.lastBleedDate ??
                null,

              targetJoint:
                record.targetJoint ??
                null,

              jointsAffected:
                Array.isArray(
                  record.jointsAffected
                )
                  ? record.jointsAffected
                  : [],

              underPhysiotherapy:
                record.underPhysiotherapy ??
                null,

              mobilityLimitation:
                record.mobilityLimitation ??
                null,
            };
          }
        );

      return res.json({
        success: true,
        patients,
        totalPatients:
          patients.length,
      });

    } catch (error) {

      console.error(
        "GET MY PATIENTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load your patients.",
      });
    }
  }
);


// =====================================================
// GET MY PATIENT DETAIL
// =====================================================
//
// GET /api/doctor/patients/:patientId
//
// SECURITY:
// The patient must belong to the logged-in doctor.
// =====================================================

router.get(
  "/patients/:patientId",
  staffAuth,
  async (req, res) => {
    try {
      const patientId =
        String(
          req.params.patientId ||
            ""
        )
          .trim()
          .toUpperCase();

      const doctorId =
        req.userId;

      const hemophilia =
        await HemophiliaDetails.findOne(
          {
            patientId,
            consultingDoctorId:
              doctorId,
          }
        ).lean();

      if (!hemophilia) {
        return res.status(404).json({
          success: false,
          message:
            "Patient not found in your assigned patients.",
        });
      }

      const user =
        await User.findById(
          hemophilia.userId
        )
          .select(
            "_id fullName email professionalId role"
          )
          .lean();

      const profile =
        await PatientProfile.findOne({
          userId:
            hemophilia.userId,
        }).lean();

      const assessments =
        await Assessment.find({
          userId:
            hemophilia.userId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,

        patient: {
          user,
          profile,
          hemophiliaDetails:
            hemophilia,
          assessments,
        },
      });

    } catch (error) {

      console.error(
        "GET MY PATIENT DETAIL ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load patient details.",
      });
    }
  }
);


// =====================================================
// GET DOCTOR CHANGE REQUESTS
// =====================================================
//
// GET /api/doctor/doctor-change-requests
//
// Only requests belonging to this doctor.
// =====================================================

router.get(
  "/doctor-change-requests",
  staffAuth,
  async (req, res) => {
    try {
      const doctorId =
        req.userId;

      const requests =
        await DoctorChangeRequest.find({
          currentDoctorId:
            doctorId,
          status:
            "PENDING",
        })
          .populate({
            path:
              "patientUserId",
            select:
              "fullName email",
          })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        requests,
        count:
          requests.length,
      });

    } catch (error) {

      console.error(
        "GET CHANGE REQUESTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load doctor change requests.",
      });
    }
  }
);


// =====================================================
// RELEASE PATIENT
// =====================================================
//
// POST
// /api/doctor/doctor-change-requests/:requestId/release
//
// Only the CURRENT doctor can release the patient.
// =====================================================

router.post(
  "/doctor-change-requests/:requestId/release",
  staffAuth,
  async (req, res) => {
    try {
      const doctorId =
        req.userId;

      const request =
        await DoctorChangeRequest.findOne({
          _id:
            req.params.requestId,

          currentDoctorId:
            doctorId,

          status:
            "PENDING",
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Change request not found or it has already been processed.",
        });
      }

      // -----------------------------------------------
      // Find the patient's current assignment
      // -----------------------------------------------

      const details =
        await HemophiliaDetails.findOne({
          userId:
            request.patientUserId,

          consultingDoctorId:
            doctorId,
        });

      if (!details) {
        return res.status(409).json({
          success: false,
          message:
            "This patient is no longer assigned to you.",
        });
      }

      // -----------------------------------------------
      // RELEASE PATIENT
      // -----------------------------------------------

      details.consultingDoctorId =
        null;

      await details.save();

      // -----------------------------------------------
      // UPDATE REQUEST
      // -----------------------------------------------

      request.status =
        "RELEASED";

      request.releasedAt =
        new Date();

      request.releasedBy =
        doctorId;

      await request.save();

      return res.json({
        success: true,

        message:
          "Patient released successfully. The patient can now select a new consulting doctor.",

        patientId:
          request.patientId,
      });

    } catch (error) {

      console.error(
        "RELEASE PATIENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to release patient.",
      });
    }
  }
);


module.exports =
  router;