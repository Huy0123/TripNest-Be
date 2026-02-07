import { IsNotEmpty } from 'class-validator';

export class CreateUserProfileDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  birthDate?: Date;

  @IsNotEmpty()
  phone?: string;

  @IsNotEmpty()
  address?: string;
}
