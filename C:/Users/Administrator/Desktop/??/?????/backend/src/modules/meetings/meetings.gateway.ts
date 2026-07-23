import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MeetingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MeetingsGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect(true);
        return;
      }

      const meetingId = client.handshake.auth?.meetingId;
      if (!meetingId) {
        client.disconnect(true);
        return;
      }

      // Store meeting context on client
      (client as any).meetingId = meetingId;
      (client as any).identity = client.handshake.auth?.identity || 'unknown';

      await client.join(`meeting:${meetingId}`);
      this.logger.log(
        `Client ${client.id} joined room meeting:${meetingId}`,
      );
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const meetingId = (client as any).meetingId;
    if (meetingId) {
      await client.leave(`meeting:${meetingId}`);
      this.logger.log(
        `Client ${client.id} left room meeting:${meetingId}`,
      );
    }
  }

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @MessageBody() data: { meetingId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { meetingId, content } = data;
    if (!meetingId || !content) return;

    const identity = (client as any).identity;
    // Determine sender info — the client data is attached during connection
    const senderGuestName = client.handshake.auth?.nickname as string || identity;

    // Save message to DB
    const message = await this.prisma.chatMessage.create({
      data: {
        meetingId,
        senderGuestName,
        content,
        messageType: 'TEXT',
      },
    });

    // Broadcast to all clients in the meeting room
    this.server.to(`meeting:${meetingId}`).emit('chat:message', {
      id: message.id,
      senderName: senderGuestName,
      senderRole: 'PARTICIPANT',
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });
  }

  broadcastParticipantJoined(
    meetingId: string,
    participant: {
      id: string;
      identity: string;
      nickname: string;
      role: string;
    },
  ): void {
    this.server.to(`meeting:${meetingId}`).emit('participant:joined', {
      identity: participant.identity,
      nickname: participant.nickname,
      role: participant.role,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastParticipantLeft(
    meetingId: string,
    identity: string,
    nickname: string,
  ): void {
    this.server.to(`meeting:${meetingId}`).emit('participant:left', {
      identity,
      nickname,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMeetingEnded(meetingId: string): void {
    this.server.to(`meeting:${meetingId}`).emit('meeting:ended', {
      meetingId,
      timestamp: new Date().toISOString(),
    });

    // Force disconnect all clients from this room
    const sockets = this.server.sockets.adapter.rooms.get(
      `meeting:${meetingId}`,
    );
    if (sockets) {
      for (const socketId of sockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(`meeting:${meetingId}`);
        }
      }
    }
  }

  notifyKicked(meetingId: string, identity: string): void {
    this.server.to(`meeting:${meetingId}`).emit('participant:kicked', {
      identity,
      meetingId,
      timestamp: new Date().toISOString(),
    });
  }
}
