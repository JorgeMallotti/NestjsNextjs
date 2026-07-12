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
import { TrucksService } from './trucks.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  create(@Body() dto: CreateTruckDto) {
    return this.trucksService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.trucksService.findAll(pagination);
  }

  @Get('available-for-loading')
  findAvailableForLoading() {
    return this.trucksService.findAvailableForLoading();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trucksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto) {
    return this.trucksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trucksService.remove(id);
  }

  @Post(':id/ship')
  ship(@Param('id') id: string, @Body() body: { driverId: string }) {
    return this.trucksService.ship(id, body.driverId);
  }

  @Post(':id/return')
  returnToFactory(
    @Param('id') id: string,
    @Body() body: { newKilometrage: number },
  ) {
    return this.trucksService.returnToFactory(id, body.newKilometrage);
  }
}
