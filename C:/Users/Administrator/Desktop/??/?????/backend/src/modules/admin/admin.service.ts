import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an admin operation log
   */
  private async logAction(
    adminUserId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any,
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.adminLog.create({
      data: {
        adminUserId,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        details: details || undefined,
        ipAddress: ipAddress || '0.0.0.0',
      },
    });
  }

  /**
   * List users (paginated, with optional search and role filter)
   */
  async listUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { account: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && ['USER', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          account: true,
          nickname: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Create a new user
   */
  async createUser(
    adminUserId: string,
    dto: CreateUserDto,
    ipAddress?: string,
  ): Promise<any> {
    // Check if account already exists
    const existing = await this.prisma.user.findUnique({
      where: { account: dto.account },
    });

    if (existing) {
      throw new BadRequestException('Account already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        account: dto.account,
        passwordHash,
        nickname: dto.nickname,
        role: dto.role || 'USER',
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.logAction(adminUserId, 'CREATE_USER', 'User', user.id, { account: dto.account }, ipAddress);

    this.logger.log(`User created by admin ${adminUserId}: ${dto.account}`);

    return user;
  }

  /**
   * Get user detail by ID
   */
  async getUserDetail(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            hostedMeetings: true,
            participations: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update a user
   */
  async updateUser(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserDto,
    ipAddress?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (dto.nickname !== undefined) {
      updateData.nickname = dto.nickname;
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.logAction(adminUserId, 'UPDATE_USER', 'User', targetUserId, dto, ipAddress);

    this.logger.log(`User ${targetUserId} updated by admin ${adminUserId}`);

    return updated;
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivateUser(
    adminUserId: string,
    targetUserId: string,
    ipAddress?: string,
  ): Promise<any> {
    // Cannot deactivate self
    if (adminUserId === targetUserId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
      select: {
        id: true,
        account: true,
        nickname: true,
        isActive: true,
      },
    });

    await this.logAction(adminUserId, 'DEACTIVATE_USER', 'User', targetUserId, null, ipAddress);

    this.logger.log(`User ${targetUserId} deactivated by admin ${adminUserId}`);

    return updated;
  }

  /**
   * List all meetings with filters (paginated)
   */
  async listMeetings(
    page: number = 1,
    limit: number = 20,
    status?: string,
    hostId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && ['ACTIVE', 'ENDED'].includes(status)) {
      where.status = status;
    }

    if (hostId) {
      where.hostId = hostId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              account: true,
              nickname: true,
            },
          },
          _count: {
            select: {
              participants: true,
              chatMessages: true,
            },
          },
        },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    const safeData = data.map(({ password, ...rest }) => rest);

    return { data: safeData, total, page, limit };
  }

  /**
   * Get meeting detail with participants and chat log
   */
  async getMeetingDetail(meetingId: string): Promise<any> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: {
          select: {
            id: true,
            account: true,
            nickname: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const { password, ...safe } = meeting;
    return safe;
  }

  /**
   * Hard delete a meeting record
   */
  async deleteMeeting(
    adminUserId: string,
    meetingId: string,
    ipAddress?: string,
  ): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.prisma.meeting.delete({
      where: { id: meetingId },
    });

    await this.logAction(adminUserId, 'DELETE_MEETING', 'Meeting', meetingId, { meetingId: meeting.meetingId }, ipAddress);

    this.logger.log(`Meeting ${meetingId} deleted by admin ${adminUserId}`);
  }

  /**
   * Get admin operation logs (paginated, with filters)
   */
  async getLogs(
    page: number = 1,
    limit: number = 20,
    adminId?: string,
    action?: string,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (adminId) {
      where.adminUserId = adminId;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              account: true,
              nickname: true,
            },
          },
        },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
