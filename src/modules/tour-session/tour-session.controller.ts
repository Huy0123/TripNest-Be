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
import { TourSessionService } from './tour-session.service';
import { CreateTourSessionDto } from './dto/create-tour-session.dto';
import { UpdateTourSessionDto } from './dto/update-tour-session.dto';
import { TourSessionResponseDto } from './dto/tour-session-response.dto';
import { plainToClass } from 'class-transformer';

@Controller('tour-sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class TourSessionController {
  constructor(private readonly tourSessionService: TourSessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createTourSessionDto: CreateTourSessionDto,
  ) {
    const tourSession =
      await this.tourSessionService.create(createTourSessionDto);
    return {
      message: 'Tour session created successfully',
      data: plainToClass(TourSessionResponseDto, tourSession, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  async findAll(
    @Query('available') available?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    let sessions;

    if (available === 'true') {
      sessions = await this.tourSessionService.findAvailable();
    } else if (upcoming) {
      const days = parseInt(upcoming) || 30;
      sessions = await this.tourSessionService.findUpcoming(days);
    } else {
      sessions = await this.tourSessionService.findAll();
    }

    return {
      message: 'Tour sessions retrieved successfully',
      data: sessions.map((session) =>
        plainToClass(TourSessionResponseDto, session, {
          excludeExtraneousValues: true,
        }),
      ),
      total: sessions.length,
    };
  }

  @Get('tour/:tourId')
  async findByTour(@Param('tourId') tourId: string) {
    const sessions = await this.tourSessionService.findByTour(tourId);
    return {
      message: 'Tour sessions by tour retrieved successfully',
      data: sessions.map((session) =>
        plainToClass(TourSessionResponseDto, session, {
          excludeExtraneousValues: true,
        }),
      ),
      total: sessions.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tourSession = await this.tourSessionService.findOne(id);
    return {
      message: 'Tour session retrieved successfully',
      data: plainToClass(TourSessionResponseDto, tourSession, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTourSessionDto: UpdateTourSessionDto,
  ) {
    const tourSession = await this.tourSessionService.update(
      id,
      updateTourSessionDto,
    );
    return {
      message: 'Tour session updated successfully',
      data: plainToClass(TourSessionResponseDto, tourSession, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tourSessionService.remove(id);
    return {
      message: 'Tour session deleted successfully',
    };
  }
}
