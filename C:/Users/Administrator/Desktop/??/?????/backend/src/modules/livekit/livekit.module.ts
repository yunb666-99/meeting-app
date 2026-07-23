import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ConfigModule],
  providers: [LivekitService],
  exports: [LivekitService],
})
export class LivekitModule {}
