import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Ip,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-url')
  async createPaymentUrl(@Body() body: { bookingId: string; amount: number; locale?: string }, @Ip() ip: string) {
    // Note: ip decorator might get ::1, need to handle if VNPay requires IPv4 
    // or X-Forwarded-For if behind proxy.
    // For local dev, ::1 is common.
    return {
      url: await this.paymentsService.createPaymentUrl(body.bookingId, body.amount, ip || '127.0.0.1', body.locale),
    };
  }

  @Get('vnpay-return')
  async vnpayReturn(@Query() query: any) {
    return await this.paymentsService.verifyReturnUrl(query);
  }

  @Get('vnpay-ipn')
  async vnpayIpn(@Query() query: any) {
    return await this.paymentsService.verifyIpn(query);
  }
}
