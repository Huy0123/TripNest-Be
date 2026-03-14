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
import { BulkCreateTourSessionDto } from './dto/bulk-create-tour-session.dto';
import { TourSessionResponseDto } from './dto/tour-session-response.dto';
import { plainToClass } from 'class-transformer';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';

@Controller('tour-sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class TourSessionController {
  constructor(private readonly tourSessionService: TourSessionService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @Message('Tour session created successfully')
  async create(@Body(ValidationPipe) createDto: CreateTourSessionDto) {
    return await this.tourSessionService.create(createDto);
  }

  @Post('bulk')
  @Role(UserRole.ADMIN)
  @Message('Tour sessions bulk created successfully')
  async bulkCreate(@Body(ValidationPipe) bulkCreateDto: BulkCreateTourSessionDto) {
    const result = await this.tourSessionService.bulkCreate(bulkCreateDto);
    return {
      message: `${result.count} tour sessions bulk created successfully`,
      data: result.sessions.map((session) =>
        plainToClass(TourSessionResponseDto, session, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get()
  @Public()
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
  @Public()
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
  @Public()
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
  @Role(UserRole.ADMIN)
  @Message('Tour session updated successfully')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTourSessionDto: UpdateTourSessionDto,
  ) {
    const tourSession = await this.tourSessionService.update(
      id,
      updateTourSessionDto,
    );
    return {
      data: plainToClass(TourSessionResponseDto, tourSession, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.tourSessionService.remove(id);
    return {
      message: 'Tour session deleted successfully',
    };
  }
}
