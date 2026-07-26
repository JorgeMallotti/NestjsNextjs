import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
        deliveryAddress: dto.deliveryAddress,
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
          confirmedBy: { select: { id: true, name: true } },
          shippedBy: { select: { id: true, name: true } },
          deliveredBy: { select: { id: true, name: true } },
          cancelledBy: { select: { id: true, name: true } },
          truck: {
            include: {
              driver: { select: { id: true, name: true } },
            },
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
        confirmedBy: { select: { id: true, name: true } },
        shippedBy: { select: { id: true, name: true } },
        deliveredBy: { select: { id: true, name: true } },
        cancelledBy: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto, performedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // ── Track status changes with responsible user ───────────────
    const statusChangeData: Record<string, unknown> = {};
    const now = new Date();

    if (dto.status && dto.status !== order.status) {
      switch (dto.status) {
        case 'confirmed':
          if (!performedById)
            throw new BadRequestException('User ID required to confirm order');
          statusChangeData.confirmedById = performedById;
          statusChangeData.confirmedAt = now;
          break;
        case 'shipped':
          if (!performedById)
            throw new BadRequestException('User ID required to ship order');
          statusChangeData.shippedById = performedById;
          statusChangeData.shippedAt = now;
          break;
        case 'delivered':
          if (!performedById)
            throw new BadRequestException('User ID required to deliver order');
          statusChangeData.deliveredById = performedById;
          statusChangeData.deliveredAt = now;
          break;
        case 'cancelled':
          if (!performedById)
            throw new BadRequestException('User ID required to cancel order');
          statusChangeData.cancelledById = performedById;
          statusChangeData.cancelledAt = now;
          statusChangeData.cancelledReason = dto.cancelledReason ?? null;
          break;
      }
    }

    // If a truckId is provided and status is confirmed, assign truck to this order
    if (dto.truckId && dto.status === 'confirmed') {
      const truck = await this.prisma.truck.findUnique({
        where: { id: dto.truckId },
      });

      if (!truck) {
        throw new NotFoundException('Truck not found');
      }

      if (!['available', 'loading'].includes(truck.status)) {
        throw new BadRequestException('Truck is not available for loading');
      }

      // Calculate order total weight from product items
      const orderItemsWithProducts = await this.prisma.orderItem.findMany({
        where: { orderId: id },
        include: { product: true },
      });

      const orderWeight = orderItemsWithProducts.reduce(
        (sum, item) => sum + (item.product?.weight ?? 0) * item.quantity,
        0,
      );

      const totalCapacity = truck.capacity;
      const currentAvailable =
        truck.status === 'loading' && truck.availableCapacity != null
          ? truck.availableCapacity
          : totalCapacity;

      const newAvailable = Math.max(0, currentAvailable - orderWeight);

      if (orderWeight > currentAvailable) {
        throw new BadRequestException(
          `Order weight (${orderWeight}kg) exceeds truck available capacity (${currentAvailable}kg)`,
        );
      }

      // Assign truck to order
      await this.prisma.truck.update({
        where: { id: dto.truckId },
        data: {
          status: 'loading',
          currentOrderId: id,
          currentDestination: order.deliveryAddress,
          availableCapacity: newAvailable,
        },
      });
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.estimatedDeliveryDate
          ? { estimatedDeliveryDate: new Date(dto.estimatedDeliveryDate) }
          : {}),
        ...(dto.adminNote ? { adminNote: dto.adminNote } : {}),
        ...statusChangeData,
      },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // ── Audit log for status changes ────────────────────────────
    if (dto.status && dto.status !== order.status && performedById) {
      await this.audit.log({
        entityType: 'order',
        entityId: id,
        action: dto.status,
        oldValues: { status: order.status },
        newValues: { status: dto.status },
        reason: dto.cancelledReason ?? `Order ${dto.status}`,
        performedById,
      });
    }

    return updated;
  }

  /**
   * Client marks an order as delivered.
   * Updates the order status and sets the truck to returning.
   */
  async deliver(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { truck: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== userId) {
      throw new BadRequestException('This order does not belong to you');
    }

    if (order.status !== 'shipped') {
      throw new BadRequestException(
        'Only shipped orders can be marked as delivered',
      );
    }

    const now = new Date();

    // Update order to delivered
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'delivered',
        deliveredById: userId,
        deliveredAt: now,
      },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Set truck to returning (if assigned)
    if (order.truck) {
      await this.prisma.truck.update({
        where: { id: order.truck.id },
        data: { status: 'returning' },
      });
    }

    await this.audit.log({
      entityType: 'order',
      entityId: id,
      action: 'delivered',
      oldValues: { status: 'shipped' },
      newValues: { status: 'delivered' },
      performedById: userId,
    });

    return updatedOrder;
  }

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.delete({ where: { id } });
  }
}
