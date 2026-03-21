import { IsOptional, IsString } from 'class-validator';

export class VnpayReturnQueryDto {
  @IsString()
  vnp_TxnRef: string;

  @IsOptional()
  @IsString()
  vnp_ResponseCode?: string;

  @IsString()
  vnp_SecureHash: string;

  @IsOptional()
  @IsString()
  vnp_SecureHashType?: string;

  @IsOptional()
  @IsString()
  vnp_Amount?: string;

  @IsOptional()
  @IsString()
  vnp_BankCode?: string;

  @IsOptional()
  @IsString()
  vnp_TmnCode?: string;

  @IsOptional()
  @IsString()
  vnp_CardType?: string;

  @IsOptional()
  @IsString()
  vnp_TransactionStatus?: string;

  @IsOptional()
  @IsString()
  vnp_PayDate?: string;

  @IsOptional()
  @IsString()
  vnp_TransactionNo?: string;

  @IsOptional()
  @IsString()
  vnp_OrderInfo?: string;

  [key: string]: string | undefined;
}
