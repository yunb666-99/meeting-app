import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LivekitService } from '../livekit/livekit.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly livekitService: LivekitService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate a unique 8-digit numeric meeting ID
   */
  private generateMeetingId(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  /**
   * Generate a random 6-digit numeric password
   */
  private generatePassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a new meeting
   */
  async createMeeting(
    hostId: string,
    title?: string,
  ): Promise<{
    meeting: any;
    plainPassword: string;
  }> {
    // Generate unique meeting ID
    let meetingId: string;
    let attempts = 0;
    const maxAttempts = 10;
    do {
      meetingId = this.generateMeetingId();
      const existing = await this.prisma.meeting.findUnique({
        where: { meetingId },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new BadRequestException(
        'Failed to generate unique meeting ID. Please try again.',
      );
    }

    // Generate plain password
    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create LiveKit room
    await this.livekitService.createRoom(meetingId);

    // Create DB record
    const meeting = await this.prisma.meeting.create({
      data: {
        meetingId,
        password: hashedPassword,
        title: title || null,
        hostId,
        status: 'ACTIVE',
      },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            account: true,
          },
        },
      },
    });

    this.logger.log(`Meeting created: ${meetingId} by host ${hostId}`);

    return {
      meeting: {
        ...meeting,
        password: undefined, // Never expose the hash
      },
      plainPassword,
    };
  }

  /**
   * Guest joins a meeting
   */
  async joinAsGuest(
    meetingId: string,
    password: string,
    nickname: string,
  ): Promise<{
    meeting: any;
    tempToken: string;
    livekitToken: string;
    livekitUrl: string;
  }> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meetingId },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            account: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'ACTIVE') {
      throw new BadRequestException('Meeting has already ended');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, meeting.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid meeting password');
    }

    // Generate guest identity
    const guestIdentity = `guest_${crypto.randomUUID()}`;

    // Generate temporary JWT (5 min TTL), scoped to this meeting
    const tempToken = this.jwtService.sign(
      {
        sub: guestIdentity,
        meetingId: meetingId,
        role: 'GUEST',
        nickname,
      },
      { expiresIn: '5m' },
    );

    // Generate LiveKit token
    const livekitToken = this.generateLivekitToken(
      meeting,
      guestIdentity,
      nickname,
      false,
    );

    // Determine LiveKit URL from environment
    const livekitWsUrl =
      process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';
    const livekitUrl = livekitWsUrl.replace(/^ws/, 'http');

    return {
      meeting: {
        id: meeting.id,
        meetingId: meeting.meetingId,
        title: meeting.title,
        status: meeting.status,
        startedAt: meeting.startedAt,
        host: meeting.host,
        participantCount: await this.prisma.meetingParticipant.count({
          where: { meetingId: meeting.id, leftAt: null },
        }),
      },
      tempToken,
      livekitToken,
      livekitUrl,
    };
  }

  /**
   * Generate a LiveKit access token for a participant
   */
  generateLivekitToken(
    meeting: any,
    identity: string,
    participantName: string,
    isHost: boolean,
  ): string {
    const meetingId =
      typeof meeting === 'string' ? meeting : meeting.meetingId;

    return this.livekitService.generateToken(
      meetingId,
      identity,
      participantName,
      isHost,  // canPublish
      true,    // canSubscribe
    );
  }

  /**
   * Get a meeting by its database UUID
   */
  async getMeeting(id: string): Promise<any> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            account: true,
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            user: {
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

    // Strip password hash
    const { password, ...safe } = meeting;
    return safe;
  }

  /**
   * Get a meeting by its short meeting ID
   */
  async getMeetingByShortId(meetingId: string): Promise<any> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { meetingId },
      include: {
        host: {
          select: {
            id: true,
            nickname: true,
            account: true,
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
   * List meetings created by a user (paginated)
   */
  async getUserMeetings(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where: { hostId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              nickname: true,
            },
          },
          _count: {
            select: { participants: true },
          },
        },
      }),
      this.prisma.meeting.count({ where: { hostId: userId } }),
    ]);

    const safeData = data.map(({ password, ...rest }) => rest);

    return {
      data: safeData,
      total,
      page,
      limit,
    };
  }

  /**
   * Get current active participants in a meeting
   */
  async getParticipants(meetingId: string): Promise<any[]> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.prisma.meetingParticipant.findMany({
      where: { meetingId: meeting.id, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * End a meeting — host or admin only
   */
  async endMeeting(meetingId: string, userId: string): Promise<any> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status === 'ENDED') {
      throw new BadRequestException('Meeting has already ended');
    }

    // Verify host or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (meeting.hostId !== userId && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only the host or an admin can end this meeting',
      );
    }

    // Delete LiveKit room
    await this.livekitService.deleteRoom(meeting.meetingId);

    // Update meeting status
    const updated = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // Update all active participants
    await this.prisma.meetingParticipant.updateMany({
      where: { meetingId: meeting.id, leftAt: null },
      data: { leftAt: new Date() },
    });

    this.logger.log(`Meeting ended: ${meeting.meetingId} by user ${userId}`);

    const { password, ...safe } = updated;
    return safe;
  }

  /**
   * Kick a participant from a meeting — host only
   */
  async kickParticipant(
    meetingId: string,
    hostId: string,
    identity: string,
  ): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.verifyHost(meetingId, hostId);

    // Remove from LiveKit
    await this.livekitService.removeParticipant(meeting.meetingId, identity);

    // Update participant record
    await this.prisma.meetingParticipant.updateMany({
      where: {
        meetingId: meeting.id,
        identity,
        leftAt: null,
      },
      data: { leftAt: new Date() },
    });

    this.logger.log(
      `Participant ${identity} kicked from meeting ${meeting.meetingId} by host ${hostId}`,
    );
  }

  /**
   * Mute all participants except host — host only
   */
  async muteAll(meetingId: string, hostId: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.verifyHost(meetingId, hostId);

    // List all participants in the LiveKit room
    const participants = await this.livekitService.listParticipants(
      meeting.meetingId,
    );

    // Mute all published tracks for non-host participants
    for (const participant of participants) {
      if (participant.identity === `host_${hostId}`) continue;

      if (participant.tracks && participant.tracks.length > 0) {
        for (const track of participant.tracks) {
          if (track.muted === false && track.type !== 'data') {
            await this.livekitService.mutePublishedTrack(
              meeting.meetingId,
              participant.identity,
              track.sid,
              true,
            );
          }
        }
      }
    }

    this.logger.log(
      `All participants muted in meeting ${meeting.meetingId} by host ${hostId}`,
    );
  }

  /**
   * Get chat history for a meeting
   */
  async getChatHistory(
    meetingId: string,
    before?: string,
    limit: number = 50,
  ): Promise<any[]> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const where: any = { meetingId: meeting.id };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    return this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Verify that a user is the host of a meeting
   */
  async verifyHost(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.hostId !== userId) {
      throw new ForbiddenException('Only the meeting host can perform this action');
    }
  }
}
