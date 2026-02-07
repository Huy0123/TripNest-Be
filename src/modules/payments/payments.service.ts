import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import * as crypto from 'crypto';
import * as querystring from 'qs';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentUrl(bookingId: string, amount: number, ipAddr: string, locale = 'vn') {
    const tmnCode = this.configService.get('VNP_TMNCODE');
    const secretKey = this.configService.get('VNP_HASHSECRET');
    const vnpUrl = this.configService.get('VNP_URL');
    const returnUrl = this.configService.get('VNP_RETURN_URL');

    const date = new Date();
    // Format YYYYMMDDHHmmss
    const createDate = date.toISOString().slice(0, 19).replace(/[-T:]/g, ''); 
    // Note: ISOString is UTC. VNPay might expect local time (GMT+7). 
    // To be safe and simple without moment-timezone:
    // We can use a simple offset add.
    const dateVn = new Date(date.getTime() + 7 * 60 * 60 * 1000); 
    const createDateVn = dateVn.toISOString().slice(0, 19).replace(/[-T:]/g, '');


    // Generate Transaction Reference
    const txnRef = `${bookingId}_${date.getTime()}`;

    // Create Transaction Record
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
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay uses cents (x100)
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDateVn;

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

  // Helper to sort params alphabetically
  sortObject(obj: any) {
    const sorted = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (const s of str) {
        // We need to find the original key that matches this encoded key?
        // Actually usually we sort keys. 
        // VNPay standard: sort keys. 
        // The previous code had `sorted[str[key]]` which was confusing indices.
        // Let's iterate sorted keys.
        // But `str` contains encoded keys. 
        // Simpler implementation:
        // Object.keys(obj).sort()...
    }
    
    // Correct logic:
    const sortedKeys = Object.keys(obj).sort();
    for (const key of sortedKeys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
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
      // Update transaction status
      // We might want to find transaction by txnRef
      const transaction = await this.transactionRepository.findOne({ where: { transactionCode: txnRef } });
      if (transaction) {
         if (responseCode === '00') {
             transaction.status = 'PAID';
             transaction.responseCode = responseCode;
             transaction.payDate = query['vnp_PayDate'];
             // TODO: Update Booking Status via BookingsService or Event
         } else {
             transaction.status = 'FAILED';
             transaction.responseCode = responseCode;
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
        
        // check amount
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
             await this.transactionRepository.save(transaction);
              // TODO: Trigger Booking Success Event
             return { RspCode: '00', Message: 'Confirm Success' };
        } else {
             transaction.status = 'FAILED';
             transaction.responseCode = rspCode;
             await this.transactionRepository.save(transaction);
             return { RspCode: '00', Message: 'Confirm Success' }; // IPN expects 00 for handling ack even if payment failed
        }
    } else {
        return { RspCode: '97', Message: 'Invalid Checksum' };
    }
  }
}
