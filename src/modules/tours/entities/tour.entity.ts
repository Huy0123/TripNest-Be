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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '@/modules/location/entities/location.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { StayOption } from '@/enums/stay.enum';

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
  image: string;

  @Index()
  @Column({ default: 0 })
  price: number;

  @Index()
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isPopular: boolean;

  @Column({type: 'enum', enum: StayOption})
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

  @OneToOne(() => TourDetail, (detail) => detail.tourId, { cascade: true })
  detail: TourDetail;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
