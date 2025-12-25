import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './services/otp.service';
import { SendOtpDto, VerifyOtpDto, SignupDto } from './dto/auth.dto';
import {
  UserLoginLog,
  UserLoginLogDocument,
  AdminLoginLog,
  AdminLoginLogDocument,
  SuperadminLoginLog,
  SuperadminLoginLogDocument,
} from './schemas/login-log.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
    @InjectModel(UserLoginLog.name)
    private userLoginLogModel: Model<UserLoginLogDocument>,
    @InjectModel(AdminLoginLog.name)
    private adminLoginLogModel: Model<AdminLoginLogDocument>,
    @InjectModel(SuperadminLoginLog.name)
    private superadminLoginLogModel: Model<SuperadminLoginLogDocument>,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ 
    message: string; 
    userExists: boolean;
  }> {
    const { phone } = sendOtpDto;
    
    // Format phone number
    const formattedPhone = this.otpService.formatPhoneNumber(phone);
    
    // Validate phone number
    if (!this.otpService.validatePhoneNumber(formattedPhone)) {
      throw new BadRequestException('Invalid phone number. Must be a valid 10-digit Indian mobile number.');
    }

    // Check if user exists
    const existingUser = await this.usersService.findByPhone(formattedPhone);
    const userExists = !!existingUser;

    // Send OTP via SMS
    const result = await this.otpService.sendOTP(formattedPhone);
    
    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return { 
      message: userExists 
        ? 'OTP sent successfully. Please login.'
        : 'OTP sent successfully. Please complete signup.',
      userExists,
    };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ access_token: string; user: any }> {
    const { phone, otp } = verifyOtpDto;
    
    // Format phone number
    const formattedPhone = this.otpService.formatPhoneNumber(phone);
    
    // Verify OTP
    const verification = await this.otpService.verifyOTP(formattedPhone, otp);
    
    if (!verification.isValid) {
      throw new UnauthorizedException(verification.message);
    }

    // Find user
    const user = await this.usersService.findByPhone(formattedPhone);
    
    if (!user) {
      throw new UnauthorizedException('User not found. Please sign up first.');
    }

    // Clear OTP after successful login
    await this.otpService.clearOTP(formattedPhone);

    // Log the login based on user role
    await this.logLogin(user, ipAddress, userAgent);

    // Update user's last login info
    await this.usersService.updateLastLogin(user._id.toString(), ipAddress);

    const payload = { userId: user._id, phone: user.phone, role: user.role || 'user' };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
      },
    };
  }

  /**
   * Log login to the appropriate collection based on user role
   */
  private async logLogin(user: any, ipAddress?: string, userAgent?: string): Promise<void> {
    const loginData = {
      userId: user._id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      deviceInfo: this.parseDeviceInfo(userAgent),
      loginMethod: 'otp',
      success: true,
      loginAt: new Date(),
    };

    try {
      switch (user.role) {
        case 'superadmin':
          await this.superadminLoginLogModel.create(loginData);
          this.logger.log(`✅ SuperAdmin login logged: ${user.phone}`);
          break;
        case 'admin':
          await this.adminLoginLogModel.create(loginData);
          this.logger.log(`✅ Admin login logged: ${user.phone}`);
          break;
        default:
          await this.userLoginLogModel.create(loginData);
          this.logger.log(`✅ User login logged: ${user.phone}`);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to log login for ${user.phone}:`, error);
      // Don't throw - login should still succeed even if logging fails
    }
  }

  /**
   * Parse device info from user agent string
   */
  private parseDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Desktop';
  }

  async signup(signupDto: SignupDto): Promise<{ access_token: string; user: any }> {
    const { phone, otp, fullName, email } = signupDto;
    
    // Format phone number
    const formattedPhone = this.otpService.formatPhoneNumber(phone);
    
    // Verify OTP
    const verification = await this.otpService.verifyOTP(formattedPhone, otp);
    
    if (!verification.isValid) {
      throw new UnauthorizedException(verification.message);
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByPhone(formattedPhone);
    if (existingUser) {
      throw new BadRequestException('User with this phone number already exists. Please login instead.');
    }

    // Create new user
    const user = await this.usersService.create({
      fullName,
      email,
      phone: formattedPhone,
    });

    // Clear OTP after successful signup
    await this.otpService.clearOTP(formattedPhone);

    const payload = { userId: user._id, phone: user.phone, role: user.role || 'user' };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
      },
    };
  }

  async validateUser(userId: string): Promise<any> {
    return this.usersService.findOne(userId);
  }
}
