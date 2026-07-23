import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeetingsService } from '../meetings/meetings.service';
import { MeetingsGateway } from '../meetings/meetings.gateway';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingsService: MeetingsService,
    private readonly meetingsGateway: MeetingsGateway,
  ) {}

  /**
   * Handle participant_joined webhook event
   */
  async handleParticipantJoined(
    roomName: string,
    participant: any,
  ): Promise<void> {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { meetingId: roomName },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found for room: ${roomName}`);
        return;
      }

      const identity = participant?.identity || 'unknown';
      const name = participant?.name || participant?.identity || 'Guest';

      // Check if participant record already exists
      const existing = await this.prisma.meetingParticipant.findUnique({
        where: {
          meetingId_identity: {
            meetingId: meeting.id,
            identity,
          },
        },
      });

      if (existing) {
        // Re-joining — update the record
        await this.prisma.meetingParticipant.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            joinedAt: new Date(),
            guestNickname: name,
          },
        });
      } else {
        // New participant
        await this.prisma.meetingParticipant.create({
          data: {
            meetingId: meeting.id,
            identity,
            guestNickname: name,
            role: 'PARTICIPANT',
          },
        });
      }

      // Broadcast to WebSocket clients
      this.meetingsGateway.broadcastParticipantJoined(meeting.id, {
        id: existing?.id || '',
        identity,
        nickname: name,
        role: 'PARTICIPANT',
      });

      this.logger.log(
        `Participant ${identity} joined meeting ${roomName}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling participant_joined: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Handle participant_left webhook event
   */
  async handleParticipantLeft(
    roomName: string,
    participant: any,
  ): Promise<void> {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { meetingId: roomName },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found for room: ${roomName}`);
        return;
      }

      const identity = participant?.identity || 'unknown';

      // Update participant record
      await this.prisma.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          identity,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });

      // Broadcast to WebSocket clients
      this.meetingsGateway.broadcastParticipantLeft(
        meeting.id,
        identity,
        participant?.name || identity,
      );

      this.logger.log(
        `Participant ${identity} left meeting ${roomName}`,
      );

      // Auto-end meeting if no more active participants
      await this.checkAndAutoEnd(meeting.id);
    } catch (error) {
      this.logger.error(
        `Error handling participant_left: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Handle room_finished webhook event
   */
  async handleRoomFinished(roomName: string): Promise<void> {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { meetingId: roomName },
      });

      if (!meeting) {
        this.logger.warn(`Meeting not found for room: ${roomName}`);
        return;
      }

      if (meeting.status === 'ENDED') {
        return; // Already ended
      }

      await this.prisma.meeting.update({
        where: { id: meeting.id },
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

      // Broadcast meeting ended
      this.meetingsGateway.broadcastMeetingEnded(meeting.id);

      this.logger.log(`Meeting ${roomName} auto-ended via webhook`);
    } catch (error) {
      this.logger.error(
        `Error handling room_finished: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Check if meeting should be auto-ended (no active participants)
   */
  async checkAndAutoEnd(meetingId: string): Promise<void> {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting || meeting.status === 'ENDED') return;

      const activeParticipants = await this.prisma.meetingParticipant.count({
        where: { meetingId: meeting.id, leftAt: null },
      });

      if (activeParticipants === 0) {
        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            status: 'ENDED',
            endedAt: new Date(),
          },
        });

        this.meetingsGateway.broadcastMeetingEnded(meeting.id);

        this.logger.log(
          `Meeting ${meeting.meetingId} auto-ended — no active participants`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error in checkAndAutoEnd: ${(error as Error).message}`,
      );
    }
  }
}
