import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepartureStatus } from '@/enums/departure-status.enum';

export class CreateTourSessionDto {
  @IsUUID()
  @IsNotEmpty()
  tourId: string;

  @IsDateString()
  startDate: string;

  @Min(1)
  @Type(() => Number)
  capacity: number;

  @Min(0)
  @Type(() => Number)
  adultPrice: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  childrenPrice?: number;

  @IsOptional()
  @IsEnum(DepartureStatus)
  status?: DepartureStatus;

  @IsOptional()
  @Type(() => Number)
  discount?: number;
}
