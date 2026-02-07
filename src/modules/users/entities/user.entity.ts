import { UserRole } from '@/enums/user-role.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { UserProfile } from '@/modules/user_profiles/entities/user_profile.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['isActive'])
@Index(['googleId'])
@Index(['lastLoginAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'simple-array', default: 'local' })
  providers: string[];

  @Column({ nullable: true })
  googleId: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
