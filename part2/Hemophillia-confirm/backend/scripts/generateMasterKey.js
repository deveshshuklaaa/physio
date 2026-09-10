const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const masterKey = crypto.randomBytes(96);

const outputPath = path.join(__dirname, "..", "master-key.txt");

fs.writeFileSync(outputPath, masterKey.toString("base64"));

console.log("Master Key generated.");
console.log("Saved to:", outputPath);