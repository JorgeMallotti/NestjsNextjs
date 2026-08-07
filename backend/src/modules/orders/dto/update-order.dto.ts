import {
  IsOptional,
  IsIn,
  IsDateString,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(['pending_approval', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsString()
  truckId?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  cancelledReason?: string;
}
