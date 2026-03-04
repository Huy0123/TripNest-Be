import { Injectable, Logger } from '@nestjs/common';
import { VerifyAccountInterface } from './interfaces/verify-account.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async verifyAccount(
    to: string,
    verifyAccount: VerifyAccountInterface,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending verification email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const supportPhone =
      this.configService.get<string>('SUPPORT_PHONE') || 'N/A';
    const companyAddress =
      this.configService.get<string>('COMPANY_ADDRESS') || 'N/A';
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL') || '#';
    const instagramUrl = this.configService.get<string>('INSTAGRAM_URL') || '#';
    const websiteUrl = this.configService.get<string>('WEBSITE_URL') || '#';
    const currentYear = dayjs().year();
    const expireTime = this.configService.get<number>('OTP_EXPIRE_TIME') || 10;
    const context = {
      ...verifyAccount,
      title: 'Xác thực tài khoản',
      description: `Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất quá trình đăng ký.`,
      otp: verifyAccount.otp,
      appName,
      supportEmail,
      supportPhone,
      companyAddress,
      facebookUrl,
      instagramUrl,
      websiteUrl,
      currentYear,
      expireTime,
    };
    try {
      await this.mailerService.sendMail({
        to,
        subject: `[${appName}] Xác thực tài khoản của bạn`,
        template: 'otp-email',
        context,
      });
      this.logger.log(`Verification email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendForgotPasswordEmail(
    to: string,
    data: { otp: string; firstName: string; lastName: string },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending forgot password email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'TripNest';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@tripnest.com';
    const currentYear = dayjs().year();
    const expireTime = this.configService.get<number>('OTP_EXPIRE_TIME') || 10;
    const supportPhone =
      this.configService.get<string>('SUPPORT_PHONE') || 'N/A';
    const companyAddress =
      this.configService.get<string>('COMPANY_ADDRESS') || 'N/A';
    const facebookUrl = this.configService.get<string>('FACEBOOK_URL') || '#';
    const instagramUrl = this.configService.get<string>('INSTAGRAM_URL') || '#';
    const websiteUrl = this.configService.get<string>('WEBSITE_URL') || '#';

    const context = {
      ...data,
      title: 'Quên mật khẩu',
      description: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại ${appName}. Vui lòng sử dụng mã xác thực (OTP) dưới đây:`,
      otp: data.otp,
      appName,
      supportEmail,
      currentYear,
      expireTime, 
      supportPhone,
      companyAddress,
      facebookUrl,
      instagramUrl,
      websiteUrl,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: `[${appName}] Đặt lại mật khẩu của bạn`,
        template: 'otp-email',
        context,
      });
      this.logger.log(`Forgot password email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send forgot password email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendNewPasswordEmail(
    to: string,
    data: { newPassword: string; firstName: string; lastName: string },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending new password email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const currentYear = dayjs().year();

    const context = {
      ...data,
      appName,
      supportEmail,
      currentYear,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Your new password',
        template: 'new-password',
        context,
      });
      this.logger.log(`New password email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send new password email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendPaymentSuccessEmail(
    to: string,
    data: {
      bookingCode: string;
      tourName: string;
      amount: number;
      paymentDate: string;
      customerName: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending payment success email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const currentYear = dayjs().year();

    const context = {
      ...data,
      appName,
      supportEmail,
      currentYear,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: `Payment Successful - Booking #${data.bookingCode}`,
        template: 'payment-success',
        context,
      });
      this.logger.log(`Payment success email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send payment success email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendPaymentFailedEmail(
    to: string,
    data: { bookingCode: string; tourName: string; reason: string },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending payment failed email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const currentYear = dayjs().year();

    const context = {
      ...data,
      appName,
      supportEmail,
      currentYear,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: `Payment Failed - Booking #${data.bookingCode}`,
        template: 'payment-failed',
        context,
      });
      this.logger.log(`Payment failed email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send payment failed email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendTripReminderEmail(
    to: string,
    data: {
      bookingCode: string;
      tourName: string;
      departureDate: string;
      daysUntilTrip: number;
      customerName: string;
      departureTime?: string;
      meetingPoint?: string;
      duration?: number;
      nights?: number;
      totalGuests?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending trip reminder email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const currentYear = dayjs().year();

    const context = {
      ...data,
      appName,
      supportEmail,
      currentYear,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: `Your trip is coming up soon! - ${data.tourName}`,
        template: 'trip-reminder',
        context,
      });
      this.logger.log(`Trip reminder email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send trip reminder email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendBookingCancelledEmail(
    to: string,
    data: {
      bookingCode: string;
      tourName: string;
      cancellationReason: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Sending booking cancelled email to ${to}`);
    const appName = this.configService.get<string>('APP_NAME') || 'OurApp';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@ourapp.com';
    const currentYear = dayjs().year();

    const context = {
      ...data,
      appName,
      supportEmail,
      currentYear,
    };

    try {
      await this.mailerService.sendMail({
        to,
        subject: `Booking Cancelled - #${data.bookingCode}`,
        template: 'booking-cancelled',
        context,
      });
      this.logger.log(`Booking cancelled email sent successfully to ${to}`);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancelled email to ${to}`,
        error.stack,
      );
      throw error;
    }
  }
}
