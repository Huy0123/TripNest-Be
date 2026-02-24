import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
@Entity('tour_details')
export class TourDetail {
  @PrimaryGeneratedColumn('uuid')
  tourId: string;

  @OneToOne(() => Tour, (tour) => tour.detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour: Tour;

  @Column('simple-array', { nullable: true })
  moreInfo: string[];

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column('simple-array', { nullable: true })
  itinerary: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'text', nullable: true })
  introduce: string;

  @OneToMany(() => TourSession, (session) => session.tourDetail)
  sessions: TourSession[];

  @OneToMany(() => Review, (review) => review.tourDetail)
  reviews: Review[];
}
