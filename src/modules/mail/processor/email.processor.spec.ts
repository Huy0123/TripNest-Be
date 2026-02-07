import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { MailService } from '@/modules/mail/mail.service';
import { Job } from 'bullmq';
import { NAME_QUEUE } from 'src/enums/name-queue.enum';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mockMailService: any;

  beforeEach(async () => {
    mockMailService = {
      verifyAccount: jest.fn(),
      sendForgotPasswordEmail: jest.fn(),
      sendNewPasswordEmail: jest.fn(),
      sendPaymentSuccessEmail: jest.fn(),
      sendPaymentFailedEmail: jest.fn(),
      sendTripReminderEmail: jest.fn(),
      sendBookingCancelledEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  describe('handleVerificationAccount', () => {
    it('should send verification email successfully', async () => {
      const mockJob = {
        id: '1',
        name: NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
        data: {
          email: 'test@example.com',
          otp: '123456',
          firstName: 'John',
          lastName: 'Doe',
        },
      } as Job;

      mockMailService.verifyAccount.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.verifyAccount).toHaveBeenCalledWith(
        'test@example.com',
        { otp: '123456', firstName: 'John', lastName: 'Doe' },
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('test@example.com');
    });

    it('should handle verification email failure', async () => {
      const mockJob = {
        id: '1',
        name: NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
        data: {
          email: 'test@example.com',
          otp: '123456',
          firstName: 'John',
          lastName: 'Doe',
        },
      } as Job;

      mockMailService.verifyAccount.mockRejectedValue(
        new Error('Email service error'),
      );

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service error');
    });
  });

  describe('handleForgotPasswordEmail', () => {
    it('should send forgot password email successfully', async () => {
      const mockJob = {
        id: '2',
        name: NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
        data: {
          email: 'test@example.com',
          otp: '654321',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      } as Job;

      mockMailService.sendForgotPasswordEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendForgotPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        { otp: '654321', firstName: 'Jane', lastName: 'Smith' },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handlePasswordReset', () => {
    it('should send new password email successfully', async () => {
      const mockJob = {
        id: '3',
        name: NAME_QUEUE.SEND_NEW_PASSWORD,
        data: {
          email: 'test@example.com',
          newPassword: 'NewP@ss123',
          firstName: 'John',
          lastName: 'Doe',
        },
      } as Job;

      mockMailService.sendNewPasswordEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendNewPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        { newPassword: 'NewP@ss123', firstName: 'John', lastName: 'Doe' },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handlePaymentSuccessEmail', () => {
    it('should send payment success email successfully', async () => {
      const mockJob = {
        id: '4',
        name: NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_SUCCESS,
        data: {
          email: 'test@example.com',
          bookingCode: 'BK123',
          tourName: 'Amazing Tour',
          amount: 1000,
          paymentDate: '2026-01-15',
        },
      } as Job;

      mockMailService.sendPaymentSuccessEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendPaymentSuccessEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          bookingCode: 'BK123',
          tourName: 'Amazing Tour',
          amount: 1000,
          paymentDate: '2026-01-15',
        },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handlePaymentFailedEmail', () => {
    it('should send payment failed email successfully', async () => {
      const mockJob = {
        id: '5',
        name: NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_FAILED,
        data: {
          email: 'test@example.com',
          bookingCode: 'BK124',
          tourName: 'Another Tour',
          reason: 'Insufficient funds',
        },
      } as Job;

      mockMailService.sendPaymentFailedEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          bookingCode: 'BK124',
          tourName: 'Another Tour',
          reason: 'Insufficient funds',
        },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('handleTripReminder', () => {
    it('should send trip reminder email successfully', async () => {
      const mockJob = {
        id: '6',
        name: NAME_QUEUE.SEND_MAIL_NOTI_TRIP_REMINDER,
        data: {
          email: 'test@example.com',
          bookingCode: 'BK125',
          tourName: 'Beach Tour',
          departureDate: '2026-02-01',
          daysUntilTrip: 7,
        },
      } as Job;

      mockMailService.sendTripReminderEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendTripReminderEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          bookingCode: 'BK125',
          tourName: 'Beach Tour',
          departureDate: '2026-02-01',
          daysUntilTrip: 7,
        },
      );
      expect(result.success).toBe(true);
      expect(result.type).toBe('trip-reminder');
    });
  });

  describe('handleBookingCancelledEmail', () => {
    it('should send booking cancelled email successfully', async () => {
      const mockJob = {
        id: '7',
        name: NAME_QUEUE.SEND_MAIL_NOTI_BOOKING_CANCELLED,
        data: {
          email: 'test@example.com',
          bookingCode: 'BK126',
          tourName: 'Mountain Tour',
          cancellationReason: 'Customer request',
        },
      } as Job;

      mockMailService.sendBookingCancelledEmail.mockResolvedValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockMailService.sendBookingCancelledEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          bookingCode: 'BK126',
          tourName: 'Mountain Tour',
          cancellationReason: 'Customer request',
        },
      );
      expect(result.success).toBe(true);
    });
  });

  describe('process', () => {
    it('should handle unknown job type', async () => {
      const mockJob = {
        id: '8',
        name: 'UNKNOWN_JOB_TYPE',
        data: {},
      } as Job;

      const result = await processor.process(mockJob);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No handler for job type');
    });

    it('should throw error on job processing failure', async () => {
      const mockJob = {
        id: '9',
        name: NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
        data: {
          email: 'test@example.com',
          otp: '123456',
          firstName: 'John',
          lastName: 'Doe',
        },
      } as Job;

      mockMailService.verifyAccount.mockRejectedValue(
        new Error('Critical error'),
      );

      await expect(processor.process(mockJob)).rejects.toThrow();
    });
  });

  describe('isCriticalEmail', () => {
    it('should identify critical email types', () => {
      const criticalTypes = [
        NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
        NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
        NAME_QUEUE.SEND_NEW_PASSWORD,
        NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_SUCCESS,
      ];

      criticalTypes.forEach((type) => {
        expect(processor['isCriticalEmail'](type)).toBe(true);
      });
    });

    it('should identify non-critical email types', () => {
      const nonCriticalTypes = [
        NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_FAILED,
        NAME_QUEUE.SEND_MAIL_NOTI_TRIP_REMINDER,
        NAME_QUEUE.SEND_MAIL_NOTI_BOOKING_CANCELLED,
      ];

      nonCriticalTypes.forEach((type) => {
        expect(processor['isCriticalEmail'](type)).toBe(false);
      });
    });
  });
});
