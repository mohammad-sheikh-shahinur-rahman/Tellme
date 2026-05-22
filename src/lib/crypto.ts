import CryptoJS from 'crypto-js';

// In a real app, this would be more sophisticated (e.g. per-user public keys)
// For this demo, we'll use a system-level secret to demonstrate the encryption flow
const SECRET_KEY = 'tellme-system-secret-key-123';

export function encryptMessage(message: string): string {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
}

export function decryptMessage(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted Content]';
  }
}
