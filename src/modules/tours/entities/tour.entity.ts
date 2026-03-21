import {
  Column,
  Entity,
  Index,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Location } from '@/modules/location/entities/location.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { StayOption } from '@/enums/stay.enum';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('tours')
export class Tour extends SoftDeleteEntity {
  @Index()
  @Column({ unique: true })
  name: string;

  @Index()
  @Column('int')
  duration: number;

  @Column('simple-array', { nullable: true })
  guideService: string[];

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  imagePublicId: string;

  @Column({ nullable: true, default: 'image' })
  imageType: string;

  @Index()
  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  price: number;

  @Index()
  @Column({ type: 'int', default: 0 })
  discount: number;

  @Index()
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Index()
  @Column({ type: 'enum', enum: StayOption, nullable: true })
  stayOption: StayOption;

  @ManyToOne(() => Location, (location) => location.departureTours)
  departureLocation: Location;

  @ManyToMany(() => Location, (location) => location.destinationTours)
  @JoinTable({
    name: 'tour_destinations',
    joinColumn: { name: 'tourId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'locationId', referencedColumnName: 'id' },
  })
  destinations: Location[];

  @OneToOne(() => TourDetail, (detail) => detail.tour, { cascade: true })
  detail: TourDetail;

  @OneToMany(() => TourSession, (session) => session.tour)
  sessions: TourSession[];

  @OneToMany(() => Review, (review) => review.tour)
  reviews: Review[];

  @OneToMany(() => Booking, (booking) => booking.tour)
  bookings: Booking[];
}
