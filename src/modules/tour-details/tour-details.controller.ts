import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TourDetailsService } from './tour-details.service';
import { CreateTourDetailDto } from './dto/create-tour-detail.dto';
import { UpdateTourDetailDto } from './dto/update-tour-detail.dto';

@Controller('tour-details')
export class TourDetailsController {
  constructor(private readonly tourDetailsService: TourDetailsService) {}

  @Post()
  create(@Body() createTourDetailDto: CreateTourDetailDto) {
    return this.tourDetailsService.create(createTourDetailDto);
  }

  @Get()
  findAll() {
    return this.tourDetailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tourDetailsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTourDetailDto: UpdateTourDetailDto,
  ) {
    return this.tourDetailsService.update(+id, updateTourDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tourDetailsService.remove(+id);
  }
}
