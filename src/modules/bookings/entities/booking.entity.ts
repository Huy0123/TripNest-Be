import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Payment } from '@/modules/payments/entities/payment.entity';
import { Promotion } from '@/modules/promotions/entities/promotion.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { BookingStatus } from '@/enums/booking-status.enum';

@Entity('bookings')
@Index(['user'])
@Index(['session'])
@Index(['status'])
@Index(['user', 'status'])
@Index(['createdAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 20 })
  bookingCode: string;

  @BeforeInsert()
  generateBookingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingCode = `TN-${result}`;
  }

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => TourSession, (session) => session.bookings, {
    onDelete: 'SET NULL',
    eager: true,
  })
  session: TourSession;

  @Column({ type: 'int', default: 0, comment: 'Số người lớn (12+ tuổi)' })
  adults: number;

  @Column({ type: 'int', default: 0, comment: 'Số trẻ em (2-11 tuổi)' })
  children: number;

  // Giá booking
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Giá người lớn',
  })
  adultPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: 'Giá trẻ em' })
  childrenPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: 'Tổng tiền' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: 'Tiền được giảm qua Khuyến mãi' })
  discountAmount: number;

  @ManyToOne(() => Promotion, (promo) => promo.bookings, { nullable: true, onDelete: 'SET NULL' })
  promotion?: Promotion;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'boolean', default: false })
  isReminderSent: boolean;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
