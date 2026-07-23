import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * Get overview statistics
   */
  @Get('/overview')
  async getOverview() {
    return this.statsService.getOverview();
  }

  /**
   * Get meeting count over time (time-series for charts)
   */
  @Get('/meetings')
  async getMeetingsOverTime(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.statsService.getMeetingsOverTime(
      from || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      to || new Date().toISOString(),
      (granularity as 'day' | 'week' | 'month') || 'day',
    );
  }

  /**
   * Get new users over time (time-series for charts)
   */
  @Get('/users')
  async getUsersOverTime(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.statsService.getUsersOverTime(
      from || new Date(new Date().getFullYear(), 0, 1).toISOString(),
      to || new Date().toISOString(),
      (granularity as 'day' | 'week' | 'month') || 'day',
    );
  }
}
