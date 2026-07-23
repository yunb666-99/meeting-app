import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Overview stats: total users, active meetings, today's meetings
   */
  async getOverview(): Promise<{
    totalUsers: number;
    activeUsersToday: number;
    activeMeetingsNow: number;
    todayMeetings: number;
  }> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsersToday, activeMeetingsNow, todayMeetings] =
      await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),

        this.prisma.user.count({
          where: {
            lastLoginAt: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),

        this.prisma.meeting.count({
          where: { status: 'ACTIVE' },
        }),

        this.prisma.meeting.count({
          where: {
            createdAt: {
              gte: todayStart,
              lt: todayEnd,
            },
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsersToday,
      activeMeetingsNow,
      todayMeetings,
    };
  }

  /**
   * Meetings over time (time-series data for charts)
   * granularity: day | week | month
   */
  async getMeetingsOverTime(
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<any[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return [];
    }

    // Aggregate using Prisma groupBy
    const meetings = await this.prisma.meeting.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by the appropriate granularity
    const grouped: Record<string, number> = {};

    for (const meeting of meetings) {
      const date = meeting.createdAt;
      let key: string;

      switch (granularity) {
        case 'week':
          // ISO week: Monday as start of week
          const dayOfWeek = date.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(date);
          monday.setDate(monday.getDate() + mondayOffset);
          key = monday.toISOString().slice(0, 10);
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = date.toISOString().slice(0, 10);
          break;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    }

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * New users over time (time-series data for charts)
   * granularity: day | week | month
   */
  async getUsersOverTime(
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<any[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};

    for (const user of users) {
      const date = user.createdAt;
      let key: string;

      switch (granularity) {
        case 'week': {
          const dayOfWeek = date.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const monday = new Date(date);
          monday.setDate(monday.getDate() + mondayOffset);
          key = monday.toISOString().slice(0, 10);
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = date.toISOString().slice(0, 10);
          break;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    }

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
