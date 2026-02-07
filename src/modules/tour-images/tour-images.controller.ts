import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TourImagesService } from './tour-images.service';
import { CreateTourImageDto } from './dto/create-tour-image.dto';
import { UpdateTourImageDto } from './dto/update-tour-image.dto';

@Controller('tour-images')
export class TourImagesController {
  constructor(private readonly tourImagesService: TourImagesService) {}

  @Post()
  create(@Body() createTourImageDto: CreateTourImageDto) {
    return this.tourImagesService.create(createTourImageDto);
  }

  @Get()
  findAll() {
    return this.tourImagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tourImagesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTourImageDto: UpdateTourImageDto,
  ) {
    return this.tourImagesService.update(+id, updateTourImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tourImagesService.remove(+id);
  }
}
