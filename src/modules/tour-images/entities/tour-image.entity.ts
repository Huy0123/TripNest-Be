import { Tour } from '@/modules/tours/entities/tour.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tour_images')
export class TourImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    imageUrl: string;

    @ManyToOne(() => Tour, (tour) => tour.images, { onDelete: 'CASCADE' })
    tour: Tour;
}
