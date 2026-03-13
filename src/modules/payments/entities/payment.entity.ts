import { Booking } from '@/modules/bookings/entities/booking.entity';
import { AbstractEntity } from '@/common/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentProvider {
  VNPAY = 'VNPAY',
}

@Entity('payments')
@Index(['status'])
@Index(['provider'])
@Index(['createdAt'])
@Index(['booking'])
export class Payment extends AbstractEntity {
  @Column({ unique: true, nullable: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.VNPAY,
  })
  provider: PaymentProvider;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ManyToOne(() => Booking, (booking) => booking.payments)
  @JoinColumn()
  booking: Booking;
}
