import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '@/modules/location/entities/location.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { TourImage } from '@/modules/tour-images/entities/tour-image.entity';

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int')
  duration: number;

  @Column()
  guideService: string;

  @Column()
  type: string; // Family, Adult Only, ...

  @Column()
  image: string;

  @Index()
  @Column({ default: 0 })
  price: number;

  @Column({ default: 0 })
  discount: number;

  @Index()
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @ManyToOne(() => Location, (location) => location.tours)
  location: Location;

  @OneToOne(() => TourDetail, (detail) => detail.tourId, { cascade: true })
  detail: TourDetail;

  @OneToMany(() => Review, (review) => review.tour, { cascade: true })
  reviews: Review[];

  @OneToMany(() => TourSession, (session) => session.tour)
  sessions: TourSession;

  @OneToMany(() => TourImage, (image) => image.tour, { cascade: true })
  images: TourImage[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
