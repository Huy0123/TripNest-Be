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
import { LocationResponseDto } from './dto/location-response.dto';
import { plainToClass } from 'class-transformer';

@Controller('locations')
@UseInterceptors(ClassSerializerInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
    const location = await this.locationService.create(createLocationDto);
    return {
      message: 'Location created successfully',
      data: plainToClass(LocationResponseDto, location, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('country') country?: string,
  ) {
    let locations;

    if (search) {
      locations = await this.locationService.search(search);
    } else if (country) {
      locations = await this.locationService.findByCountry(country);
    } else {
      locations = await this.locationService.findAll();
    }

    return {
      message: 'Locations retrieved successfully',
      data: locations.map((location) =>
        plainToClass(LocationResponseDto, location, {
          excludeExtraneousValues: true,
        }),
      ),
      total: locations.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const location = await this.locationService.findOne(id);
    return {
      message: 'Location retrieved successfully',
      data: plainToClass(LocationResponseDto, location, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
  ) {
    const location = await this.locationService.update(id, updateLocationDto);
    return {
      message: 'Location updated successfully',
      data: plainToClass(LocationResponseDto, location, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    return {
      message: 'Location deleted successfully',
    };
  }
}
