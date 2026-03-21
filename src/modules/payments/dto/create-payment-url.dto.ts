import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentUrlDto {
  @IsUUID()
  bookingId: string;

  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsIn(['vn', 'en'])
  locale?: string;
}
