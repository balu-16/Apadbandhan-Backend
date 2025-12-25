import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';
import { QrCode, QrCodeDocument } from '../qrcodes/schemas/qrcode.schema';
import { CreateUserDto, UpdateUserDto, UserRole } from '../users/dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private deviceModel: Model<DeviceDocument>,
    @InjectModel(QrCode.name)
    private qrCodeModel: Model<QrCodeDocument>,
  ) { }

  // ==================== HELPER METHODS ====================

  /**
   * Check if a user with the given email or phone already exists
   * @throws BadRequestException if user already exists
   */
  private async checkUserExists(email: string, phone: string): Promise<void> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { phone }],
    }).exec();

    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }
  }

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(requesterRole: UserRole, filterRole?: string): Promise<UserDocument[]> {
    const query: any = {};

    // Filter by role if specified
    if (filterRole) {
      query.role = filterRole;
    }
    // If no filter, admins see users only, superadmins see all
    else if (requesterRole === 'admin') {
      // Admins can see regular users only (not other admins/superadmins)
      query.role = 'user';
    }
    // SuperAdmin sees all users by default

    return this.userModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getUserById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(requesterRole: UserRole, createUserDto: CreateUserDto): Promise<UserDocument> {
    // Admin can only create users, SuperAdmin can create any role
    if (requesterRole === 'admin' && createUserDto.role && createUserDto.role !== 'user') {
      throw new ForbiddenException('Admin can only create users with "user" role');
    }

    // Check if user already exists
    await this.checkUserExists(createUserDto.email, createUserDto.phone);

    const user = new this.userModel({
      ...createUserDto,
      role: createUserDto.role || 'user',
    });
    return user.save();
  }

  async updateUser(requesterRole: UserRole, id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Admin can only update users, not admins or superadmins
    if (requesterRole === 'admin' && existingUser.role !== 'user') {
      throw new ForbiddenException('Admin can only update users with "user" role');
    }

    // Admin cannot change role to admin or superadmin
    if (requesterRole === 'admin' && updateUserDto.role && updateUserDto.role !== 'user') {
      throw new ForbiddenException('Admin cannot change role to admin or superadmin');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    return user;
  }

  async deleteUser(requesterRole: UserRole, requesterId: string, id: string): Promise<{ message: string }> {
    // Cannot delete yourself
    if (requesterId === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Admin can only delete users, not admins or superadmins
    if (requesterRole === 'admin' && user.role !== 'user') {
      throw new ForbiddenException('Admin can only delete users with "user" role');
    }

    // SuperAdmin cannot delete other superadmins
    if (requesterRole === 'superadmin' && user.role === 'superadmin') {
      throw new ForbiddenException('Cannot delete another superadmin');
    }

    await this.userModel.findByIdAndDelete(id).exec();
    return { message: 'User deleted successfully' };
  }

  // ==================== ADMIN MANAGEMENT (SuperAdmin only) ====================

  async getAllAdmins(): Promise<UserDocument[]> {
    return this.userModel.find({ role: 'admin' }).sort({ createdAt: -1 }).exec();
  }

  async createAdmin(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if user already exists
    await this.checkUserExists(createUserDto.email, createUserDto.phone);

    const admin = new this.userModel({
      ...createUserDto,
      role: 'admin',
    });
    return admin.save();
  }

  async deleteAdmin(requesterId: string, id: string): Promise<{ message: string }> {
    // Cannot delete yourself
    if (requesterId === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const admin = await this.userModel.findById(id).exec();
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (admin.role !== 'admin') {
      throw new BadRequestException('This user is not an admin');
    }

    await this.userModel.findByIdAndDelete(id).exec();
    return { message: 'Admin deleted successfully' };
  }

  // ==================== DEVICE MANAGEMENT ====================

  async getAllDevices(userId?: string): Promise<DeviceDocument[]> {
    const query: any = { isActive: true };
    if (userId) {
      query.userId = userId;
    }
    return this.deviceModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getDeviceById(id: string): Promise<DeviceDocument> {
    const device = await this.deviceModel.findById(id).exec();
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  // ==================== STATISTICS ====================

  async getStats(requesterRole: UserRole): Promise<any> {
    const stats: any = {
      totalDevices: await this.deviceModel.countDocuments({ isActive: true }).exec(),
      onlineDevices: await this.deviceModel.countDocuments({ isActive: true, status: 'online' }).exec(),
      offlineDevices: await this.deviceModel.countDocuments({ isActive: true, status: 'offline' }).exec(),
    };

    if (requesterRole === 'admin') {
      stats.totalUsers = await this.userModel.countDocuments({ role: 'user' }).exec();
    } else {
      // SuperAdmin sees all stats
      stats.totalUsers = await this.userModel.countDocuments({ role: 'user' }).exec();
      stats.totalAdmins = await this.userModel.countDocuments({ role: 'admin' }).exec();
      stats.totalSuperAdmins = await this.userModel.countDocuments({ role: 'superadmin' }).exec();
    }

    return stats;
  }

  // ==================== QR CODES WITH USER INFO ====================

  async getAllQrCodesWithUserInfo(): Promise<any[]> {
    // Get all QR codes
    const qrCodes = await this.qrCodeModel.find().sort({ createdAt: -1 }).exec();

    // Get all user IDs that are assigned
    const assignedUserIds = qrCodes
      .filter(qr => qr.assignedToUserId)
      .map(qr => qr.assignedToUserId);

    // Fetch users in bulk
    const users = await this.userModel.find({
      _id: {
        $in: assignedUserIds.map(id => {
          try {
            return new Types.ObjectId(id);
          } catch {
            return id;
          }
        })
      }
    }).exec();

    // Create a map for quick lookup
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Map QR codes with user info
    return qrCodes.map(qr => {
      const qrObj = qr.toJSON();
      const assignedUser = qr.assignedToUserId ? userMap.get(qr.assignedToUserId) : null;

      return {
        ...qrObj,
        id: qr._id,
        qrImageUrl: `/qrcodes/image/${qr.deviceCode}`,
        assignedUser: assignedUser ? {
          id: assignedUser._id,
          fullName: assignedUser.fullName,
          email: assignedUser.email,
          phone: assignedUser.phone,
        } : null,
      };
    });
  }
}
