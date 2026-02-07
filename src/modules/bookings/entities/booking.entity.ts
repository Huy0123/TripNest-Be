import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Payment } from '@/modules/payments/entities/payment.entity';
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

  @Column({ unique: true })
  @Generated('uuid')
  bookingCode: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => TourSession, (session) => session.bookings, {
    onDelete: 'CASCADE',
    eager: true,
  })
  session: TourSession;

  @Column({ type: 'int', default: 0, comment: 'Số người lớn (12+ tuổi)' })
  adults: number;

  @Column({ type: 'int', default: 0, comment: 'Số trẻ em (2-11 tuổi)' })
  children: number;

  @Column({ type: 'int', default: 0, comment: 'Số em bé (dưới 2 tuổi)' })
  infants: number;

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

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: 'Giá em bé' })
  infantPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: 'Tổng tiền' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
