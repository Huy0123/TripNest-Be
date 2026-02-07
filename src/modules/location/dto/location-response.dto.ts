import { Expose } from 'class-transformer';

export class LocationResponseDto {
  @Expose()
  id: string;

  @Expose()
  city: string;

  @Expose()
  country: string;

  @Expose()
  province: string;

  @Expose()
  description: string;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;

  @Expose()
  timezone: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
