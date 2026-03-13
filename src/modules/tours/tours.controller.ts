import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursQueryDto } from './dto/tours-query.dto';
import { Message } from '@/decorators/message.decorator';

@Controller('tours')
@UseInterceptors(ClassSerializerInterceptor)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Message('Tour created successfully')
  async create(@Body(ValidationPipe) createTourDto: CreateTourDto) {
    return await this.toursService.create(createTourDto);
  }

  @Public()
  @Get('discount')
  @Message('Discounted tours retrieved successfully')
  async findByDiscount() {
    return await this.toursService.findByDiscount();
  }

  @Public()
  @Get()
  @Message('Tours retrieved successfully')
  async findAll(@Query() query: ToursQueryDto) {
    return await this.toursService.findAll(query);
  }

  @Public()
  @Get(':id')
  @Message('Tour retrieved successfully')
  async findOne(@Param('id') id: string) {
    return await this.toursService.findOne(id);
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  @Message('Tour updated successfully')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTourDto: UpdateTourDto,
  ) {
    return await this.toursService.update(id, updateTourDto);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @Message('Tour deleted successfully')
  async remove(@Param('id') id: string) {
    return await this.toursService.remove(id);
  }

  @Patch(':id/image')
  @Role(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @Message('Tour image uploaded successfully')
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.toursService.uploadImage(id, file);
  }
}
