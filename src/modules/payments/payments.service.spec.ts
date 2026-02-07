import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { ConfigService } from '@nestjs/config';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockTransactionRepo: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockTransactionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          VNP_TMNCODE: 'TEST_TMN',
          VNP_HASHSECRET: 'TEST_SECRET',
          VNP_URL: 'http://test.vnpay.vn',
          VNP_RETURN_URL: 'http://localhost/return',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentUrl', () => {
    it('should generate correct URL with signature', async () => {
      mockTransactionRepo.create.mockReturnValue({ id: 'txn-1' });
      mockTransactionRepo.save.mockResolvedValue({ id: 'txn-1' });

      const url = await service.createPaymentUrl('booking-1', 100000, '127.0.0.1');

      expect(url).toContain('http://test.vnpay.vn?');
      expect(url).toContain('vnp_SecureHash=');
      expect(url).toContain('vnp_Amount=10000000'); // x100
      expect(url).toContain('vnp_TmnCode=TEST_TMN');
      expect(mockTransactionRepo.save).toHaveBeenCalled();
    });
  });

  describe('verifyReturnUrl', () => {
    it('should verify valid signature', async () => {
      // Manually sign a payload
      const params = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'ref-1',
      };
      // We can use the service's internal method if exposed or just rely on its logic. 
      // Since sortAndSign returns URL, let's use a helper or manual sign.
      // Re-implement simplified sign for test:
      const crypto = require('crypto');
      const querystring = require('qs');
      
      const sorted = {};
      Object.keys(params).sort().forEach(key => sorted[key] = params[key]);
      const signData = querystring.stringify(sorted, { encode: false });
      const hmac = crypto.createHmac('sha512', 'TEST_SECRET');
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const query = { ...params, vnp_SecureHash: signed };

      mockTransactionRepo.findOne.mockResolvedValue({ id: 'txn-1', status: 'PENDING' });
      mockTransactionRepo.save.mockResolvedValue({});

      const result = await service.verifyReturnUrl(query);

      expect(result.message).toBe('Success');
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAID' }));
    });

    it('should fail invalid signature', async () => {
       const query = {
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'invalid_hash'
       };
       
       const result = await service.verifyReturnUrl(query);
       expect(result.message).toBe('Invalid Signature');
       expect(mockTransactionRepo.save).not.toHaveBeenCalled();
    });
  });
});
