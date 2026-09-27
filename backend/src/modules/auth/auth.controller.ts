import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../utils/errors';
import { JwtPayload, Role } from '../../types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'provider_admin', 'provider_staff', 'employer', 'field_officer', 'trainee', 'micro_verifier']).optional(),
  name: z.string().optional(),
  providerId: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data as any);
      
      res.cookie('ks_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);

      res.cookie('ks_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.ks_refresh_token || req.body?.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token missing');
      }

      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      const tokens = AuthService.generateTokens({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role as Role,
        providerId: decoded.providerId,
      });

      res.cookie('ks_refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        data: tokens,
      });
    } catch (err) {
      next(new UnauthorizedError('Invalid or expired refresh token'));
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('ks_refresh_token');
    res.clearCookie('ks_access_token');
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
