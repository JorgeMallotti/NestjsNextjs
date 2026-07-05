import { IsString, MinLength } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  orderId: string;

  @IsString()
  productId: string;

  @IsString()
  @MinLength(5)
  reason: string;

  @IsString()
  @MinLength(10)
  description: string;
}
