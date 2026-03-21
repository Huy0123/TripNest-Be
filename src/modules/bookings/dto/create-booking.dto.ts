import { IsInt, IsNotEmpty, IsUUID, Min, Max, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Tour session ID' })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Tour ID' })
  @IsNotEmpty()
  @IsUUID()
  tourId: string;

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

  @ApiProperty({ description: 'Tên khách hàng' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Email khách hàng' })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Số điện thoại khách hàng' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;
}
