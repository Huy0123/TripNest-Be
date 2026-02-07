import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string; // e.g., VNPAY

  @Column()
  status: string; // PENDING, SUCCESS, FAILED

  @Column({ nullable: true })
  transactionCode: string; // vnp_TxnRef

  @Column({ nullable: true })
  responseCode: string; // vnp_ResponseCode

  @Column({ nullable: true })
  payDate: string; // vnp_PayDate

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
