import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import { BookingsService } from '../bookings/bookings.service';
import dayjs from 'dayjs';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
    private readonly bookingsService: BookingsService,
  ) {}

  async createPaymentUrl(bookingId: string, amount: number, ipAddr: string, locale = 'vn') {
    const tmnCode = this.configService.get('VNP_TMNCODE');
    const secretKey = this.configService.get('VNP_HASHSECRET');
    const vnpUrl = this.configService.get('VNP_URL');
    const returnUrl = this.configService.get('VNP_RETURN_URL');

    
    const createDate = dayjs().format('YYYYMMDDHHmmss');
    const txnRef = `${bookingId}_${dayjs().valueOf()}`;
    const transaction = this.transactionRepository.create({
      bookingId,
      amount,
      paymentMethod: 'VNPAY',
      status: 'PENDING',
      transactionCode: txnRef,
    });
    await this.transactionRepository.save(transaction);

    const vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = txnRef;
    vnp_Params['vnp_OrderInfo'] = `Thanh toan booking ${bookingId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    return this.sortAndSign(vnp_Params, vnpUrl, secretKey);
  }

  sortAndSign(vnp_Params: any, vnpUrl: string, secretKey: string) {
    vnp_Params = this.sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    
    return vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });
  }

  sortObject(obj: any) {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async verifyReturnUrl(query: any) {
    const secureHash = query['vnp_SecureHash'];
    const secretKey = this.configService.get('VNP_HASHSECRET');

    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedParams = this.sortObject(query);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const txnRef = query['vnp_TxnRef'];
      const responseCode = query['vnp_ResponseCode'];
      const transaction = await this.transactionRepository.findOne({ where: { transactionCode: txnRef } });
      if (transaction) {
         if (responseCode === '00') {
             transaction.status = 'PAID';
             transaction.responseCode = responseCode;
             transaction.payDate = query['vnp_PayDate'];
             await this.bookingsService.confirmPaymentSuccess(transaction.bookingId);
         } else {
             transaction.status = 'FAILED';
             transaction.responseCode = responseCode;
             await this.bookingsService.handlePaymentFailure(transaction.bookingId);
         }
         await this.transactionRepository.save(transaction);
      }
      return { code: responseCode, message: responseCode === '00' ? 'Success' : 'Fail' };
    } else {
      return { code: '97', message: 'Invalid Signature' };
    }
  }
  
  async verifyIpn(query: any) {
    const secureHash = query['vnp_SecureHash'];
    const secretKey = this.configService.get('VNP_HASHSECRET');
    const orderId = query['vnp_TxnRef'];
    const rspCode = query['vnp_ResponseCode'];

    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    const sortedParams = this.sortObject(query);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    if (secureHash === signed) {
        const transaction = await this.transactionRepository.findOne({ where: { transactionCode: orderId } });
        if (!transaction) {
            return { RspCode: '01', Message: 'Order not found' };
        }
        
        const amount = Number(query['vnp_Amount']) / 100;
        if (amount !== transaction.amount) {
             return { RspCode: '04', Message: 'Invalid amount' };
        }

        if (transaction.status === 'PAID') {
             return { RspCode: '02', Message: 'Order already confirmed' };
        }
        
        if (rspCode === '00') {
             transaction.status = 'PAID';
             transaction.responseCode = rspCode;
             transaction.payDate = query['vnp_PayDate'];
             await this.bookingsService.confirmPaymentSuccess(transaction.bookingId);
             return { RspCode: '00', Message: 'Confirm Success' };
        } else {
             transaction.status = 'FAILED';
             transaction.responseCode = rspCode;
             await this.transactionRepository.save(transaction);
             await this.bookingsService.handlePaymentFailure(transaction.bookingId);
             return { RspCode: '00', Message: 'Confirm Success' };
        }
    } else {
        return { RspCode: '97', Message: 'Invalid Checksum' };
    }
  }
}
