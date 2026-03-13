import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';

@Controller('bookings')
@Role(UserRole.USER)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.createBooking(createBookingDto, userId);
  }

  @Get()
  async findAllByUser(@Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.findAllByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.findOne(id, userId);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.cancelBooking(id, userId);
  }
}
