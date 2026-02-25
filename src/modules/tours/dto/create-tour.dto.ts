import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDecimal,
  IsBoolean,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTourDetailDto } from './create-tour-detail.dto';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @IsString()
  @IsNotEmpty()
  guideService: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsString()
  departureLocationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinationIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTourDetailDto)
  detail?: CreateTourDetailDto;
}
