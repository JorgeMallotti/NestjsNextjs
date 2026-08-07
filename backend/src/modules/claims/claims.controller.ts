import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Roles('client')
  @Post()
  create(@Body() dto: CreateClaimDto, @CurrentUser('id') userId: string) {
    return this.claimsService.create(dto, userId);
  }

  @Roles('admin')
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.claimsService.findAll(pagination);
  }

  @Roles('client')
  @Get('my')
  findMyClaims(
    @Query() pagination: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.claimsService.findAll(pagination, userId);
  }

  @Roles('admin', 'client')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClaimDto) {
    return this.claimsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.claimsService.remove(id);
  }
}
