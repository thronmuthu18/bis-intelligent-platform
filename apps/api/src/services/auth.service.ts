import { prisma } from '../db/client.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { createAuthToken } from './session.service.js';
import { AppError } from '../utils/AppError.js';
import { API_ERROR_CODES, type UserPublicProfile, type UserRole } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Authentication Service
//  Encapsulates registration, authentication, email normalization, and user queries.
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSessionResult {
  user: UserPublicProfile;
  token: string;
}

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 * Guarantees that User@Example.COM and user@example.com are treated identically.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Registers a new user account.
 * Rejects existing emails with 409 EMAIL_ALREADY_EXISTS.
 * Securely hashes password before storing.
 */
export async function registerUser(input: RegisterInput): Promise<AuthSessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  // Check if account with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      'An account with this email already exists.',
      409,
      API_ERROR_CODES.EMAIL_ALREADY_EXISTS,
    );
  }

  // Securely hash password
  const passwordHash = await hashPassword(input.password);

  // Create user in database
  const createdUser = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      organizationName: input.organizationName?.trim() || null,
      role: input.role || 'USER',
      isActive: true,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationName: true,
    },
  });

  const userProfile: UserPublicProfile = {
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role as UserRole,
    organizationName: createdUser.organizationName || undefined,
  };

  const token = createAuthToken({
    id: userProfile.id,
    email: userProfile.email,
    role: userProfile.role,
    name: userProfile.name,
  });

  // Audit Log: User Registration
  await prisma.auditLog.create({
    data: {
      userId: createdUser.id,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: createdUser.id,
      metadata: { email: userProfile.email, role: userProfile.role },
    },
  }).catch(() => {});

  return { user: userProfile, token };
}

/**
 * Authenticates a user with email and password.
 * Returns generic 401 INVALID_CREDENTIALS for both non-existent emails and wrong passwords
 * to protect against account enumeration.
 */
export async function loginUser(input: LoginInput): Promise<AuthSessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      'Invalid email or password.',
      401,
      API_ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(
      'Invalid email or password.',
      401,
      API_ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  // Update last login timestamp asynchronously
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const userProfile: UserPublicProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    organizationName: user.organizationName || undefined,
  };

  const token = createAuthToken({
    id: userProfile.id,
    email: userProfile.email,
    role: userProfile.role,
    name: userProfile.name,
  });

  // Audit Log: User Login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: userProfile.email, role: userProfile.role },
    },
  }).catch(() => {});

  return { user: userProfile, token };
}

/**
 * Fetches user profile by ID without password hash.
 */
export async function getUserById(id: string): Promise<UserPublicProfile> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationName: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      'User not found or account deactivated.',
      401,
      API_ERROR_CODES.UNAUTHORIZED,
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    organizationName: user.organizationName || undefined,
  };
}
