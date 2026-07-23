import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ──────────────────────────────────────
  // User management
  // ──────────────────────────────────────

  /**
   * List all users (paginated, with search and role filter)
   */
  @Get('/users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      role,
    );
  }

  /**
   * Create a new user
   */
  @Post('/users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Req() req: any,
    @Body() dto: CreateUserDto,
  ) {
    const adminUserId = req.user.id;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.adminService.createUser(adminUserId, dto, ipAddress);
  }

  /**
   * Get user detail by ID
   */
  @Get('/users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  /**
   * Update a user
   */
  @Patch('/users/:id')
  async updateUser(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateUserDto,
  ) {
    const adminUserId = req.user.id;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.adminService.updateUser(adminUserId, id, dto, ipAddress);
  }

  /**
   * Deactivate a user (soft delete)
   */
  @Delete('/users/:id')
  @HttpCode(HttpStatus.OK)
  async deactivateUser(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminUserId = req.user.id;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.adminService.deactivateUser(adminUserId, id, ipAddress);
  }

  // ──────────────────────────────────────
  // Meeting management
  // ──────────────────────────────────────

  /**
   * List all meetings with filters
   */
  @Get('/meetings')
  async listMeetings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('hostId') hostId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.listMeetings(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      hostId,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Get meeting detail with participants and chat log
   */
  @Get('/meetings/:id')
  async getMeetingDetail(@Param('id') id: string) {
    return this.adminService.getMeetingDetail(id);
  }

  /**
   * Hard delete a meeting record
   */
  @Delete('/meetings/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMeeting(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminUserId = req.user.id;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    await this.adminService.deleteMeeting(adminUserId, id, ipAddress);
    return { message: 'Meeting deleted successfully' };
  }

  // ──────────────────────────────────────
  // Admin operation logs
  // ──────────────────────────────────────

  /**
   * Get admin operation logs
   */
  @Get('/logs')
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      adminId,
      action,
    );
  }
}
