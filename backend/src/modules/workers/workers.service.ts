import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkerDto) {
    return this.prisma.worker.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.worker.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.worker.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Return workers with 'active' status who can be assigned as drivers.
   */
  async findAvailableDrivers() {
    return this.prisma.worker.findMany({
      where: { status: 'available' },
      select: {
        id: true,
        name: true,
        position: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  async update(id: string, dto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return this.prisma.worker.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return this.prisma.worker.delete({ where: { id } });
  }
}
