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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser('id') userId: string) {
    return this.clientsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query('showDeleted') showDeleted?: string,
  ) {
    return this.clientsService.findAll(pagination, showDeleted === 'true');
  }

  @Get('stats')
  getStats() {
    return this.clientsService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  softRemove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.softRemove(id, userId);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.restore(id, userId);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.permanentRemove(id, userId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.approve(id, userId);
  }
}
