import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * User login: validates credentials and returns token pair
   */
  async login(
    account: string,
    password: string,
    userAgent?: string,
    ip?: string,
  ) {
    const user = await this.usersService.findByAccount(account);

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    // Generate access token
    const accessToken = this.generateAccessToken(user);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token hash in DB
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        userAgent: userAgent || null,
        expiresAt,
      },
    });

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log admin action if the user is an admin
    if (user.role === 'ADMIN' && ip) {
      await this.prisma.adminLog.create({
        data: {
          adminUserId: user.id,
          action: 'LOGIN',
          targetType: 'USER',
          targetId: user.id,
          ipAddress: ip,
          details: { userAgent },
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        account: user.account,
        nickname: user.nickname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Refresh token: validates old refresh token and issues a new pair
   */
  async refreshToken(token: string) {
    // Get all non-revoked refresh tokens
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    // Find the matching token by comparing hashes
    let matchedToken: (typeof tokens)[0] | null = null;
    for (const stored of tokens) {
      const isValid = await bcrypt.compare(token, stored.tokenHash);
      if (isValid) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    if (!matchedToken.user.isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revoked: true },
    });

    // Issue new token pair
    const newAccessToken = this.generateAccessToken(matchedToken.user);
    const newRefreshToken = this.generateRefreshToken(matchedToken.user);

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: matchedToken.user.id,
        tokenHash: newRefreshTokenHash,
        userAgent: matchedToken.userAgent,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout: revokes the current refresh token
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          revoked: false,
        },
      });

      for (const stored of tokens) {
        const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
        if (isValid) {
          await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
          });
        }
      }
    }

    return { message: '已退出登录' };
  }

  /**
   * Get current user profile (without passwordHash)
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('旧密码不正确');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: '密码修改成功' };
  }

  /**
   * Generate JWT access token (15 minutes)
   */
  private generateAccessToken(user: any): string {
    const payload = { sub: user.id, account: user.account, role: user.role };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') || '15m',
    });
  }

  /**
   * Generate refresh token (7 days) — not a JWT, just a random token
   */
  private generateRefreshToken(user: any): string {
    return crypto.randomUUID() + '-' + crypto.randomUUID();
  }
}
