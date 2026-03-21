import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Patch,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';

@Controller('bookings')
@Role(UserRole.USER)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Message('Đặt chỗ thành công')
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.createBooking(createBookingDto, userId);
  }

  @Get()
  @Message('Lấy danh sách đặt chỗ thành công')
  async findAllByUser(@Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.findAllByUserId(userId);
  }

  @Get(':id')
  @Message('Lấy thông tin đặt chỗ thành công')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.findOne(id, userId);
  }

  @Patch(':id/cancel')
  @Message('Hủy đặt chỗ thành công')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return await this.bookingsService.cancelBooking(id, userId);
  }
}
