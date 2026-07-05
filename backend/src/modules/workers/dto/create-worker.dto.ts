import {
  IsString,
  IsOptional,
  MinLength,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  position: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsIn(['active', 'on_vacation', 'sick_leave', 'inactive'])
  status?: string;
}
