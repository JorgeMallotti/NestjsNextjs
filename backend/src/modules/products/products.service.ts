import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProductDto, performedById: string) {
    const product = await this.prisma.product.create({
      data: dto,
    });

    await this.audit.log({
      entityType: 'product',
      entityId: product.id,
      action: 'create',
      newValues: product as unknown as Record<string, unknown>,
      performedById,
    });

    return product;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllActive() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, performedById?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    if (performedById) {
      await this.audit.log({
        entityType: 'product',
        entityId: id,
        action: 'update',
        oldValues: product as unknown as Record<string, unknown>,
        newValues: updated as unknown as Record<string, unknown>,
        performedById,
      });
    }

    return updated;
  }

  async remove(id: string, performedById: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const oldValues = product as unknown as Record<string, unknown>;

    // Soft delete
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log({
      entityType: 'product',
      entityId: id,
      action: 'delete',
      oldValues,
      newValues: { isActive: false },
      performedById,
    });

    return updated;
  }
}
