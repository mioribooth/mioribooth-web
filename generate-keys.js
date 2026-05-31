const { generateKeyPairSync } = require("crypto");
const fs = require("fs");

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,

  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },

  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

fs.mkdirSync("private", { recursive: true });

fs.writeFileSync("private/private_key.pem", privateKey);
fs.writeFileSync("public_key.pem", publicKey);

console.log("================================");
console.log("KEY PAIR BERHASIL DIBUAT");
console.log("private/private_key.pem");
console.log("public_key.pem");
console.log("================================");