import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentsService: any;

  beforeEach(async () => {
    mockPaymentsService = {
      createPaymentUrl: jest.fn(),
      verifyReturnUrl: jest.fn(),
      verifyIpn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  describe('createPaymentUrl', () => {
    it('should return payment url', async () => {
      mockPaymentsService.createPaymentUrl.mockResolvedValue('http://vnpay.url');
      const result = await controller.createPaymentUrl({ bookingId: 'b1', amount: 100 }, '127.0.0.1');

      expect(mockPaymentsService.createPaymentUrl).toHaveBeenCalledWith('b1', 100, expect.any(String), undefined);
      expect(result).toEqual({ url: 'http://vnpay.url' });
    });
  });

  describe('vnpayReturn', () => {
    it('should call verifyReturnUrl', async () => {
      const query = { vnp_TxnRef: 'b1' };
      mockPaymentsService.verifyReturnUrl.mockResolvedValue({ message: 'Success' });

      const result = await controller.vnpayReturn(query);

      expect(mockPaymentsService.verifyReturnUrl).toHaveBeenCalledWith(query);
      expect(result.message).toBe('Success');
    });
  });

  describe('vnpayIpn', () => {
    it('should call verifyIpn', async () => {
      const query = { vnp_TxnRef: 'b1' };
      mockPaymentsService.verifyIpn.mockResolvedValue({ RspCode: '00' });

      const result = await controller.vnpayIpn(query);

      expect(mockPaymentsService.verifyIpn).toHaveBeenCalledWith(query);
      expect(result.RspCode).toBe('00');
    });
  });
});
