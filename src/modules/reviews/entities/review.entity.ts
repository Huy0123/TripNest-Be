import { Tour } from '@/modules/tours/entities/tour.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('reviews')
@Index(['tour'])
@Index(['user'])
@Index(['tour', 'createdAt'])
@Index(['rating'])
export class Review extends SoftDeleteEntity {
  @ManyToOne(() => Tour, (tour) => tour.reviews, { onDelete: 'CASCADE' })
  tour: Tour;

  @ManyToOne(() => User, (user) => user.reviews, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment?: string;
}
