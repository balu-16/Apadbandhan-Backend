import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, SignupDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication Controller
 * 
 * Rate Limiting Note: For production, add @nestjs/throttler module:
 * 1. Install: npm install @nestjs/throttler
 * 2. Add ThrottlerModule.forRoot({ ttl: 60, limit: 3 }) to app.module.ts
 * 3. Add @Throttle(3, 60) decorator to send-otp endpoint (3 requests per 60 seconds)
 * 4. Add @Throttle(5, 60) decorator to verify-otp endpoint (5 requests per 60 seconds)
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Send OTP to phone number
   * Rate limit recommendation: 3 requests per 60 seconds per IP
   */
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  // TODO: Add @Throttle(3, 60) after installing @nestjs/throttler
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  /**
   * Verify OTP and login
   * Rate limit recommendation: 5 requests per 60 seconds per IP
   */
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and login' })
  // TODO: Add @Throttle(5, 60) after installing @nestjs/throttler
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up new user' })
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }
}

