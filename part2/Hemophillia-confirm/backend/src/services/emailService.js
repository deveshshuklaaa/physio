// const nodemailer = require("nodemailer");

// // =====================================================
// // GMAIL TRANSPORTER
// // =====================================================

// const transporter = nodemailer.createTransport({
//   service: "gmail",

//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APP_PASSWORD,
//   },
// });

// // =====================================================
// // TEST EMAIL CONNECTION
// // =====================================================

// async function verifyEmailConnection() {
//   try {
//     await transporter.verify();

//     console.log("=================================");
//     console.log("✅ EMAIL SERVER READY");
//     console.log("Email:", process.env.EMAIL_USER);
//     console.log("=================================");
//   } catch (error) {
//     console.error("=================================");
//     console.error("❌ EMAIL SERVER CONNECTION FAILED");
//     console.error(error.message);
//     console.error("=================================");
//   }
// }

// // =====================================================
// // SEND DOCTOR CREDENTIALS
// // =====================================================

// async function sendDoctorCredentials({
//   doctorName,
//   doctorEmail,
//   professionalId,
//   temporaryPassword,
// }) {
//   const mailOptions = {
//     from: `"Hemophilia Care" <${process.env.EMAIL_USER}>`,

//     to: doctorEmail,

//     subject: "Your Hemophilia Care Doctor Account",

//     text: `
// Dear ${doctorName},

// Your doctor registration for Hemophilia Care has been approved by the administrator.

// Your doctor account has been created successfully.

// Login Credentials
// -----------------
// Professional ID: ${professionalId}
// Temporary Password: ${temporaryPassword}

// Please use these credentials to log in to the Hemophilia Care system.

// For security reasons, you will be required to change your password after your first login.

// If you did not submit this registration request, please contact the Hemophilia Care administrator immediately.

// Regards,
// Hemophilia Care Administration
//     `.trim(),

//     html: `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">

//         <h2>Hemophilia Care</h2>

//         <p>Dear <strong>${doctorName}</strong>,</p>

//         <p>
//           Your doctor registration for
//           <strong>Hemophilia Care</strong>
//           has been approved by the administrator.
//         </p>

//         <p>
//           Your doctor account has been created successfully.
//         </p>

//         <h3>Login Credentials</h3>

//         <table
//           style="
//             border-collapse: collapse;
//             width: 100%;
//             max-width: 500px;
//           "
//         >
//           <tr>
//             <td
//               style="
//                 border: 1px solid #ddd;
//                 padding: 10px;
//                 font-weight: bold;
//               "
//             >
//               Professional ID
//             </td>

//             <td
//               style="
//                 border: 1px solid #ddd;
//                 padding: 10px;
//               "
//             >
//               ${professionalId}
//             </td>
//           </tr>

//           <tr>
//             <td
//               style="
//                 border: 1px solid #ddd;
//                 padding: 10px;
//                 font-weight: bold;
//               "
//             >
//               Temporary Password
//             </td>

//             <td
//               style="
//                 border: 1px solid #ddd;
//                 padding: 10px;
//               "
//             >
//               ${temporaryPassword}
//             </td>
//           </tr>
//         </table>

//         <p>
//           Please use these credentials to log in to the
//           Hemophilia Care system.
//         </p>

//         <p>
//           <strong>
//             For security reasons, you will be required to change
//             your password after your first login.
//           </strong>
//         </p>

//         <p>
//           If you did not submit this registration request,
//           please contact the Hemophilia Care administrator immediately.
//         </p>

//         <br>

//         <p>
//           Regards,<br>
//           <strong>Hemophilia Care Administration</strong>
//         </p>

//       </div>
//     `,
//   };

//   const info = await transporter.sendMail(mailOptions);

//   console.log("=================================");
//   console.log("✅ DOCTOR CREDENTIAL EMAIL SENT");
//   console.log("To:", doctorEmail);
//   console.log("Message ID:", info.messageId);
//   console.log("=================================");

//   return info;
// }

