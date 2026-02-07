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
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourResponseDto } from './dto/tour-response.dto';
import { ToursQueryDto } from './dto/tours-query.dto';
import { plainToClass } from 'class-transformer';

@Controller('tours')
@UseInterceptors(ClassSerializerInterceptor)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createTourDto: CreateTourDto) {
    const tour = await this.toursService.create(createTourDto);
    return {
      message: 'Tour created successfully',
      data: plainToClass(TourResponseDto, tour, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  async findAll(@Query() query: ToursQueryDto) {
    const result = await this.toursService.findAll(query);

    return {
      message: 'Tours retrieved successfully',
      data: result.data.map((tour) =>
        plainToClass(TourResponseDto, tour, { excludeExtraneousValues: true }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('location/:locationId')
  async findByLocation(@Param('locationId') locationId: string) {
    const tours = await this.toursService.findByLocation(locationId);
    return {
      message: 'Tours by location retrieved successfully',
      data: tours.map((tour) =>
        plainToClass(TourResponseDto, tour, { excludeExtraneousValues: true }),
      ),
      total: tours.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tour = await this.toursService.findOne(id);
    return {
      message: 'Tour retrieved successfully',
      data: plainToClass(TourResponseDto, tour, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTourDto: UpdateTourDto,
  ) {
    const tour = await this.toursService.update(id, updateTourDto);
    return {
      message: 'Tour updated successfully',
      data: plainToClass(TourResponseDto, tour, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.toursService.remove(id);
    return {
      message: 'Tour deleted successfully',
    };
  }
}
