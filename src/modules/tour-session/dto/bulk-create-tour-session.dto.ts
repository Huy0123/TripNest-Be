import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

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
  daysOfWeek: number[];

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  adultPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  childrenPrice?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount?: number;
}
