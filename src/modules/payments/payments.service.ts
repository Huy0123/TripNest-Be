import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from '@/enums/payment-status.enum';
import { PaymentProvider } from '@/enums/payment-provider.enum';
import { ErrorMessages } from '@/constants/error-messages.constant';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { BookingsService } from '../bookings/bookings.service';
import dayjs from 'dayjs';
import { VnpayReturnQueryDto } from './dto/vnpay-return-query.dto';

interface VnpayParams {
  [key: string]: string | number | undefined;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
  ) {}

  async createPaymentUrl(
    bookingId: string,
    amount: number,
    ipAddr: string,
    locale = 'vn',
  ): Promise<string> {
    const tmnCode = this.configService.get('VNP_TMNCODE');
    const secretKey = this.configService.get('VNP_HASHSECRET').trim();
    const vnpUrl = this.configService.get('VNP_URL');
    const returnUrl = this.configService.get('VNP_RETURN_URL');

    const createDate = dayjs().format('YYYYMMDDHHmmss');
    const txnRef = `${bookingId}_${dayjs().valueOf()}`;

    const payment = this.paymentRepository.create({
      booking: { id: bookingId } as any,
      amount,
      provider: PaymentProvider.VNPAY,
      status: PaymentStatus.PENDING,
      transactionRef: txnRef,
      currency: 'VND',
    });
    await this.paymentRepository.save(payment);

    const vnp_Params: VnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: Math.floor(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan dat cho booking ${bookingId.slice(0, 8)}`,
      vnp_OrderType: '250000',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_Locale: locale,
    };

    const url = this.sortAndSign(vnp_Params, vnpUrl, secretKey);
    this.logger.log(`Tạo URL thanh toán cho booking ${bookingId}: ${url}`);
    return url;
  }

  async verifyReturnUrl(query: VnpayReturnQueryDto, rawQueryString?: string) {
    const secureHash = query.vnp_SecureHash;
    const secretKey = this.configService.get('VNP_HASHSECRET').trim();

    let signData = '';
    if (rawQueryString) {
      const queryParams = rawQueryString.split('&');
      const filteredParams = queryParams
        .filter((p) => p.startsWith('vnp_') && !p.startsWith('vnp_SecureHash'))
        .sort();
      signData = filteredParams.join('&');
    } else {
      const params = { ...query } as Record<string, string | undefined>;
      delete params['vnp_SecureHash'];
      delete params['vnp_SecureHashType'];
      const sortedParams = this.sortObject(params);
      signData = querystring.stringify(sortedParams, { encode: false });
    }

    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    this.logger.log(`Nhận callback từ VNPay cho TxnRef ${query.vnp_TxnRef}`);
    this.logger.log(`Chuỗi ký (signData): ${signData}`);
    this.logger.log(`Hash nhận được: ${secureHash}`);
    this.logger.log(`Hash tính toán: ${signed}`);

    if (secureHash.toLowerCase() !== signed.toLowerCase()) {
      this.logger.error(`Chữ ký không hợp lệ!`);
      return { code: '97', message: ErrorMessages.PAYMENT.INVALID_SIGNATURE };
    }

    const txnRef = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode || query.vnp_TransactionStatus;
    const payment = await this.paymentRepository.findOne({
      where: { transactionRef: txnRef },
      relations: ['booking'],
    });

    if (payment) {
      if (responseCode === '00') {
        payment.status = PaymentStatus.COMPLETED;
        payment.responseCode = responseCode || '';
        if (query.vnp_PayDate) payment.payDate = query.vnp_PayDate;
        if (query.vnp_TransactionNo) payment.transactionId = query.vnp_TransactionNo;
        payment.metadata = query as Record<string, unknown>;
        await this.paymentRepository.save(payment);
        await this.bookingsService.confirmPaymentSuccess(payment.booking.id);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.responseCode = responseCode || '';
        payment.metadata = query as Record<string, unknown>;
        await this.paymentRepository.save(payment);
        await this.bookingsService.handlePaymentFailure(payment.booking.id);
      }
    }

    return {
      code: responseCode,
      message: responseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
    };
  }


  private sortAndSign(
    vnp_Params: VnpayParams,
    vnpUrl: string,
    secretKey: string,
  ): string {
    const sorted = this.sortObject(vnp_Params);
    const signData = querystring.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
    
    const finalParams = { ...sorted, vnp_SecureHash: signed };
    return vnpUrl + '?' + querystring.stringify(finalParams, { encode: false });
  }

  private sortObject(
    obj: Record<string, any>,
  ): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj)
      .filter((k) => k.startsWith('vnp_') && obj[k] !== undefined && obj[k] !== '')
      .sort();
    
    for (const key of keys) {
      sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }
    return sorted;
  }
}
