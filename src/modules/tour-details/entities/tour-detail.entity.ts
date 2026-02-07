import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tour } from '@/modules/tours/entities/tour.entity';
@Entity('tour_details')
export class TourDetail {
  @PrimaryGeneratedColumn('uuid')
  tourId: string;

  @OneToOne(() => Tour, (tour) => tour.detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column()
  description: string;

  @Column()
  itinerary: string;

  @Column()
  inclusions: string;
}
