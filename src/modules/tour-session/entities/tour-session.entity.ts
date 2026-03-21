import { DepartureStatus } from '@/enums/departure-status.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('tour_sessions')
@Index(['tour', 'startDate'], { unique: true })
export class TourSession extends SoftDeleteEntity {
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  adultPrice: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  childrenPrice: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: DepartureStatus,
    default: DepartureStatus.OPEN,
  })
  status: DepartureStatus;

  @OneToMany(() => Booking, (booking) => booking.session)
  bookings: Booking[];

  @ManyToOne(() => Tour, (tour) => tour.sessions, { onDelete: 'CASCADE' })
  @JoinColumn()
  tour: Tour;
}
