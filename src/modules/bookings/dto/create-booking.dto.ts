import { IsInt, IsNotEmpty, IsUUID, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Tour session ID' })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({ minimum: 0, maximum: 50 })
  @IsInt()
  @Min(0)
  @Max(50)
  adults: number;

  @ApiProperty({ minimum: 0, maximum: 50 })
  @IsInt()
  @Min(0)
  @Max(50)
  children: number;


  @ApiProperty({ description: 'Mã giảm giá (nếu có)', required: false })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
