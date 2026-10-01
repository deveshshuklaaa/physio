require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");

const {
  kmsProviders,
  keyVaultNamespace,
  cryptSharedLibPath,
} = require("./config/encryption");

require("./src/models/User");

async function testCSFLE() {
  try {
    const dbName = "hemophilia";
    const collectionName = "users";

    console.log("=================================");
    console.log("🔐 CSFLE TEST");
    console.log("=================================");

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: dbName,

      autoEncryption: {
        keyVaultNamespace,
        kmsProviders,

        extraOptions: {
          cryptSharedLibPath,
        },
      },
    });

    console.log("✅ MongoDB connected with CSFLE");
    console.log("DB NAME:", mongoose.connection.name);
    console.log("COLLECTION:", collectionName);

    const User = mongoose.model("User");

    console.log("\nEncryption Type:");
    console.log(User.schema.options.encryptionType);

    console.log("\nEncrypted Fields:");

    const encryptedFields = User.schema._buildEncryptedFields();

    console.dir(encryptedFields, { depth: null });

    // Check actual collection
    const collection = mongoose.connection.db.collection(collectionName);

    console.log("\n========== COLLECTION CHECK ==========");
    console.log(
      "Existing users:",
      await collection.countDocuments()
    );

    // Create NEW user
    const email = `csfle-test-${Date.now()}@test.com`;

    const user = await User.create({
      fullName: "CSFLE TEST USER",
      email,
      passwordHash: "TEST_HASH",
      role: "patient",
    });

    console.log("\n========== DECRYPTED MONGOOSE DATA ==========");
    console.log(user);

    // Read back through CSFLE
    const foundUser = await User.findById(user._id);

    console.log("\n========== READ THROUGH CSFLE ==========");
    console.log(foundUser);

    await mongoose.disconnect();

    console.log("\n✅ CSFLE TEST COMPLETE");
  } catch (error) {
    console.error("\n❌ CSFLE TEST FAILED");
    console.error(error);
  }
}

testCSFLE();