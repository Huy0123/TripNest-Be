import { Booking } from '@/modules/bookings/entities/booking.entity';
import { BaseEntity } from '@/common/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PaymentStatus } from '@/enums/payment-status.enum';
import { PaymentProvider } from '@/enums/payment-provider.enum';

@Entity('payments')
@Index(['status'])
@Index(['provider'])
@Index(['createdAt'])
@Index(['booking'])
@Index(['transactionRef'])
export class Payment extends BaseEntity {
  @ManyToOne(() => Booking, (booking) => booking.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  booking: Booking;

  /**
   * VNPay vnp_TxnRef — used to link the return/IPN callback back to this payment.
   * Format: {bookingId}_{timestamp}
   */
  @Column({ unique: true, nullable: true })
  transactionRef: string;

  /**
   * VNPay vnp_TransactionNo — returned by VNPay on successful payment.
   */
  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'VND', length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.VNPAY,
  })
  provider: PaymentProvider;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  /** VNPay vnp_ResponseCode */
  @Column({ nullable: true })
  responseCode: string;

  /** VNPay vnp_PayDate */
  @Column({ nullable: true })
  payDate: string;

  /** Human-readable message from gateway */
  @Column({ type: 'text', nullable: true })
  gatewayMessage: string;

  /** Full raw callback payload for debugging */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;
}