// // =====================================================
// // SEND DOCTOR REJECTION EMAIL
// // =====================================================

// async function sendDoctorRejectionEmail({
//   doctorName,
//   doctorEmail,
//   rejectionReason,
// }) {
//   const mailOptions = {
//     from: `"Hemophilia Care" <${process.env.EMAIL_USER}>`,

//     to: doctorEmail,

//     subject:
//       "Update Regarding Your Hemophilia Care Doctor Registration",

//     text: `
// Dear ${doctorName},

// We regret to inform you that your doctor registration application for Hemophilia Care has not been approved at this time.

// Reason for rejection:
// ${rejectionReason}

// If you believe this decision was made in error or if you need further clarification, please contact the Hemophilia Care administration.

// You may submit a new registration application when the required information or documentation has been corrected.

// Regards,
// Hemophilia Care Administration
//     `.trim(),

//     html: `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">

//         <h2>Hemophilia Care</h2>

//         <p>
//           Dear <strong>${doctorName}</strong>,
//         </p>

//         <p>
//           We regret to inform you that your doctor registration
//           application for <strong>Hemophilia Care</strong>
//           has not been approved at this time.
//         </p>

//         <h3>Reason for Rejection</h3>

//         <div
//           style="
//             background-color: #f5f5f5;
//             border-left: 4px solid #999;
//             padding: 15px;
//             margin: 15px 0;
//           "
//         >
//           ${rejectionReason}
//         </div>

//         <p>
//           If you believe this decision was made in error or if
//           you need further clarification, please contact the
//           Hemophilia Care administration.
//         </p>

//         <p>
//           You may submit a new registration application when
//           the required information or documentation has been
//           corrected.
//         </p>

//         <br>

//         <p>
//           Regards,<br>
//           <strong>Hemophilia Care Administration</strong>
//         </p>

//       </div>
//     `,
//   };

//   const info = await transporter.sendMail(mailOptions);

//   console.log("=================================");
//   console.log("✅ DOCTOR REJECTION EMAIL SENT");
//   console.log("To:", doctorEmail);
//   console.log("Message ID:", info.messageId);
//   console.log("=================================");

//   return info;
// }
// // =====================================================
// // LOGIN OTP EMAIL
// // =====================================================

// async function sendLoginOTP({
//   email,
//   otp,
//   expiryMinutes = 5,
// }) {
//   if (!email) {
//     throw new Error(
//       "Recipient email is required"
//     );
//   }

//   if (!otp) {
//     throw new Error(
//       "OTP is required"
//     );
//   }

//   const mailOptions = {
//     from:
//       process.env.EMAIL_FROM ||
//       process.env.SMTP_USER,

//     to: email,

//     subject:
//       "Your Hemophilia Care Login Verification Code",

//     text: `
// Hemophilia Care

// Your login verification code is:

// ${otp}

// This OTP is valid for ${expiryMinutes} minutes.

// For your security, do not share this code with anyone.

// If you did not attempt to log in, please ignore this email.
// `,

//     html: `
//       <div style="
//         font-family: Arial, sans-serif;
//         background: #f5f8fc;
//         padding: 40px 20px;
//       ">

//         <div style="
//           max-width: 560px;
//           margin: 0 auto;
//           background: #ffffff;
//           border-radius: 18px;
//           padding: 36px;
//           border: 1px solid #e1e8f0;
//         ">

//           <div style="
//             text-align: center;
//             margin-bottom: 25px;
//           ">

//             <div style="
//               display: inline-flex;
//               width: 54px;
//               height: 54px;
//               border-radius: 50%;
//               align-items: center;
//               justify-content: center;
//               background: #eaf0fe;
//               color: #2c5ce0;
//               font-size: 26px;
//               font-weight: bold;
//             ">
//               +
//             </div>

//             <h2 style="
//               margin: 15px 0 5px;
//               color: #10233f;
//             ">
//               Hemophilia Care
//             </h2>

