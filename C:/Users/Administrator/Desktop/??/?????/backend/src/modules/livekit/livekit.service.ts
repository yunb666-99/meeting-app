import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly roomServiceClient: RoomServiceClient;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly wsUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || '';
    this.wsUrl = this.configService.get<string>('LIVEKIT_WS_URL') || '';

    this.roomServiceClient = new RoomServiceClient(
      this.wsUrl,
      this.apiKey,
      this.apiSecret,
    );
  }

  async createRoom(roomName: string): Promise<void> {
    try {
      await this.roomServiceClient.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60,
        maxParticipants: 10,
      });
      this.logger.log(`Room created: ${roomName}`);
    } catch (error) {
      // Room may already exist — LiveKit returns an error but the room is usable
      this.logger.warn(`createRoom warning for ${roomName}: ${(error as Error).message}`);
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomServiceClient.deleteRoom(roomName);
      this.logger.log(`Room deleted: ${roomName}`);
    } catch (error) {
      this.logger.warn(`deleteRoom warning for ${roomName}: ${(error as Error).message}`);
    }
  }

  generateToken(
    roomName: string,
    participantIdentity: string,
    participantName: string,
    canPublish: boolean,
    canSubscribe: boolean,
  ): string {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe,
      canPublishData: true,
    });

    // Attach participant metadata
    at.metadata = JSON.stringify({
      name: participantName,
      identity: participantIdentity,
    });

    return at.toJwt();
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomServiceClient.removeParticipant(roomName, identity);
      this.logger.log(`Participant ${identity} removed from room ${roomName}`);
    } catch (error) {
      this.logger.warn(
        `removeParticipant warning for ${roomName}/${identity}: ${(error as Error).message}`,
      );
    }
  }

  async mutePublishedTrack(
    roomName: string,
    identity: string,
    trackSid: string,
    muted: boolean,
  ): Promise<void> {
    try {
      await this.roomServiceClient.mutePublishedTrack(
        roomName,
        identity,
        trackSid,
        muted,
      );
      this.logger.log(
        `Track ${trackSid} muted=${muted} for ${identity} in room ${roomName}`,
      );
    } catch (error) {
      this.logger.warn(
        `mutePublishedTrack warning: ${(error as Error).message}`,
      );
    }
  }

  async getParticipant(
    roomName: string,
    identity: string,
  ): Promise<any> {
    try {
      return await this.roomServiceClient.getParticipant(roomName, identity);
    } catch (error) {
      this.logger.warn(
        `getParticipant warning for ${roomName}/${identity}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async listParticipants(roomName: string): Promise<any[]> {
    try {
      return await this.roomServiceClient.listParticipants(roomName);
    } catch (error) {
      this.logger.warn(
        `listParticipants warning for ${roomName}: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
