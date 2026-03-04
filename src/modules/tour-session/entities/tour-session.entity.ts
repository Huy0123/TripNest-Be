import { DepartureStatus } from '@/enums/departure-status.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity('tour_sessions')
@Index(['tour', 'startDate'], { unique: true })
export class TourSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'int' })
  capacity: number; // Số lượng khách tối đa

  @Column({ type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'numeric', precision: 10 })
  adultPrice: number;

  @Column({ type: 'numeric', precision: 10, default: 0 })
  childrenPrice: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: DepartureStatus,
    default: DepartureStatus.OPEN,
  })
  status: DepartureStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Booking, (booking) => booking.session)
  bookings: Booking[];

  @ManyToOne(() => Tour, (tour) => tour.sessions, { onDelete: 'CASCADE' })
  tour: Tour;
}
