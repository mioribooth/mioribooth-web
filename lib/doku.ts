import crypto from "crypto";
import fs from "fs";
import path from "path";

const DOKU_BASE_URL =
  process.env.DOKU_BASE_URL || "https://api-sandbox.doku.com";

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || "";
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || "";
const DOKU_MERCHANT_ID = process.env.DOKU_MERCHANT_ID || "";
const DOKU_TERMINAL_ID = process.env.DOKU_TERMINAL_ID || "";
const DOKU_CHANNEL_ID = process.env.DOKU_CHANNEL_ID || "H2H";

function getPrivateKey() {
  const privateKeyPath = path.join(process.cwd(), "private", "private_key.pem");

  if (fs.existsSync(privateKeyPath)) {
    return fs.readFileSync(privateKeyPath, "utf8");
  }

  const envKey = process.env.DOKU_PRIVATE_KEY;

  if (!envKey) {
    throw new Error("DOKU_PRIVATE_KEY tidak ditemukan.");
  }

  return envKey.replace(/\\n/g, "\n");
}

function getTimestamp(addMinutes = 0) {
  const now = new Date(Date.now() + addMinutes * 60 * 1000);
  const jakartaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  const year = jakartaTime.getUTCFullYear();
  const month = String(jakartaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakartaTime.getUTCDate()).padStart(2, "0");
  const hours = String(jakartaTime.getUTCHours()).padStart(2, "0");
  const minutes = String(jakartaTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(jakartaTime.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

function createAsymmetricSignature(timestamp: string) {
  const privateKey = crypto.createPrivateKey({
    key: getPrivateKey(),
    format: "pem",
  });

  const stringToSign = `${DOKU_CLIENT_ID}|${timestamp}`;

  return crypto
    .sign("RSA-SHA256", Buffer.from(stringToSign), privateKey)
    .toString("base64");
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex").toLowerCase();
}

function createSymmetricSignature({
  method,
  path,
  accessToken,
  body,
  timestamp,
}: {
  method: string;
  path: string;
  accessToken: string;
  body: string;
  timestamp: string;
}) {
  const hashedBody = sha256Hex(body);
  const stringToSign = `${method}:${path}:${accessToken}:${hashedBody}:${timestamp}`;

  return crypto
    .createHmac("sha512", DOKU_SECRET_KEY)
    .update(stringToSign)
    .digest("base64");
}

function generateExternalId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 36);
}

export async function getDokuAccessToken() {
  if (!DOKU_CLIENT_ID) throw new Error("DOKU_CLIENT_ID belum diisi.");

  const timestamp = getTimestamp();
  const signature = createAsymmetricSignature(timestamp);

  const pathUrl = "/authorization/v1/access-token/b2b";

  const response = await fetch(`${DOKU_BASE_URL}${pathUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TIMESTAMP": timestamp,
      "X-CLIENT-KEY": DOKU_CLIENT_ID,
      "X-SIGNATURE": signature,
    },
    body: JSON.stringify({
      grantType: "client_credentials",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("DOKU_TOKEN_ERROR:", JSON.stringify(data, null, 2));
    throw new Error(JSON.stringify(data));
  }

  return data.accessToken as string;
}

export async function createDokuQris({
  amount,
  transactionId,
}: {
  amount: number;
  transactionId: string;
}) {
  if (!DOKU_CLIENT_ID) throw new Error("DOKU_CLIENT_ID belum diisi.");
  if (!DOKU_SECRET_KEY) throw new Error("DOKU_SECRET_KEY belum diisi.");
  if (!DOKU_MERCHANT_ID) throw new Error("DOKU_MERCHANT_ID belum diisi.");

  const accessToken = await getDokuAccessToken();
  const timestamp = getTimestamp();
  const pathUrl = "/snap-adapter/b2b/v1.0/qr/qr-mpm-generate";

const body = {
  partnerReferenceNo: transactionId,
  merchantId: DOKU_MERCHANT_ID,
  terminalId: DOKU_TERMINAL_ID,
  amount: {
    value: `${amount}.00`,
    currency: "IDR",
  },
  validityPeriod: getTimestamp(5),
  additionalInfo: {
  postalCode: "77212",
  feeType: "1",
},
};

  const bodyString = JSON.stringify(body);

  const signature = createSymmetricSignature({
    method: "POST",
    path: pathUrl,
    accessToken,
    body: bodyString,
    timestamp,
  });

  const response = await fetch(`${DOKU_BASE_URL}${pathUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-TIMESTAMP": timestamp,
      "X-PARTNER-ID": DOKU_CLIENT_ID,
      "X-EXTERNAL-ID": generateExternalId(),
      "CHANNEL-ID": DOKU_CHANNEL_ID,
      "X-SIGNATURE": signature,
    },
    body: bodyString,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("DOKU_QRIS_CREATE_ERROR:", JSON.stringify(data, null, 2));
    throw new Error(JSON.stringify(data));
  }

  return data;
}