import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QrCodesService } from '../qrcodes/qrcodes.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly qrCodesService: QrCodesService,
  ) {}

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (Admin/SuperAdmin only)' })
  getAllUsers(@Request() req, @Query('role') role?: string) {
    return this.adminService.getAllUsers(req.user.role, role);
  }

  @Get('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID (Admin/SuperAdmin only)' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user (Admin/SuperAdmin only)' })
  createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(req.user.role, createUserDto);
  }

  @Patch('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user (Admin/SuperAdmin only)' })
  updateUser(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(req.user.role, id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (Admin/SuperAdmin only)' })
  deleteUser(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteUser(req.user.role, req.user.userId, id);
  }

  // ==================== ADMIN MANAGEMENT (SuperAdmin only) ====================

  @Get('admins')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get all admins (SuperAdmin only)' })
  getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Post('admins')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create a new admin (SuperAdmin only)' })
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createAdmin(createUserDto);
  }

  @Delete('admins/:id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Delete admin (SuperAdmin only)' })
  deleteAdmin(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteAdmin(req.user.userId, id);
  }

  // ==================== DEVICE MANAGEMENT ====================

  @Get('devices')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all devices (Admin/SuperAdmin only)' })
  getAllDevices(@Query('userId') userId?: string) {
    return this.adminService.getAllDevices(userId);
  }

  // ==================== DEVICE GENERATION & QR CODES ====================
  // Note: These routes must come BEFORE devices/:id to avoid route conflicts

  @Post('devices/generate')
  @Roles('admin')
  @ApiOperation({ summary: 'Generate new devices/QR codes (Admin/SuperAdmin only)' })
  async generateDevices(@Body() body: { count: number }) {
    const count = Math.min(Math.max(body.count || 1, 1), 100); // Limit between 1 and 100
    const devices = await this.qrCodesService.generateRandomQrCodes(count);
    return {
      message: `Successfully generated ${devices.length} new devices`,
      count: devices.length,
      devices: devices.map(d => ({
        id: d._id,
        deviceCode: d.deviceCode,
        deviceName: d.deviceName,
        status: d.status,
      })),
    };
  }

  @Get('devices/qrcodes')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all QR codes/available devices with user info (Admin/SuperAdmin only)' })
  async getAllQrCodes() {
    return this.adminService.getAllQrCodesWithUserInfo();
  }

  @Get('devices/qrcodes/stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get QR codes statistics (Admin/SuperAdmin only)' })
  async getQrCodesStats() {
    return this.qrCodesService.getStats();
  }

  // Dynamic route - must come AFTER specific routes
  @Get('devices/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get device by ID (Admin/SuperAdmin only)' })
  getDeviceById(@Param('id') id: string) {
    return this.adminService.getDeviceById(id);
  }

  // ==================== STATISTICS ====================

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getStats(@Request() req) {
    return this.adminService.getStats(req.user.role);
  }

  // ==================== LOGIN LOGS ====================

  @Get('users/:id/login-logs')
  @Roles('admin')
  @ApiOperation({ summary: 'Get login logs for a specific user (Admin/SuperAdmin only)' })
  getUserLoginLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.adminService.getUserLoginLogs(id, limit || 10);
  }

  @Get('admins/:id/login-logs')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get login logs for a specific admin (SuperAdmin only)' })
  getAdminLoginLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.adminService.getAdminLoginLogs(id, limit || 10);
  }

  @Get('login-logs/users')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all user login logs (Admin/SuperAdmin only)' })
  getAllUserLoginLogs(@Query('limit') limit?: number) {
    return this.adminService.getAllUserLoginLogs(limit || 50);
  }

  @Get('login-logs/admins')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Get all admin login logs (SuperAdmin only)' })
  getAllAdminLoginLogs(@Query('limit') limit?: number) {
    return this.adminService.getAllAdminLoginLogs(limit || 50);
  }

  // ==================== QR CODE LOOKUP ====================

  @Get('qrcode/:deviceCode')
  @Roles('admin')
  @ApiOperation({ summary: 'Get QR code info by device code (Admin/SuperAdmin only)' })
  getQrCodeByDeviceCode(@Param('deviceCode') deviceCode: string) {
    return this.adminService.getQrCodeByDeviceCode(deviceCode);
  }
}
