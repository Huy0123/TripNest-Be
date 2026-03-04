import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

export class MoreInfoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class ItineraryItemDto {
  @IsString()
  day: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TourImageDto {
  @IsUrl()
  url: string;

  @IsString()
  publicId: string;
}

export class CreateTourDetailDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoreInfoDto)
  moreInfo?: MoreInfoDto[];

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary?: ItineraryItemDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourImageDto)
  images?: TourImageDto[];
}
