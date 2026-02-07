import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const userId = req.user?.id; // From JWT auth
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return await this.bookingsService.createBooking(createBookingDto, userId);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.bookingsService.refundBooking(id);
  }
}
