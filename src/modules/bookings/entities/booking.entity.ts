import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Payment } from '@/modules/payments/entities/payment.entity';
import { Promotion } from '@/modules/promotions/entities/promotion.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BookingStatus } from '@/enums/booking-status.enum';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('bookings')
@Index(['user'])
@Index(['session'])
@Index(['status'])
@Index(['user', 'status'])
@Index(['tour'])
@Index(['createdAt'])
export class Booking extends SoftDeleteEntity {
  @Column({ unique: true, type: 'varchar', length: 20 })
  bookingCode: string;

  @Column({ type: 'varchar', length: 100 })
  customerName: string;

  @Column({ type: 'varchar' })
  customerEmail: string;

  @Column({ type: 'varchar' })
  customerPhone: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Tour, (tour) => tour.bookings, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  tour: Tour;

  @ManyToOne(() => TourSession, (session) => session.bookings, {
    onDelete: 'SET NULL',
    eager: true,
    nullable: true,
  })
  session: TourSession;

  @Column({ type: 'int', default: 0, comment: 'Số người lớn (12+ tuổi)' })
  adults: number;

  @Column({ type: 'int', default: 0, comment: 'Số trẻ em (2-11 tuổi)' })
  children: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    comment: 'Giá người lớn',
  })
  adultPrice: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    comment: 'Giá trẻ em',
  })
  childrenPrice: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    comment: 'Tổng tiền sau giảm giá',
  })
  totalAmount: number;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
    comment: 'Tiền được giảm qua khuyến mãi',
  })
  discountAmount: number;

  @ManyToOne(() => Promotion, (promo) => promo.bookings, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  promotion?: Promotion;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'boolean', default: false })
  isReminderSent: boolean;

  @Column({ type: 'varchar', nullable: true })
  paymentTimeoutJobId?: string;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];
}
