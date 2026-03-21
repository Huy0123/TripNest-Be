import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateTourSessionDto {
  @IsUUID()
  @IsNotEmpty()
  tourId: string;

  @IsDateString()
  @IsNotEmpty()
  startDateRange: string;

  @IsDateString()
  @IsNotEmpty()
  endDateRange: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @Type(() => Number)
  daysOfWeek: number[];

  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  adultPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  childrenPrice?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount?: number;
}
