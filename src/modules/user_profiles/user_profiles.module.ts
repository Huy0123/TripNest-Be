import { Module } from '@nestjs/common';
import { UserProfilesService } from './user_profiles.service';
import { UserProfilesController } from './user_profiles.controller';
import { UploadModule } from '../upload/upload.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user_profile.entity';

@Module({
  imports: [UploadModule, TypeOrmModule.forFeature([UserProfile])],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}
