import { Tour } from '@/modules/tours/entities/tour.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('reviews')
@Index(['tour'])
@Index(['user'])
@Index(['tour', 'createdAt'])
@Index(['rating'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tour, (tour) => tour.reviews, { onDelete: 'CASCADE' })
  tour: Tour;

  @ManyToOne(() => User, (user) => user.reviews, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column('int')
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
