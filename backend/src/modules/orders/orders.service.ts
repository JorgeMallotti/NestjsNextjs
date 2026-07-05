import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, clientId?: string) {
    const effectiveClientId = dto.clientId ?? clientId;

    if (!effectiveClientId) {
      throw new BadRequestException('Client ID is required');
    }

    const client = await this.prisma.user.findFirst({
      where: { id: effectiveClientId, role: 'client' },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Resolve product details
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found or inactive',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate total and build items
    let totalAmount = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    return this.prisma.order.create({
      data: {
        clientId: effectiveClientId,
        totalAmount,
        status: 'pending_approval',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(pagination: PaginationDto, clientId?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = clientId ? { clientId } : {};

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.estimatedDeliveryDate
          ? { estimatedDeliveryDate: dto.estimatedDeliveryDate }
          : {}),
        ...(dto.adminNote ? { adminNote: dto.adminNote } : {}),
      },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.delete({ where: { id } });
  }
}
