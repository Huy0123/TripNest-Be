import { IsOptional, IsString } from 'class-validator';

export class VnpayIpnQueryDto {
  @IsString()
  vnp_TxnRef: string;

  @IsString()
  vnp_ResponseCode: string;

  @IsString()
  vnp_Amount: string;

  @IsString()
  vnp_SecureHash: string;

  @IsOptional()
  @IsString()
  vnp_SecureHashType?: string;

  @IsOptional()
  @IsString()
  vnp_BankCode?: string;

  @IsOptional()
  @IsString()
  vnp_PayDate?: string;

  @IsOptional()
  @IsString()
  vnp_TransactionNo?: string;

  [key: string]: string | undefined;
}
