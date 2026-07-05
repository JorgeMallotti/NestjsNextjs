import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
  IsIn,
} from 'class-validator';

export class CreateTruckDto {
  @IsString()
  @MinLength(2)
  plateNumber: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(0)
  capacity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrage?: number;

  @IsOptional()
  @IsIn(['available', 'in_use', 'under_repair', 'disabled'])
  status?: string;
}
