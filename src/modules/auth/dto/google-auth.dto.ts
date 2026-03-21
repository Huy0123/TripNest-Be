import { IsJWT, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsNotEmpty()
  @IsJWT()
  idToken: string;
}
