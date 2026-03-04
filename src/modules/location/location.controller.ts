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
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Message } from '@/decorators/message.decorator';
import { Public } from '@/decorators/public.decorator';

@Controller('locations')
@UseInterceptors(ClassSerializerInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Message('Location created successfully')
  async create(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
    return await this.locationService.create(createLocationDto);
  }

  @Get()
  @Public()
  async findAll(@Query('country') country?: string) {
    let locations;

    if (country) {
      locations = await this.locationService.findByCountry(country);
    } else {
      locations = await this.locationService.findAll();
    }

    return {
      message: 'Locations retrieved successfully',
      data: locations,
      total: locations.length,
    };
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const location = await this.locationService.findOne(id);
    return {
      message: 'Location retrieved successfully',
      data: location,
    };
  }

  @Patch(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
  ) {
    const location = await this.locationService.update(id, updateLocationDto);
    return {
      message: 'Location updated successfully',
      data: location,
    };
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    return {
      message: 'Location deleted successfully',
    };
  }
}
