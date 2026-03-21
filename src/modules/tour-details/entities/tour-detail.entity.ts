import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';


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
export class TourDetail extends SoftDeleteEntity {
  @Index()
  @OneToOne(() => Tour, (tour) => tour.detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tourId' })
  tour: Tour;

  @Column({ nullable: true })
  tourId: string;

  @Column('simple-array', { nullable: true })
  inclusions: string[];

  @Column('simple-array', { nullable: true })
  exclusions: string[];

  @Column({ type: 'text', nullable: true })
  experience: string;

  @Column({ type: 'jsonb', nullable: true })
  itinerary: IItineraryItem[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  images: ITourImage[];
}
