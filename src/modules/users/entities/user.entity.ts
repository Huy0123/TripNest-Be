import { UserRole } from '@/enums/user-role.enum';
import { AuthProvider } from '@/enums/auth.enum';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  birthDate?: Date;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  avatarPublicId?: string;

  @Column({ nullable: true })
  hashedRefreshToken?: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
