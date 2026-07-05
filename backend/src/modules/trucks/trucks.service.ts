import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TrucksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTruckDto) {
    return this.prisma.truck.create({
      data: {
        ...dto,
        kilometrage: dto.kilometrage ?? 0,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.truck.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.truck.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const truck = await this.prisma.truck.findUnique({ where: { id } });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return truck;
  }

  async update(id: string, dto: UpdateTruckDto) {
    const truck = await this.prisma.truck.findUnique({ where: { id } });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return this.prisma.truck.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const truck = await this.prisma.truck.findUnique({ where: { id } });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    return this.prisma.truck.delete({ where: { id } });
  }
}
