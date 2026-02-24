import { UserRole } from '@/enums/user-role.enum';
import { AuthProvider } from '@/enums/auth.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
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

  @Column({ type: 'enum', enum: UserRole})
  role: UserRole;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'simple-array'})
  providers: string[];

  @Column({ nullable: true })
  googleId: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  phone?: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
