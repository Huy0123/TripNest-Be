import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/enums/user-role.enum';

export class CreateUserAdminDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Admin' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'User' })
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'password123' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  role?: UserRole;

  @IsOptional()
  @ApiPropertyOptional({ default: true })
  isActive?: boolean;
}
