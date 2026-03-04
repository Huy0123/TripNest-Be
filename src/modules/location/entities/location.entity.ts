import { Tour } from '@/modules/tours/entities/tour.entity';
import { Column, Entity, OneToMany, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({unique: true})
  city: string;

  @Column()
  country: string;

  @OneToMany(() => Tour, (tour) => tour.departureLocation)
  departureTours: Tour[];

  @ManyToMany(() => Tour, (tour) => tour.destinations)
  destinationTours: Tour[];
}
