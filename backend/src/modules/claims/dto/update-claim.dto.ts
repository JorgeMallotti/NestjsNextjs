import { IsOptional, IsIn, IsString } from 'class-validator';

export class UpdateClaimDto {
  @IsOptional()
  @IsIn(['pending', 'in_process', 'approved', 'refused'])
  status?: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}
