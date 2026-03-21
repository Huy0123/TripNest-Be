import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TourSessionMode {
  ALL = 'all',
  AVAILABLE = 'available',
  UPCOMING = 'upcoming',
}

export class TourSessionQueryDto {
  @IsOptional()
  @IsEnum(TourSessionMode)
  mode?: TourSessionMode = TourSessionMode.ALL;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  days?: number = 30;
}
