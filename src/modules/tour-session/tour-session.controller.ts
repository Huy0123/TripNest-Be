import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { TourSessionService } from './tour-session.service';
import { CreateTourSessionDto } from './dto/create-tour-session.dto';
import { UpdateTourSessionDto } from './dto/update-tour-session.dto';
import { BulkCreateTourSessionDto } from './dto/bulk-create-tour-session.dto';
import { TourSessionResponseDto } from './dto/tour-session-response.dto';
import { TourSessionQueryDto, TourSessionMode } from './dto/tour-session-query.dto';
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
  @Message('Tạo phiên tour thành công')
  async create(@Body() createDto: CreateTourSessionDto) {
    return await this.tourSessionService.create(createDto);
  }

  @Post('bulk')
  @Role(UserRole.ADMIN)
  @Message('Tạo nhiều phiên tour thành công')
  async bulkCreate(@Body() bulkCreateDto: BulkCreateTourSessionDto) {
    const result = await this.tourSessionService.bulkCreate(bulkCreateDto);
    return {
      count: result.count,
      sessions: result.sessions.map((session) =>
        plainToClass(TourSessionResponseDto, session, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get()
  @Public()
  @Message('Lấy danh sách phiên tour thành công')
  async findAll(@Query() query: TourSessionQueryDto) {
    let sessions;

    switch (query.mode) {
      case TourSessionMode.AVAILABLE:
        sessions = await this.tourSessionService.findAvailable();
        break;
      case TourSessionMode.UPCOMING:
        sessions = await this.tourSessionService.findUpcoming(query.days);
        break;
      default:
        sessions = await this.tourSessionService.findAll();
    }

    return sessions.map((session) =>
      plainToClass(TourSessionResponseDto, session, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('tour/:tourId')
  @Public()
  @Message('Lấy danh sách phiên của tour thành công')
  async findByTour(@Param('tourId') tourId: string) {
    const sessions = await this.tourSessionService.findByTour(tourId);
    return sessions.map((session) =>
      plainToClass(TourSessionResponseDto, session, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get(':id')
  @Public()
  @Message('Lấy thông tin phiên tour thành công')
  async findOne(@Param('id') id: string) {
    const tourSession = await this.tourSessionService.findOne(id);
    return plainToClass(TourSessionResponseDto, tourSession, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  @Message('Cập nhật phiên tour thành công')
  async update(
    @Param('id') id: string,
    @Body() updateTourSessionDto: UpdateTourSessionDto,
  ) {
    const tourSession = await this.tourSessionService.update(
      id,
      updateTourSessionDto,
    );
    return plainToClass(TourSessionResponseDto, tourSession, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @Message('Xóa phiên tour thành công')
  async remove(@Param('id') id: string) {
    await this.tourSessionService.remove(id);
  }
}
