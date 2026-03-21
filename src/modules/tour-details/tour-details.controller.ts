import {
  Controller,
  Delete,
  Get,
  Param,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  Patch,
  ValidationPipe,
  Body,
  Post,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { TourDetailsService } from './tour-details.service';
import { Role } from '@/decorators/role.decorator';
import { Public } from '@/decorators/public.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';
import { UpdateTourDetailDto } from './dto/update-tour-detail.dto';
import { CreateTourDetailDto } from './dto/create-tour-detail.dto';
@Controller('tour-details')
export class TourDetailsController {
  constructor(private readonly tourDetailsService: TourDetailsService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @Message('Tạo tour detail thành công')
  async create(@Body(ValidationPipe) createTourDetailDto: CreateTourDetailDto) {
    return await this.tourDetailsService.create(createTourDetailDto);
  }

  @Public()
  @Get()
  @Message('Lấy danh sách tour detail thành công')
  async findAll() {
    return await this.tourDetailsService.findAll();
  }

  @Public()
  @Get(':id')
  @Message('Lấy thông tin tour detail thành công')
  async findOne(@Param('id') id: string) {
    return await this.tourDetailsService.findOne(id);
  }

  @Public()
  @Get('by-tour/:tourId')
  @Message('Lấy thông tin tour detail theo tour thành công')
  async findByTourId(@Param('tourId') tourId: string) {
    return await this.tourDetailsService.findByTourId(tourId);
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  @Message('Cập nhật tour detail thành công')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTourDetailDto: UpdateTourDetailDto,
  ) {
    return await this.tourDetailsService.update(id, updateTourDetailDto);
  }

  @Patch(':id/images')
  @Role(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  @Message('Tải ảnh lên thành công')
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.tourDetailsService.uploadImages(id, files);
  }

  @Patch(':id/videos')
  @Role(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Message('Tải video lên thành công')
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.tourDetailsService.uploadVideo(id, file);
  }

  @Delete(':id/images/:publicId')
  @Role(UserRole.ADMIN)
  @Message('Xóa ảnh thành công')
  async deleteImage(
    @Param('id') id: string,
    @Param('publicId') publicId: string,
  ) {
    return await this.tourDetailsService.deleteImage(id, publicId);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @Message('Xóa tour detail thành công')
  async remove(@Param('id') id: string) {
    return await this.tourDetailsService.remove(id);
  }
}
