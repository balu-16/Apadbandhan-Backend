import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Otp, OtpDocument } from '../schemas/otp.schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get SMS configuration from environment variables
   */
  private getSmsConfig() {
    const secret = this.configService.get<string>('SMS_SECRET');
    const sender = this.configService.get<string>('SMS_SENDER');
    const tempid = this.configService.get<string>('SMS_TEMPID');
    const route = this.configService.get<string>('SMS_ROUTE', 'TA');
    const msgtype = this.configService.get<string>('SMS_MSGTYPE', '1');
    const baseUrl = this.configService.get<string>('SMS_BASE_URL');

    if (!secret || !sender || !tempid || !baseUrl) {
      this.logger.warn('SMS configuration incomplete - OTPs will be logged only');
      return null;
    }

    return { secret, sender, tempid, route, msgtype, baseUrl };
  }

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate Indian phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    // Accept 10 digits starting with 6-9, or 12 digits starting with 91
    const indianMobileRegex = /^([6-9]\d{9}|91[6-9]\d{9})$/;
    return indianMobileRegex.test(cleanNumber);
  }

  /**
   * Format phone number to consistent 10-digit format
   */
  formatPhoneNumber(phoneNumber: string): string {
    let cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // Remove 91 country code if present
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      cleanNumber = cleanNumber.substring(2);
    }
    
    return cleanNumber;
  }

  /**
   * Store OTP in database
   */
  async storeOTP(phoneNumber: string, otp: string): Promise<void> {
    const expiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 5);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Delete any existing OTP for this phone
    await this.otpModel.deleteMany({ phone: phoneNumber });

    // Store new OTP
    await this.otpModel.create({
      phone: phoneNumber,
      otp,
      expiresAt,
      verified: false,
    });

    this.logger.log(`✅ OTP stored for ${phoneNumber}, expires at ${expiresAt.toISOString()}`);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<{ isValid: boolean; message: string }> {
    const record = await this.otpModel.findOne({ phone: phoneNumber });

    if (!record) {
      return { isValid: false, message: 'OTP not found. Please request a new one.' };
    }

    if (new Date() > record.expiresAt) {
      await this.otpModel.deleteOne({ _id: record._id });
      return { isValid: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (record.otp !== otp) {
      return { isValid: false, message: 'Invalid OTP' };
    }

    if (record.verified) {
      return { isValid: false, message: 'OTP already used. Please request a new one.' };
    }

    // Mark as verified
    await this.otpModel.updateOne({ _id: record._id }, { verified: true });

    this.logger.log(`✅ OTP verified for ${phoneNumber}`);
    return { isValid: true, message: 'OTP verified successfully' };
  }

  /**
   * Send OTP via SMS
   */
  async sendOtpSms(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    const smsConfig = this.getSmsConfig();

    if (!smsConfig) {
      // SMS not configured - log OTP for development
      this.logger.warn(`📱 SMS not configured. OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'OTP logged (SMS not configured)' };
    }

    try {
      this.logger.log(`📱 Sending OTP SMS to ${phoneNumber}`);

      // Format the SMS message
      const message = `Welcome to Apadbandhav. Your OTP for authentication is ${otp}. Don't share with anybody. Thank you.`;

      // Prepare SMS API parameters
      const params = new URLSearchParams({
        secret: smsConfig.secret,
        sender: smsConfig.sender,
        tempid: smsConfig.tempid,
        receiver: phoneNumber,
        route: smsConfig.route,
        msgtype: smsConfig.msgtype,
        sms: message,
      });

      const smsUrl = `${smsConfig.baseUrl}?${params.toString()}`;

      // Send SMS using fetch
      const response = await fetch(smsUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Apadbandhav SMS Service/1.0' },
      });

      const responseText = await response.text();
      this.logger.log(`📱 SMS API Response: ${response.status} - ${responseText}`);

      if (response.status === 200) {
        this.logger.log(`✅ SMS sent successfully to ${phoneNumber}`);
        return { success: true, message: 'SMS sent successfully' };
      } else {
        this.logger.warn(`❌ SMS failed for ${phoneNumber}: ${responseText}`);
        return { success: false, message: `SMS API error: ${responseText}` };
      }
    } catch (error: any) {
      this.logger.error('📱 SMS Error:', error);
      return { success: false, message: `Failed to send SMS: ${error?.message}` };
    }
  }

  /**
   * Complete OTP flow: generate, store, and send
   */
  async sendOTP(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    phoneNumber: string;
  }> {
    // Format and validate phone number
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    if (!this.validatePhoneNumber(formattedPhone)) {
      throw new Error('Invalid phone number. Must be a valid 10-digit Indian mobile number.');
    }

    // Generate OTP
    const otp = this.generateOTP();

    // Store OTP in database
    await this.storeOTP(formattedPhone, otp);

    // Send OTP via SMS
    const smsResult = await this.sendOtpSms(formattedPhone, otp);

    return {
      success: smsResult.success,
      message: smsResult.success ? 'OTP sent successfully' : smsResult.message,
      phoneNumber: formattedPhone,
    };
  }

  /**
   * Clear OTP after successful use
   */
  async clearOTP(phoneNumber: string): Promise<void> {
    await this.otpModel.deleteMany({ phone: phoneNumber });
    this.logger.log(`🗑️ OTP cleared for ${phoneNumber}`);
  }
}
