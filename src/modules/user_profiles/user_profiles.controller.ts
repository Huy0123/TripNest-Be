import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserProfilesService } from './user_profiles.service';
import { CreateUserProfileDto } from './dto/create-user_profile.dto';
import { UpdateUserProfileDto } from './dto/update-user_profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createUserProfileDto: CreateUserProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userProfilesService.create(createUserProfileDto, file);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.userProfilesService.findOne(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userProfilesService.update(userId, updateUserProfileDto, file);
  }

  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    return this.userProfilesService.remove(userId);
  }
}