//             <p style="
//               margin: 0;
//               color: #71839b;
//               font-size: 14px;
//             ">
//               Login Verification
//             </p>

//           </div>

//           <p style="
//             color: #30445f;
//             font-size: 15px;
//           ">
//             Your verification code is:
//           </p>

//           <div style="
//             background: #f4f7fb;
//             border: 1px dashed #cbd7e6;
//             border-radius: 12px;
//             padding: 20px;
//             text-align: center;
//             margin: 25px 0;
//           ">

//             <span style="
//               font-size: 34px;
//               font-weight: 800;
//               letter-spacing: 8px;
//               color: #2c5ce0;
//             ">
//               ${otp}
//             </span>

//           </div>

//           <p style="
//             color: #5f728c;
//             font-size: 14px;
//             line-height: 1.6;
//           ">
//             This verification code will expire in
//             <strong>${expiryMinutes} minutes</strong>.
//           </p>

//           <p style="
//             color: #5f728c;
//             font-size: 14px;
//             line-height: 1.6;
//           ">
//             Do not share this code with anyone.
//           </p>

//           <div style="
//             margin-top: 30px;
//             padding-top: 20px;
//             border-top: 1px solid #e7edf4;
//             color: #8a9ab0;
//             font-size: 12px;
//             text-align: center;
//           ">
//             If you did not attempt to log in,
//             you can safely ignore this email.
//           </div>

//         </div>

//       </div>
//     `,
//   };

//   // IMPORTANT:
//   // Replace "transporter" below with the transporter
//   // variable already used inside your emailService.js.

//   return transporter.sendMail(
//     mailOptions
//   );
// }
// // =====================================================
// // EXPORT
// // =====================================================

// module.exports = {
//   transporter,
//   verifyEmailConnection,
//   sendDoctorCredentials,
//   sendLoginOTP,
//   sendDoctorRejectionEmail,
// };



const nodemailer = require("nodemailer");

// =====================================================
// GMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// =====================================================
// TEST EMAIL CONNECTION
// =====================================================

async function verifyEmailConnection() {
  try {
    await transporter.verify();

    console.log("=================================");
    console.log("✅ EMAIL SERVER READY");
    console.log("Email:", process.env.EMAIL_USER);
    console.log("=================================");
  } catch (error) {
    console.error("=================================");
    console.error("❌ EMAIL SERVER CONNECTION FAILED");
    console.error(error.message);
    console.error("=================================");
  }
}

// =====================================================
// SEND DOCTOR CREDENTIALS
// =====================================================

