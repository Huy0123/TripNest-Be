import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { DiscountType } from '@/enums/discount-type.enum';
import { SoftDeleteEntity } from '@/common/soft-delete.entity';

@Entity('promotions')
export class Promotion extends SoftDeleteEntity {
  @Index()
  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'int', comment: 'Phần trăm hoặc số tiền VNĐ' })
  discountValue: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Đơn hàng tối thiểu để áp dụng',
  })
  minOrderValue: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Giảm tối đa',
  })
  maxDiscount?: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Số lượt sử dụng tối đa (0 = không giới hạn)',
  })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Booking, (booking) => booking.promotion)
  bookings: Booking[];
}
