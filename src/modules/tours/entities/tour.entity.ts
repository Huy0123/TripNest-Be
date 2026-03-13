import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '@/modules/location/entities/location.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { StayOption } from '@/enums/stay.enum';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { Review } from '@/modules/reviews/entities/review.entity';

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({unique: true})
  name: string;

  @Index()
  @Column('int')
  duration: number;

  @Column('simple-array', {nullable: true})
  guideService: string[];

  @Column({nullable: true})
  image: string;

  @Column({nullable: true})
  imagePublicId: string;

  @Column({nullable: true, default: 'image'})
  imageType: string;

  @Index()
  @Column({ default: 0 })
  price: number;

  @Index()
  @Column({ type: 'int', default: 0 })
  discount: number;

  @Index()
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Index()
  @Column({type: 'enum', enum: StayOption, nullable: true})
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

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
