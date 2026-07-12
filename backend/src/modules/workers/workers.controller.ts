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
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  create(@Body() dto: CreateWorkerDto) {
    return this.workersService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.workersService.findAll(pagination);
  }

  @Get('available-drivers')
  findAvailableDrivers() {
    return this.workersService.findAvailableDrivers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workersService.remove(id);
  }
}
