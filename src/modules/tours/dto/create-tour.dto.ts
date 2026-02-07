import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDecimal,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  duration: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  nights?: number;

  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  basePrice: number;

  @IsOptional()
  @IsString()
  @IsIn(['VND', 'USD', 'EUR'])
  currency?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxParticipants: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minParticipants?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  guideService: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  entryFees: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  transportationId?: string;
}
