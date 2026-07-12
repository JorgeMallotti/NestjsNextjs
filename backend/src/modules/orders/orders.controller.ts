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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('admin', 'client')
  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    // Clients can only create orders for themselves; admins can specify clientId
    const clientId = user.role === 'client' ? user.id : undefined;
    return this.ordersService.create(dto, clientId);
  }

  @Roles('admin')
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.ordersService.findAll(pagination);
  }

  @Roles('client')
  @Get('my')
  findMyOrders(
    @Query() pagination: PaginationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findAll(pagination, userId);
  }

  @Roles('admin', 'client')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Roles('client')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.deliver(id, userId);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
