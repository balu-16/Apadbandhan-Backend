import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './services/otp.service';
import { SendOtpDto, VerifyOtpDto, SignupDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
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

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ access_token: string; user: any }> {
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
