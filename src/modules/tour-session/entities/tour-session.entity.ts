import { DepartureStatus } from '@/enums/departure-status.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity('tour_sessions')
@Index(['tour', 'startDate'], { unique: true })
export class TourSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tour, (tour) => tour.sessions, { onDelete: 'CASCADE' })
  tour: Tour;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'int' })
  capacity: number; // Số lượng khách tối đa

  @Column({ type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'numeric', precision: 10 })
  price: number;

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
}
