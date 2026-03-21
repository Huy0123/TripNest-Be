import { Column, Entity, OneToMany, ManyToMany } from 'typeorm';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('locations')
export class Location extends SoftDeleteEntity {
  @Column({ unique: true })
  city: string;

  @Column()
  country: string;

  @OneToMany(() => Tour, (tour) => tour.departureLocation)
  departureTours: Tour[];

  @ManyToMany(() => Tour, (tour) => tour.destinations)
  destinationTours: Tour[];
}