async function sendDoctorCredentials({
  doctorName,
  doctorEmail,
  professionalId,
  temporaryPassword,
}) {
  const mailOptions = {
    from: `"Hemophilia Care" <${process.env.EMAIL_USER}>`,

    to: doctorEmail,

    subject: "Your Hemophilia Care Doctor Account",

    text: `
Dear ${doctorName},

Your doctor registration for Hemophilia Care has been approved by the administrator.

Your doctor account has been created successfully.

Login Credentials
-----------------
Professional ID: ${professionalId}
Temporary Password: ${temporaryPassword}

Please use these credentials to log in to the Hemophilia Care system.

For security reasons, you will be required to change your password after your first login.

If you did not submit this registration request, please contact the Hemophilia Care administrator immediately.

Regards,
Hemophilia Care Administration
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">

        <h2>Hemophilia Care</h2>

        <p>Dear <strong>${doctorName}</strong>,</p>

        <p>
          Your doctor registration for
          <strong>Hemophilia Care</strong>
          has been approved by the administrator.
        </p>

        <p>
          Your doctor account has been created successfully.
        </p>

        <h3>Login Credentials</h3>

        <table
          style="
            border-collapse: collapse;
            width: 100%;
            max-width: 500px;
          "
        >
          <tr>
            <td
              style="
                border: 1px solid #ddd;
                padding: 10px;
                font-weight: bold;
              "
            >
              Professional ID
            </td>

            <td
              style="
                border: 1px solid #ddd;
                padding: 10px;
              "
            >
              ${professionalId}
            </td>
          </tr>

          <tr>
            <td
              style="
                border: 1px solid #ddd;
                padding: 10px;
                font-weight: bold;
              "
            >
              Temporary Password
            </td>

            <td
              style="
                border: 1px solid #ddd;
                padding: 10px;
              "
            >
              ${temporaryPassword}
            </td>
          </tr>
        </table>

        <p>
          Please use these credentials to log in to the
          Hemophilia Care system.
        </p>

        <p>
          <strong>
            For security reasons, you will be required to change
            your password after your first login.
          </strong>
        </p>

        <p>
          If you did not submit this registration request,
          please contact the Hemophilia Care administrator immediately.
        </p>

        <br>

        <p>
          Regards,<br>
          <strong>Hemophilia Care Administration</strong>
        </p>

      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("=================================");
  console.log("✅ DOCTOR CREDENTIAL EMAIL SENT");
  console.log("To:", doctorEmail);
  console.log("Message ID:", info.messageId);
  console.log("=================================");

  return info;
}

// =====================================================
// SEND DOCTOR REJECTION EMAIL
// =====================================================

async function sendDoctorRejectionEmail({
  doctorName,
  doctorEmail,
  rejectionReason,
}) {
  const mailOptions = {
    from: `"Hemophilia Care" <${process.env.EMAIL_USER}>`,

    to: doctorEmail,

    subject:
      "Update Regarding Your Hemophilia Care Doctor Registration",

    text: `
Dear ${doctorName},

We regret to inform you that your doctor registration application for Hemophilia Care has not been approved at this time.

Reason for rejection:
${rejectionReason}

If you believe this decision was made in error or if you need further clarification, please contact the Hemophilia Care administration.

You may submit a new registration application when the required information or documentation has been corrected.

Regards,
Hemophilia Care Administration
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">

        <h2>Hemophilia Care</h2>

        <p>
          Dear <strong>${doctorName}</strong>,
        </p>

        <p>
          We regret to inform you that your doctor registration
          application for <strong>Hemophilia Care</strong>
          has not been approved at this time.
        </p>

        <h3>Reason for Rejection</h3>

        <div
          style="
            background-color: #f5f5f5;
            border-left: 4px solid #999;
            padding: 15px;
            margin: 15px 0;
          "
        >
          ${rejectionReason}
        </div>

        <p>
          If you believe this decision was made in error or if
          you need further clarification, please contact the
          Hemophilia Care administration.
        </p>

        <p>
          You may submit a new registration application when
          the required information or documentation has been
          corrected.
        </p>

        <br>

        <p>
          Regards,<br>
          <strong>Hemophilia Care Administration</strong>
        </p>

      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("=================================");
  console.log("✅ DOCTOR REJECTION EMAIL SENT");
  console.log("To:", doctorEmail);
  console.log("Message ID:", info.messageId);
  console.log("=================================");

  return info;
}
// =====================================================
// LOGIN OTP EMAIL
// =====================================================

async function sendLoginOTP({
  email,
  otp,
  expiryMinutes = 5,
}) {
  if (!email) {
    throw new Error(
      "Recipient email is required"
    );
  }

  if (!otp) {
    throw new Error(
      "OTP is required"
    );
  }

  const mailOptions = {
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER,

    to: email,

    subject:
      "Your Hemophilia Care Login Verification Code",

    text: `
Hemophilia Care

Your login verification code is:

${otp}

This OTP is valid for ${expiryMinutes} minutes.

For your security, do not share this code with anyone.

If you did not attempt to log in, please ignore this email.
`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        background: #f5f8fc;
        padding: 40px 20px;
      ">

        <div style="
          max-width: 560px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 18px;
          padding: 36px;
          border: 1px solid #e1e8f0;
        ">

          <div style="
            text-align: center;
            margin-bottom: 25px;
          ">

            <div style="
              display: inline-flex;
              width: 54px;
              height: 54px;
              border-radius: 50%;
              align-items: center;
              justify-content: center;
              background: #eaf0fe;
              color: #2c5ce0;
              font-size: 26px;
              font-weight: bold;
            ">
              +
            </div>

            <h2 style="
              margin: 15px 0 5px;
              color: #10233f;
            ">
              Hemophilia Care
            </h2>

            <p style="
              margin: 0;
              color: #71839b;
              font-size: 14px;
            ">
              Login Verification
            </p>

          </div>

          <p style="
            color: #30445f;
            font-size: 15px;
          ">
            Your verification code is:
          </p>

          <div style="
            background: #f4f7fb;
            border: 1px dashed #cbd7e6;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          ">

            <span style="
              font-size: 34px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #2c5ce0;
            ">
              ${otp}
            </span>

          </div>

          <p style="
            color: #5f728c;
            font-size: 14px;
            line-height: 1.6;
          ">
            This verification code will expire in
            <strong>${expiryMinutes} minutes</strong>.
          </p>

          <p style="
            color: #5f728c;
            font-size: 14px;
            line-height: 1.6;
          ">
            Do not share this code with anyone.
          </p>

          <div style="
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e7edf4;
            color: #8a9ab0;
            font-size: 12px;
            text-align: center;
          ">
            If you did not attempt to log in,
            you can safely ignore this email.
          </div>

        </div>

      </div>
    `,
  };

  // IMPORTANT:
  // Replace "transporter" below with the transporter
  // variable already used inside your emailService.js.

  return transporter.sendMail(
    mailOptions
  );
}
// =====================================================
// EXPORT
// =====================================================


// =====================================================
// SEND ADMIN CREDENTIALS
// =====================================================

async function sendAdminCredentials({
  adminName,
  adminEmail,
  adminLevel,
  temporaryPassword,
}) {
  const levelLabel =
    adminLevel === "SUPER_ADMIN"
      ? "Super Admin"
      : "Assistant Admin";

  const mailOptions = {
    from: `"Hemophilia Care" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "Your Hemophilia Care Administrator Account",
    text: `
Dear ${adminName},

An administrator account has been created for you in the Hemophilia Care system.

Account Details
---------------
Name: ${adminName}
Email: ${adminEmail}
Admin Level: ${levelLabel}
Temporary Password: ${temporaryPassword}

Please log in using the temporary password. After OTP verification, you will be required to create a new password before accessing the administrator dashboard.

For security, please do not share these credentials with anyone.

Regards,
Hemophilia Care Administration
    `.trim(),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Hemophilia Care</h2>
        <p>Dear <strong>${adminName}</strong>,</p>
        <p>An administrator account has been created for you in the Hemophilia Care system.</p>
        <h3>Account Details</h3>
        <table style="border-collapse:collapse;width:100%;max-width:560px">
          <tr><td style="border:1px solid #ddd;padding:10px;font-weight:bold">Name</td><td style="border:1px solid #ddd;padding:10px">${adminName}</td></tr>
          <tr><td style="border:1px solid #ddd;padding:10px;font-weight:bold">Email</td><td style="border:1px solid #ddd;padding:10px">${adminEmail}</td></tr>
          <tr><td style="border:1px solid #ddd;padding:10px;font-weight:bold">Admin Level</td><td style="border:1px solid #ddd;padding:10px">${levelLabel}</td></tr>
          <tr><td style="border:1px solid #ddd;padding:10px;font-weight:bold">Temporary Password</td><td style="border:1px solid #ddd;padding:10px"><strong>${temporaryPassword}</strong></td></tr>
        </table>
        <p><strong>Important:</strong> After OTP verification, you must create a new password before accessing the administrator dashboard.</p>
        <p>For security, please do not share these credentials with anyone.</p>
        <p>Regards,<br><strong>Hemophilia Care Administration</strong></p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  transporter,
  verifyEmailConnection,
  sendDoctorCredentials,
  sendAdminCredentials,
  sendLoginOTP,
  sendDoctorRejectionEmail,
};