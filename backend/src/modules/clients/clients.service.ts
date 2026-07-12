import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: 'client',
        companyName: dto.companyName,
        location: dto.location,
        idNumber: dto.idNumber,
        activationDate: new Date(),
        approvedAt: new Date(), // Admin-created = pre-approved
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        companyName: true,
        location: true,
        idNumber: true,
        activationDate: true,
        createdAt: true,
        commonProducts: true,
      },
    });

    return user;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'client' },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          companyName: true,
          location: true,
          idNumber: true,
          activationDate: true,
          createdAt: true,
          approvedAt: true,
          commonProducts: true,
          _count: {
            select: { orders: true, claims: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { role: 'client' } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'client' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        companyName: true,
        location: true,
        idNumber: true,
        activationDate: true,
        createdAt: true,
        updatedAt: true,
        commonProducts: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
        claims: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateClientDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, role: 'client' },
    });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const updateData: any = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        companyName: true,
        location: true,
        idNumber: true,
        activationDate: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'client' },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    // Soft delete: deactivate instead of hard delete
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  async approve(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'client' },
    });

    if (!user) {
      throw new NotFoundException('Client not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { approvedAt: new Date(), isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        approvedAt: true,
        isActive: true,
      },
    });
  }

  async getDashboardStats() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOf6MonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
    );
    const firstOfQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    const firstOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalClients,
      activeClients,
      availableTrucks,
      activeWorkers,
      allTimeRevenue,
      monthlyRevenue,
      quarterlyRevenue,
      sixMonthRevenue,
      yearlyRevenue,
      recentOrders,
      recentClients,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.user.count({ where: { role: 'client', isActive: true } }),
      this.prisma.truck.count({ where: { status: 'available' } }),
      this.prisma.worker.count({ where: { status: 'available' } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: firstOfMonth } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: firstOfQuarter } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: firstOf6MonthsAgo } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: firstOfYear } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'client' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    // Build recent activity feed
    const recentActivity: {
      id: string;
      type: 'sale_completed' | 'client_added';
      description: string;
      timestamp: string;
    }[] = [];

    for (const order of recentOrders) {
      recentActivity.push({
        id: `order-${order.id}`,
        type: 'sale_completed',
        description: `New order #${order.id.slice(-6)} — $${order.totalAmount.toLocaleString()} by ${order.client?.name ?? 'Unknown'}`,
        timestamp: order.createdAt.toISOString(),
      });
    }

    for (const client of recentClients) {
      recentActivity.push({
        id: `client-${client.id}`,
        type: 'client_added',
        description: `New client registered: ${client.name}`,
        timestamp: client.createdAt.toISOString(),
      });
    }

    // Sort by timestamp descending
    recentActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const totalRevenue = allTimeRevenue._sum.totalAmount ?? 0;

    return {
      totalRevenue,
      activeClients,
      availableTrucks,
      activeWorkers,
      revenueLastMonth: monthlyRevenue._sum.totalAmount ?? 0,
      revenueLast3Months: quarterlyRevenue._sum.totalAmount ?? 0,
      revenueLast6Months: sixMonthRevenue._sum.totalAmount ?? 0,
      revenueLastYear: yearlyRevenue._sum.totalAmount ?? 0,
      recentActivity: recentActivity.slice(0, 10),
    };
  }
}
