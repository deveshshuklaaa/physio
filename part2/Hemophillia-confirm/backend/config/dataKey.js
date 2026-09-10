// const { Binary } = require("mongodb");
// const { parse } = require("uuid");

// module.exports = new Binary(
//   Buffer.from(parse("70af1aa8-ea95-4810-8928-69c01d93229b")),
//   Binary.SUBTYPE_UUID
// );
const { Binary } = require("mongodb");

const DATA_KEY_BASE64 = "cK8aqOqVSBCJKGnAHZMimw==";

const dataKeyId = Binary.createFromBase64(
  DATA_KEY_BASE64,
  Binary.SUBTYPE_UUID
);

console.log("=================================");
console.log("🔑 DATA KEY CONFIG");
console.log("Base64:", DATA_KEY_BASE64);
console.log("BSON Type:", dataKeyId._bsontype);
console.log("Subtype:", dataKeyId.sub_type);
console.log("Length:", dataKeyId.buffer.length);
console.log("=================================");

module.exports = dataKeyId;