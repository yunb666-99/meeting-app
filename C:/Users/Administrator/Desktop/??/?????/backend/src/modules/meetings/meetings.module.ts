import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingsGateway } from './meetings.gateway';
import { LivekitModule } from '../livekit/livekit.module';

@Module({
  imports: [
    forwardRef(() => MeetingsModule),
    LivekitModule,
    JwtModule.register({}),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsGateway],
  exports: [MeetingsService, MeetingsGateway],
})
export class MeetingsModule {}
