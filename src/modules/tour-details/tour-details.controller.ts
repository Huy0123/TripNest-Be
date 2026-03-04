import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TourDetailsService } from './tour-details.service';
import { Public } from '@/decorators/public.decorator';
import { Message } from '@/decorators/message.decorator';

@Controller('tour-details')
export class TourDetailsController {
  constructor(private readonly tourDetailsService: TourDetailsService) {}

  @Post(':id/images')
  @Public()
  @UseInterceptors(FilesInterceptor('files', 10))
  @Message('Images uploaded successfully')
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.tourDetailsService.uploadImages(id, files);
  }

  @Delete(':id/images')
  @Public()
  @Message('Image deleted successfully')
  async deleteImage(
    @Param('id') id: string,
    @Body('publicId') publicId: string,
  ) {
    return await this.tourDetailsService.deleteImage(id, publicId);
  }
}
