import {
  Controller,
  Delete,
  Param,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  Body,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { TourDetailsService } from './tour-details.service';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';

@Controller('tour-details')
@Role(UserRole.ADMIN, UserRole.USER)
export class TourDetailsController {
  constructor(private readonly tourDetailsService: TourDetailsService) {}

  @Patch(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @Message('Images uploaded successfully')
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.tourDetailsService.uploadImages(id, files);
  }

  @Patch(':id/videos')
  @UseInterceptors(FileInterceptor('file'))
  @Message('Video uploaded successfully')
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    return await this.tourDetailsService.uploadVideo(id, file);
  }

  @Delete(':id/images')
  @Message('Image deleted successfully')
  async deleteImage(
    @Param('id') id: string,
    @Body('publicId') publicId: string,
  ) {
    return await this.tourDetailsService.deleteImage(id, publicId);
  }
}
