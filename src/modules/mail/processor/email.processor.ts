import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NAME_REGISTER } from 'src/enums/name-register.enum';
import { NAME_QUEUE } from 'src/enums/name-queue.enum';
import { MailService } from '@/modules/mail/mail.service';
@Processor(`${NAME_REGISTER.OTP}`)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed - Attempt ${job.attemptsMade}/${job.opts?.attempts || 1} - Error: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.debug(
      `Job ${job.id} completed - Result: ${JSON.stringify(result)}`,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      let result: any;

      switch (job.name) {
        case NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT:
          this.logger.log(`Handling SEND_OTP_VERIFY_ACCOUNT for ${job.id}`);
          result = await this.handleVerificationAccount(job);
          break;

        case NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD:
          this.logger.log(`Handling SEND_OTP_FORGOT_PASSWORD for ${job.id}`);
          result = await this.handleForgotPasswordEmail(job);
          break;

        case NAME_QUEUE.SEND_NEW_PASSWORD:
          this.logger.log(`Handling SEND_NEW_PASSWORD for ${job.id}`);
          result = await this.handlePasswordReset(job);
          break;

        case NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_SUCCESS:
          this.logger.log(
            `Handling SEND_MAIL_NOTI_PAYMENT_SUCCESS for ${job.id}`,
          );
          result = await this.handlePaymentSuccessEmail(job);
          break;

        case NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_FAILED:
          this.logger.log(
            `Handling SEND_MAIL_NOTI_PAYMENT_FAILED for ${job.id}`,
          );
          result = await this.handlePaymentFailedEmail(job);
          break;

        case NAME_QUEUE.SEND_MAIL_NOTI_TRIP_REMINDER:
          this.logger.log(
            `Handling SEND_MAIL_NOTI_TRIP_REMINDER for ${job.id}`,
          );
          result = await this.handleTripReminder(job);
          break;

        case NAME_QUEUE.SEND_MAIL_NOTI_BOOKING_CANCELLED:
          this.logger.log(
            `Handling SEND_MAIL_NOTI_BOOKING_CANCELLED for ${job.id}`,
          );
          result = await this.handleBookingCancelledEmail(job);
          break;
        default:
          this.logger.warn(`No handler for job type: ${job.name}`);
          result = {
            success: false,
            message: `No handler for job type: ${job.name}`,
          };
      }

      this.logger.log(
        `Job ${job.id} of type ${job.name} processed successfully`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} processing failed`, error.stack);
      throw error;
    }
  }

  private async handleVerificationAccount(job: Job): Promise<any> {
    const { email, otp, firstName, lastName } = job.data;
    this.logger.debug(`Sending verification email to ${email} with OTP ${otp}`);
    try {
      await this.mailService.verifyAccount(email, { otp, firstName, lastName });
      this.logger.log(`Verification email sent successfully to ${email}`);
      return { success: true, message: `Verification email sent to ${email}` };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send verification email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handleForgotPasswordEmail(job: Job): Promise<any> {
    const { email, otp, firstName, lastName } = job.data;
    this.logger.debug(
      `Sending forgot password email to ${email} with OTP ${otp}`,
    );

    try {
      await this.mailService.sendForgotPasswordEmail(email, {
        otp,
        firstName,
        lastName,
      });
      this.logger.log(`Forgot password email sent successfully to ${email}`);
      return {
        success: true,
        message: `Forgot password email sent to ${email}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send forgot password email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send forgot password email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handlePasswordReset(job: Job): Promise<any> {
    const { email, newPassword, firstName, lastName } = job.data;
    this.logger.debug(`Sending new password email to ${email}`);

    try {
      await this.mailService.sendNewPasswordEmail(email, {
        newPassword,
        firstName,
        lastName,
      });
      this.logger.log(`New password email sent successfully to ${email}`);
      return { success: true, message: `New password email sent to ${email}` };
    } catch (error) {
      this.logger.error(
        `Failed to send new password email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send new password email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handlePaymentSuccessEmail(job: Job): Promise<any> {
    const { email, bookingCode, tourName, amount, paymentDate, customerName } = job.data;
    this.logger.debug(
      `Sending payment success email to ${email} for booking ${bookingCode}`,
    );

    try {
      await this.mailService.sendPaymentSuccessEmail(email, {
        bookingCode,
        tourName,
        amount,
        paymentDate,
        customerName,
      });
      this.logger.log(`Payment success email sent successfully to ${email}`);
      return {
        success: true,
        message: `Payment success email sent to ${email}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send payment success email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send payment success email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handlePaymentFailedEmail(job: Job): Promise<any> {
    const { email, bookingCode, tourName, reason } = job.data;
    this.logger.debug(
      `Sending payment failed email to ${email} for booking ${bookingCode}`,
    );

    try {
      await this.mailService.sendPaymentFailedEmail(email, {
        bookingCode,
        tourName,
        reason,
      });
      this.logger.log(`Payment failed email sent successfully to ${email}`);
      return {
        success: true,
        message: `Payment failed email sent to ${email}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send payment failed email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send payment failed email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handleBookingCancelledEmail(job: Job): Promise<any> {
    const { email, bookingCode, tourName, cancellationReason } = job.data;
    this.logger.debug(
      `Sending booking cancelled email to ${email} for booking ${bookingCode}`,
    );

    try {
      await this.mailService.sendBookingCancelledEmail(email, {
        bookingCode,
        tourName,
        cancellationReason,
      });
      this.logger.log(`Booking cancelled email sent successfully to ${email}`);
      return {
        success: true,
        message: `Booking cancelled email sent to ${email}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send booking cancelled email to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send booking cancelled email to ${email}`,
        error: error.message,
      };
    }
  }

  private async handleTripReminder(job: Job): Promise<any> {
    const { email, bookingCode, tourName, departureDate, daysUntilTrip, customerName } =
      job.data;
    this.logger.debug(
      `Sending trip reminder to ${email} for booking ${bookingCode}`,
    );

    try {
      await this.mailService.sendTripReminderEmail(email, {
        bookingCode,
        tourName,
        departureDate,
        daysUntilTrip,
        customerName,
      });

      this.logger.log(
        `✅ Trip reminder sent to ${email} for booking #${bookingCode}`,
      );
      return {
        success: true,
        type: 'trip-reminder',
        email,
        bookingCode,
        daysUntilTrip,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to send trip reminder to ${email}`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send trip reminder to ${email}`,
        error: error.message,
      };
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(
      `🚀 Job ${job.id} (${job.name}) started processing for ${job.data.email || job.data.to}`,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    this.logger.warn(
      `⚠️ Job ${job.id} (${job.name}) stalled - will be retried`,
    );
  }

  /**
   * ⚠️ Kiểm tra email quan trọng
   */
  private isCriticalEmail(jobName: string): boolean {
    const criticalTypes: string[] = [
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      NAME_QUEUE.SEND_NEW_PASSWORD,
      NAME_QUEUE.SEND_MAIL_NOTI_PAYMENT_SUCCESS,
    ];
    return criticalTypes.includes(jobName);
  }

  /**
   * 🧹 Cleanup resources when worker shuts down
   */
  onModuleDestroy() {
    this.logger.log('📤 Email processor shutting down gracefully...');
  }
}
