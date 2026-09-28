import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
//  Password Hashing Service
//  Uses bcrypt with salted rounds (work factor 12) for secure password storage.
//  Plain-text passwords are never logged, stored, or returned.
// ─────────────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
