import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class LivekitWebhookGuard implements CanActivate {
  private readonly logger = new Logger(LivekitWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Get the raw body — must be available as a Buffer
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.warn('No raw body found — webhook verification requires raw body middleware');
      throw new UnauthorizedException('Webhook body not accessible');
    }

    // Get the Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      this.logger.warn('Missing Authorization header in webhook request');
      throw new UnauthorizedException('Missing webhook signature');
    }

    // Validate the HMAC-SHA256 signature
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    if (!apiSecret) {
      this.logger.error('LIVEKIT_API_SECRET is not configured');
      throw new UnauthorizedException('Server misconfiguration');
    }

    const bodyString = Buffer.isBuffer(rawBody)
      ? rawBody.toString('utf8')
      : String(rawBody);

    const expectedHash = crypto
      .createHmac('sha256', apiSecret)
      .update(bodyString)
      .digest('base64');

    // LiveKit sends the hash directly in the Authorization header
    // The format is typically just the base64 hash
    if (authHeader !== expectedHash) {
      this.logger.warn('Webhook signature verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log('LiveKit webhook signature verified successfully');

    // Parse the body into the request for downstream handlers
    try {
      request.webhookBody = JSON.parse(bodyString);
    } catch {
      this.logger.warn('Failed to parse webhook body as JSON');
      request.webhookBody = {};
    }

    return true;
  }
}
