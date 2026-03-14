import {
  Controller,
  Get,
  Post,
  Body,
  Ip,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-url')
  @Role(UserRole.USER)
  async createPaymentUrl(@Body() body: { bookingId: string; amount: number; locale?: string }, @Ip() ip: string) {
    return {
      url: await this.paymentsService.createPaymentUrl(body.bookingId, body.amount, ip || '127.0.0.1', body.locale),
    };
  }

  @Get('vnpay-return')
  @Public()
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.paymentsService.verifyReturnUrl(query);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (result.code === '00') {
      return res.redirect(`${frontendUrl}/booking/success`);
    } else {
      return res.redirect(`${frontendUrl}/booking/failed?reason=${result.message}`);
    }
  }

  @Get('vnpay-ipn')
  @Public()
  async vnpayIpn(@Query() query: any) {
    return await this.paymentsService.verifyIpn(query);
  }
}
