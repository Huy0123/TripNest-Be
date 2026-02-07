import { Injectable, Logger } from '@nestjs/common';
import { CreateUserProfileDto } from './dto/create-user_profile.dto';
import { UpdateUserProfileDto } from './dto/update-user_profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfile } from './entities/user_profile.entity';
import { Repository } from 'typeorm';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UserProfilesService {
  private readonly logger = new Logger(UserProfilesService.name);
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly uploadService: UploadService,
  ) {}
  async create(
    createUserProfileDto: CreateUserProfileDto,
    file?: Express.Multer.File,
  ) {
    this.logger.log('Starting to create user profile');
    try {
      let imgUrl = '';
      if (file) {
        this.logger.log('File received for upload');
        const uploadedImage = await this.uploadService.uploadImage(
          file,
          'user_profiles',
        );
        imgUrl = uploadedImage.url;
        this.logger.log('Image uploaded successfully');
      }
      const userProfile = this.userProfileRepository.create({
        ...createUserProfileDto,
        avatarUrl: imgUrl || undefined,
      });
      await this.userProfileRepository.save(userProfile);
      this.logger.log('User profile created successfully');
    } catch (error) {
      this.logger.error('Error creating user profile', error.stack);
      throw error;
    }
  }

  async findOne(userId: string) {
    this.logger.log(`Fetching user profile with ID: ${userId}`);
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });
    if (!userProfile) {
      this.logger.warn(`User profile with ID: ${userId} not found`);
      return null;
    }
    this.logger.log(`User profile with ID: ${userId} retrieved successfully`);
    return userProfile;
  }

  async update(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
    file?: Express.Multer.File,
  ) {
    this.logger.log(`Starting to update user profile with ID: ${userId}`);
    try {
      const userProfile = await this.findOne(userId);
      let imgUrl = '';
      if (!userProfile) {
        this.logger.warn(
          `User profile with ID: ${userId} not found for update`,
        );
        return null;
      }
      if (file) {
        this.logger.log('File received for upload during update');
        const uploadedImage = await this.uploadService.uploadImage(
          file,
          'user_profiles',
        );
        imgUrl = uploadedImage.url;
        this.logger.log('Image uploaded successfully during update');
      }
      const updatedProfile = {
        ...userProfile,
        ...updateUserProfileDto,
        avatarUrl: imgUrl || userProfile.avatarUrl,
      };
      await this.userProfileRepository.save(updatedProfile);
      this.logger.log(`User profile with ID: ${userId} updated successfully`);
      return updatedProfile;
    } catch (error) {
      this.logger.error(
        `Error updating user profile with ID: ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(userId: string) {
    try {
      this.logger.log(`Starting to remove user profile with ID: ${userId}`);
      const userProfile = await this.findOne(userId);
      if (userProfile?.avatarUrl)
        await this.uploadService.deleteImage(
          this.extractPublicId(userProfile.avatarUrl),
        );
      await this.userProfileRepository.delete({ userId });
      this.logger.log(`User profile with ID: ${userId} removed successfully`);
    } catch (error) {
      this.logger.error(
        `Error removing user profile with ID: ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  private extractPublicId(url: string): string {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = filename.split('.')[0];
      return publicId;
    } catch (error) {
      this.logger.error('Error extracting public ID from URL', error.stack);
      throw error;
    }
  }
}
