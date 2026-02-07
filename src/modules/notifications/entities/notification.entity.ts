import { User } from '@/modules/users/entities/user.entity';
import { AbstractEntity } from '@/common/abstract.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  BOOKING = 'BOOKING',
  PROMOTION = 'PROMOTION',
  REMINDER = 'REMINDER',
}

@Entity('notifications')
@Index(['user'])
@Index(['isRead'])
@Index(['type'])
@Index(['createdAt'])
export class Notification extends AbstractEntity {
  @Column()
  title: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  metadata: string; // JSON string for extra data (e.g., bookingId)

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
