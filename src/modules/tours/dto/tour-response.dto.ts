import { Expose } from 'class-transformer';

export class TourResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  shortDescription: string;

  @Expose()
  duration: number;

  @Expose()
  nights: number;

  @Expose()
  basePrice: number;

  @Expose()
  currency: string;

  @Expose()
  maxParticipants: number;

  @Expose()
  minParticipants: number;

  @Expose()
  isActive: boolean;

  @Expose()
  guideService: string;

  @Expose()
  quantity: number;

  @Expose()
  language: string;

  @Expose()
  entryFees: string;

  @Expose()
  departureLocation: any;

  @Expose()
  destinations: any[];

  @Expose()
  transportation: any;

  @Expose()
  detail: any;

  @Expose()
  sessions: any[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
