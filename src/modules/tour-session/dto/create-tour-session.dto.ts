import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDecimal,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DepartureStatus } from 'src/enums/departure-status.enum';

export class CreateTourSessionDto {
  @IsString()
  @IsNotEmpty()
  tourId: string;

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsEnum(DepartureStatus)
  status?: DepartureStatus;
}
