import { Expose, Type } from 'class-transformer';

export class ReviewResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => Object)
  tour: any;

  @Expose()
  @Type(() => Object)
  user: any;

  @Expose()
  rating: number;

  @Expose()
  comment: string;

  @Expose()
  title: string;

  @Expose()
  isVisible: boolean;

  @Expose()
  isFeatured: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
