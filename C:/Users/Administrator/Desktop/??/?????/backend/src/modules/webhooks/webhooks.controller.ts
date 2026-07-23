import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LivekitWebhookGuard } from '../../common/guards/livekit-webhook.guard';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Receive LiveKit webhook events
   * This endpoint uses express.raw() middleware to get raw body for HMAC verification.
   * Configure this in main.ts:
   *   app.use('/webhooks/livekit', express.raw({ type: 'application/json' }));
   */
  @Post('/livekit')
  @UseGuards(LivekitWebhookGuard)
  @HttpCode(HttpStatus.OK)
  async handleLivekitWebhook(@Req() req: any): Promise<{ received: boolean }> {
    const event = req.webhookBody;
    this.logger.log(`Received LiveKit webhook event: ${event?.event}`);

    if (!event || !event.event) {
      this.logger.warn('Empty or invalid webhook payload');
      return { received: false };
    }

    const { event: eventType, room, participant } = event;

    switch (eventType) {
      case 'room_started':
        this.logger.log(`LiveKit room started: ${room?.name}`);
        break;

      case 'room_finished':
        this.logger.log(`LiveKit room finished: ${room?.name}`);
        await this.webhooksService.handleRoomFinished(room?.name);
        break;

      case 'participant_joined':
        this.logger.log(
          `Participant joined: ${participant?.identity} in room ${room?.name}`,
        );
        await this.webhooksService.handleParticipantJoined(
          room?.name,
          participant,
        );
        break;

      case 'participant_left':
        this.logger.log(
          `Participant left: ${participant?.identity} in room ${room?.name}`,
        );
        await this.webhooksService.handleParticipantLeft(
          room?.name,
          participant,
        );
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${eventType}`);
    }

    return { received: true };
  }
}
