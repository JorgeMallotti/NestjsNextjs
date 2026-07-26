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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('trucks')
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  create(@Body() dto: CreateTruckDto, @CurrentUser('id') userId: string) {
    return this.trucksService.create(dto, userId);
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTruckDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.trucksService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.trucksService.remove(id, userId);
  }

  @Post(':id/ship')
  ship(
    @Param('id') id: string,
    @Body() body: { driverId: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.trucksService.ship(id, body.driverId, userId);
  }

  @Post(':id/return')
  returnToFactory(
    @Param('id') id: string,
    @Body() body: { newKilometrage: number },
    @CurrentUser('id') userId: string,
  ) {
    return this.trucksService.returnToFactory(id, body.newKilometrage, userId);
  }
}
