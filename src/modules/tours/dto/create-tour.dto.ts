import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTourDetailDto } from '../../tour-details/dto/create-tour-detail.dto';
import { StayOption } from '@/enums/stay.enum';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @IsArray()
  @IsString({ each: true })
  guideService: string[];

  @IsOptional()
  @IsString()
  image?: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount?: number;

  @IsNotEmpty()
  @IsString()
  departureLocationId: string;

  @IsNotEmpty()
  @IsEnum(StayOption)
  stayOption: StayOption;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  destinationIds: string[];

  @ValidateNested()
  @Type(() => CreateTourDetailDto)
  detail: CreateTourDetailDto;
}
