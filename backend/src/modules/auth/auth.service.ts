import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { UnauthorizedError, ValidationError } from '../../utils/errors';
import { JwtPayload, Role } from '../../types';
import { AuditService } from '../../services/audit.service';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    role?: Role;
    name?: string;
    providerId?: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ValidationError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role || 'trainee',
        name: data.name,
        providerId: data.providerId,
        phone: data.phone,
      },
    });

    await AuditService.log({
      entityType: 'User',
      entityId: user.id,
      action: 'USER_REGISTERED',
      changes: { email: user.email, role: user.role },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      providerId: user.providerId,
    });

    return { user: this.sanitizeUser(user), ...tokens };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      providerId: user.providerId,
    });

    return { user: this.sanitizeUser(user), ...tokens };
  }

  static generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '1d', // 15m in prod, 1d in dev for ease
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken, token: accessToken };
  }

  static sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
