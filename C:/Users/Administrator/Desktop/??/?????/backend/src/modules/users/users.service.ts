import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByAccount(account: string) {
    return this.prisma.user.findUnique({ where: { account } });
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
    role,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { account: { contains: search } },
        { nickname: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async countAll({ search, role }: { search?: string; role?: string }) {
    const where: any = {};

    if (search) {
      where.OR = [
        { account: { contains: search } },
        { nickname: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    return this.prisma.user.count({ where });
  }

  async create(data: { account: string; passwordHash: string; nickname: string; role?: string }) {
    return this.prisma.user.create({
      data: {
        account: data.account,
        passwordHash: data.passwordHash,
        nickname: data.nickname,
        role: data.role as any,
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      nickname?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    },
  ) {
    const updateData: any = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
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
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
