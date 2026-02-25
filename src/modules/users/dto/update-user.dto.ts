import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@/enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'admin@example.com' })
  email?: string;

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
  @ApiPropertyOptional({ example: 'password123' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  avatar?: string;
}
