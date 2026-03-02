const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";

// Create a 32-byte key from your secret
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.MESSAGE_SECRET || "fallback_dev_secret_key_2026")
  .digest();

/**
 * Encrypt plain text
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Format: "iv:encryptedData"
 */
function encrypt(text) {
  // Handle empty/null values
  if (!text || text.trim() === "") {
    return text;
  }

  try {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

    // Encrypt
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return format: "iv:encrypted"
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("❌ Encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
}

/**
 * Decrypt encrypted text
 * @param {string} encryptedText - Format: "iv:encryptedData"
 * @returns {string} - Plain text
 */
function decrypt(encryptedText) {
  // Handle empty/null values
  if (!encryptedText || encryptedText.trim() === "") {
    return encryptedText;
  }

  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(":");

    if (parts.length !== 2) {
      console.error("❌ Invalid encrypted format:", encryptedText);
      return "[Decryption failed - invalid format]";
    }

    const [ivHex, encrypted] = parts;

    // Convert hex IV back to Buffer
    const iv = Buffer.from(ivHex, "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("❌ Decryption error:", error);
    console.error("Encrypted text:", encryptedText);
    return "[Message corrupted - decryption failed]";
  }
}

module.exports = { encrypt, decrypt };
