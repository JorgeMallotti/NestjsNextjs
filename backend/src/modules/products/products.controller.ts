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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) {
    return this.productsService.create(dto, userId);
  }

  @Public()
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll(pagination);
  }

  @Public()
  @Get('active')
  findAllActive() {
    return this.productsService.findAllActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, dto, userId);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.remove(id, userId);
  }
}
