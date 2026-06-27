import CryptoJS from 'crypto-js';

/**
 * Encrypts a password string using a Master Key.
 * @param {string} plaintext - The plain-text password to encrypt.
 * @param {string} masterKey - The key used for encryption.
 * @returns {string} - The encrypted ciphertext string.
 */
export const encryptPassword = (plaintext, masterKey) => {
  if (!plaintext) return '';
  try {
    return CryptoJS.AES.encrypt(plaintext, masterKey).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt password. Please ensure the Master Key is valid.");
  }
};

/**
 * Decrypts a ciphertext string using a Master Key.
 * @param {string} ciphertext - The AES-256 encrypted string.
 * @param {string} masterKey - The key used for decryption.
 * @returns {string} - The decrypted plain-text password.
 */
export const decryptPassword = (ciphertext, masterKey) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, masterKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // If the master key is incorrect, originalText will be empty or malformed
    if (!originalText) {
      throw new Error("Invalid Master Key");
    }
    return originalText;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt. Incorrect Master Key or data corruption.");
  }
};
