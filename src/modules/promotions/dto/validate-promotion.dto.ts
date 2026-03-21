import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidatePromotionDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}
