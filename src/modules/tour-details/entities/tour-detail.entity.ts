import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  Index,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Tour } from '@/modules/tours/entities/tour.entity';
export interface IMoreInfo {
  title: string;
  subtitle?: string;
  items: string[];
}

export interface IItineraryItem {
  day: string;
  title: string;
  description?: string;
}

export interface ITourImage {
  url: string;
  publicId: string;
  type?: 'image' | 'video';
}

@Entity('tour_details')
export class TourDetail {
  @PrimaryColumn()
  id: string;

  @Index()
  @OneToOne(() => Tour, (tour) => tour.detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  tour: Tour;

  @Column({ type: 'jsonb', nullable: true })
  moreInfo: IMoreInfo[];

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column({ type: 'jsonb', nullable: true })
  itinerary: IItineraryItem[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  images: ITourImage[];
}
