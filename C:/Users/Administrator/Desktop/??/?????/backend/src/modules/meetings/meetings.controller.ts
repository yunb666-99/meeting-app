import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JoinMeetingDto } from './dto/join-meeting.dto';
import { KickParticipantDto } from './dto/kick-participant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /**
   * Create a new meeting — JWT required
   */
  @Post('/')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMeeting(
    @Req() req: any,
    @Body() dto: CreateMeetingDto,
  ) {
    const hostId = req.user.id;
    const result = await this.meetingsService.createMeeting(
      hostId,
      dto.title,
    );

    return {
      ...result.meeting,
      password: result.plainPassword, // Return plain password only this once
    };
  }

  /**
   * Join a meeting as a guest — no auth required
   */
  @Post('/join')
  @HttpCode(HttpStatus.OK)
  async joinMeeting(@Body() dto: JoinMeetingDto) {
    return this.meetingsService.joinAsGuest(
      dto.meetingId,
      dto.password,
      dto.nickname,
    );
  }

  /**
   * Get or renew a LiveKit access token — JWT or tempToken required
   */
  @Post('/:id/token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getLivekitToken(
    @Param('id') meetingId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const meeting = await this.meetingsService.getMeeting(meetingId);

    const isHost = meeting.hostId === user.id;
    const identity = isHost
      ? `host_${user.id}`
      : user.id || `guest_${user.nickname}`;
    const name = user.nickname || user.id || 'Participant';

    const livekitToken = this.meetingsService.generateLivekitToken(
      meeting,
      identity,
      name,
      isHost,
    );

    const livekitWsUrl =
      process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';
    const livekitUrl = livekitWsUrl.replace(/^ws/, 'http');

    return {
      livekitToken,
      livekitUrl,
    };
  }

  /**
   * List meetings created by current user — JWT required
   */
  @Get('/my')
  @UseGuards(JwtAuthGuard)
  async getMyMeetings(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    return this.meetingsService.getUserMeetings(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get meeting details — JWT or tempToken required
   */
  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getMeeting(@Param('id') id: string) {
    return this.meetingsService.getMeeting(id);
  }

  /**
   * List current active participants — JWT or tempToken required
   */
  @Get('/:id/participants')
  @UseGuards(JwtAuthGuard)
  async getParticipants(@Param('id') id: string) {
    return this.meetingsService.getParticipants(id);
  }

  /**
   * End a meeting — host or admin only
   */
  @Post('/:id/end')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async endMeeting(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.meetingsService.endMeeting(id, userId);
  }

  /**
   * Kick a participant — host only
   */
  @Post('/:id/kick')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async kickParticipant(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: KickParticipantDto,
  ) {
    const hostId = req.user.id;
    await this.meetingsService.kickParticipant(id, hostId, dto.identity);
    return { message: 'Participant kicked successfully' };
  }

  /**
   * Mute all participants — host only
   */
  @Post('/:id/mute-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async muteAll(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const hostId = req.user.id;
    await this.meetingsService.muteAll(id, hostId);
    return { message: 'All participants muted' };
  }

  /**
   * Get chat history — JWT or tempToken required
   */
  @Get('/:id/chat')
  @UseGuards(JwtAuthGuard)
  async getChatHistory(
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.meetingsService.getChatHistory(
      id,
      before,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
