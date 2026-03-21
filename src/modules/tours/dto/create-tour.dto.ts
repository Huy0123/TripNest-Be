import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StayOption } from '@/enums/stay.enum';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @IsOptional()
  @IsArray()
  guideService?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount?: number;

  @IsNotEmpty()
  @IsString()
  departureLocationId: string;

  @IsOptional()
  @IsEnum(StayOption)
  stayOption?: StayOption;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  destinationIds: string[];
}
