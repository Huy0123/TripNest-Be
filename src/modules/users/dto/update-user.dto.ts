import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '0123456789' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '123 Main St' })
  address?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '1990-01-01' })
  birthDate?: Date;
}
