import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { QrCodesService } from './qrcodes.service';
import { CreateQrCodeDto, UploadQrImageDto, AssignQrCodeDto } from './dto/qrcode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { qrCodeMulterConfig } from '../shared/multer.config';

@ApiTags('qrcodes')
@Controller('qrcodes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) { }

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Validate a device code (for QR scanner)
   * Public endpoint - no auth required
   */
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a 16-digit device code' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateCode(@Param('code') code: string) {
    return this.qrCodesService.validateDeviceCode(code);
  }

  /**
   * Get QR code image by device code (public)
   * Used for displaying QR codes
   */
  @Get('image/:code')
  @ApiOperation({ summary: 'Get QR code image by device code' })
  @ApiResponse({ status: 200, description: 'Returns QR code image' })
  async getQrImageByCode(
    @Param('code') code: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.qrCodesService.getQrImageByCode(code);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(buffer);
  }

  // ==================== PROTECTED ENDPOINTS ====================

  /**
   * Get all QR codes
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all QR codes (without image data)' })
  findAll() {
    return this.qrCodesService.findAll();
  }

  /**
   * Get available QR codes
   */
  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available (unassigned) QR codes' })
  findAvailable() {
    return this.qrCodesService.findAvailable();
  }

  /**
   * Get QR code statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code statistics' })
  getStats() {
    return this.qrCodesService.getStats();
  }

  /**
   * Create a new QR code entry
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new QR code entry' })
  @ApiResponse({ status: 201, description: 'QR code created successfully' })
  createDevice(@Body() createDto: CreateQrCodeDto) {
    return this.qrCodesService.createDevice(createDto);
  }

  /**
   * Generate random QR codes (admin use)
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate random QR codes' })
  @ApiBody({ schema: { properties: { count: { type: 'number', default: 10 } } } })
  async generateRandom(@Body('count') count: number = 10) {
    const qrCodes = await this.qrCodesService.generateRandomQrCodes(count);
    return {
      message: `Generated ${qrCodes.length} QR codes`,
      count: qrCodes.length,
      codes: qrCodes.map(qr => ({
        id: qr._id,
        deviceCode: qr.deviceCode,
        deviceName: qr.deviceName
      }))
    };
  }

  /**
   * Upload QR image for a device (by ID)
   */
  @Post('upload-qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('qrImage', qrCodeMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload QR code image for a device' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'MongoDB ObjectId of the device' },
        qrImage: { type: 'string', format: 'binary', description: 'QR code image file' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image upload successful' })
  async uploadQrImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadQrImageDto,
  ) {
    return this.qrCodesService.uploadQrImage(uploadDto.deviceId, file);
  }

  /**
   * Upload QR image for a device (by code)
   */
  @Post('upload-qr/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('qrImage', qrCodeMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload QR code image by device code' })
  @ApiResponse({ status: 200, description: 'Image upload successful' })
  async uploadQrImageByCode(
    @Param('code') code: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.qrCodesService.uploadQrImageByCode(code, file);
  }

  /**
   * Get QR code image by ID
   */
  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code image by device ID' })
  @ApiResponse({ status: 200, description: 'Returns QR code image as binary' })
  async getQrImage(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.qrCodesService.getQrImage(id);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  /**
   * Get QR code details by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get QR code details by ID' })
  findOne(@Param('id') id: string) {
    return this.qrCodesService.findOne(id);
  }

  /**
   * Assign QR code to a user
   */
  @Post('assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign QR code to a user' })
  assignToUser(@Body() assignDto: AssignQrCodeDto) {
    return this.qrCodesService.assignToUser(assignDto);
  }

  /**
   * Unassign QR code
   */
  @Post('unassign/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unassign QR code from user' })
  unassign(@Param('code') code: string) {
    return this.qrCodesService.unassign(code);
  }

  /**
   * Delete QR code
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a QR code' })
  remove(@Param('id') id: string) {
    return this.qrCodesService.remove(id);
  }
}
