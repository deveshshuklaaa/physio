const { transporter } = require("./emailService");

async function sendPasswordResetOTP({
  email,
  otp,
  expiryMinutes = 5,
}) {
  if (!email) {
    throw new Error("Password reset email is required");
  }

  const mailOptions = {
    from:
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      "Hemophilia Care",

    to: email,

    subject:
      "Hemophilia Care - Password Reset Verification Code",

    text:
      `Your Hemophilia Care password reset verification code is ${otp}. ` +
      `This code will expire in ${expiryMinutes} minutes. ` +
      `Do not share this code with anyone. ` +
      `If you did not request a password reset, you can safely ignore this email.`,

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
            ">+</div>

            <h2 style="
              margin: 15px 0 5px;
              color: #10233f;
            ">Hemophilia Care</h2>

            <p style="
              margin: 0;
              color: #71839b;
              font-size: 14px;
            ">Password Reset Verification</p>
          </div>

          <p style="
            color: #30445f;
            font-size: 15px;
          ">
            Your password reset verification code is:
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
            ">${otp}</span>
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
            If you did not request a password reset, you can safely ignore this email.
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendPasswordResetOTP,
};
