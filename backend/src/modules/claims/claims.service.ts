import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClaimDto, clientId: string) {
    // Verify order exists and belongs to client
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== clientId) {
      throw new BadRequestException('Order does not belong to this client');
    }

    // Verify product exists in the order
    const orderItem = order.items.find(
      (item) => item.productId === dto.productId,
    );

    if (!orderItem) {
      throw new BadRequestException('Product not found in this order');
    }

    return this.prisma.claim.create({
      data: {
        clientId,
        orderId: dto.orderId,
        productId: dto.productId,
        productName: orderItem.productName,
        reason: dto.reason,
        description: dto.description,
        status: 'pending',
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalAmount: true, status: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto, clientId?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = clientId ? { clientId } : {};

    const [data, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          order: { select: { id: true, totalAmount: true, status: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.claim.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalAmount: true, status: true } },
        product: { select: { id: true, name: true, price: true } },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return claim;
  }

  async update(id: string, dto: UpdateClaimDto) {
    const claim = await this.prisma.claim.findUnique({ where: { id } });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return this.prisma.claim.update({
      where: { id },
      data: dto,
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, totalAmount: true, status: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const claim = await this.prisma.claim.findUnique({ where: { id } });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return this.prisma.claim.delete({ where: { id } });
  }
}
