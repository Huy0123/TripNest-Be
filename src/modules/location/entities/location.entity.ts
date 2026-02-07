import { Tour } from '@/modules/tours/entities/tour.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @OneToMany(() => Tour, (tour) => tour.location)
  tours: Tour[];
}
