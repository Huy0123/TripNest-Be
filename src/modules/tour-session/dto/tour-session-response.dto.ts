import { Expose, Type } from 'class-transformer';
import { DepartureStatus } from 'src/enums/departure-status.enum';

export class TourSessionResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => Object)
  tour: any;

  @Expose()
  startDate: Date;

  @Expose()
  capacity: number;

  @Expose()
  bookedCount: number;

  @Expose()
  price: number;

  @Expose()
  status: DepartureStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  get availableSlots(): number {
    return this.capacity - this.bookedCount;
  }

  @Expose()
  get isBookable(): boolean {
    return this.status === DepartureStatus.OPEN && this.availableSlots > 0;
  }
}
