    const mongoose = require("mongoose");

    const loginOTPSchema = new mongoose.Schema(
    {
        // User / admin identifier
        userId: {
        type: String,
        required: true,
        index: true,
        },

        // Email where OTP was sent
        email: {
        type: String,
        required: true,
        },

        // patient / doctor / clinician / admin
        role: {
        type: String,
        required: true,
        enum: ["patient", "doctor", "clinician", "admin"],
        },

        // Random challenge identifier sent to frontend
        challengeId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        },

        // Hashed OTP
        otpHash: {
        type: String,
        required: true,
        },

        // Data required after OTP verification
        authPayload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        },

        // User information returned after successful OTP
        userData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        },

        // Maximum 5 attempts
        attempts: {
        type: Number,
        default: 0,
        },

        // OTP expiry
        expiresAt: {
        type: Date,
        required: true,
        index: true,
        },

        // Prevent reusing an OTP
        verified: {
        type: Boolean,
        default: false,
        },
    },
    {
        timestamps: true,
    }
    );

    // MongoDB automatically removes expired OTP records.
    loginOTPSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
    );

    module.exports =
    mongoose.models.LoginOTP ||
    mongoose.model("LoginOTP", loginOTPSchema);