import {
  Controller,
  Get,
  Post,
  Body,
  Ip,
  Query,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { VnpayReturnQueryDto } from './dto/vnpay-return-query.dto';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-url')
  @Role(UserRole.USER)
  @Message('Tạo đường dẫn thanh toán thành công')
  async createPaymentUrl(
    @Body() body: CreatePaymentUrlDto,
    @Ip() ip: string,
  ) {
    const url = await this.paymentsService.createPaymentUrl(
      body.bookingId,
      body.amount,
      ip || '127.0.0.1',
      body.locale
    );
    return { url };
  }

  @Get('vnpay-return')
  @Public()
  async vnpayReturn(
    @Query() query: VnpayReturnQueryDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const rawQueryString = req.url.split('?')[1];
    const result = await this.paymentsService.verifyReturnUrl(query, rawQueryString);
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    this.logger.log(`Redirecting to FE: Code ${result.code}, Message ${result.message}`);

    if (result.code === '00') {
      return res.redirect(`${frontendUrl}/booking/success`);
    } else {
      const redirectUrl = `${frontendUrl}/booking/failed?reason=${encodeURIComponent(result.message)}`;
      this.logger.log(`Redirecting to failure page: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }
  }

}
