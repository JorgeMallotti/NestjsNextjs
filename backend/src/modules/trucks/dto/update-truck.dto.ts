import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateTruckDto } from './create-truck.dto';

export class UpdateTruckDto extends PartialType(CreateTruckDto) {
  @IsOptional()
  @IsString()
  @MinLength(5)
  reason?: string;
}
