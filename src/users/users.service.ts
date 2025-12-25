import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // ==================== PROFILE PHOTO ====================

  async uploadProfilePhoto(id: string, file: Express.Multer.File): Promise<{ message: string; profilePhotoUrl: string }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Store image as base64 data URL
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    await this.userModel.findByIdAndUpdate(id, { profilePhoto: base64Image }).exec();

    return {
      message: 'Profile photo uploaded successfully',
      profilePhotoUrl: `/api/users/${id}/profile-photo`,
    };
  }

  async getProfilePhoto(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.profilePhoto) {
      throw new NotFoundException('No profile photo found');
    }

    // Parse base64 data URL
    const matches = user.profilePhoto.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new NotFoundException('Invalid profile photo format');
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return { buffer, contentType };
  }
}
