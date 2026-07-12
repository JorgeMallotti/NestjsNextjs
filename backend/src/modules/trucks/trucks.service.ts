import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
        include: {
          driver: { select: { id: true, name: true } },
          currentOrder: { select: { id: true, deliveryAddress: true } },
        },
      }),
      this.prisma.truck.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Return trucks that can be assigned to an order:
   * - available: empty, ready to load
   * - loading: already being loaded, may have capacity for more
   */
  async findAvailableForLoading() {
    return this.prisma.truck.findMany({
      where: {
        status: { in: ['available', 'loading'] },
      },
      select: {
        id: true,
        plateNumber: true,
        model: true,
        capacity: true,
        availableCapacity: true,
        status: true,
        currentDestination: true,
      },
      orderBy: { plateNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true } },
        currentOrder: { select: { id: true, deliveryAddress: true } },
      },
    });

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

  /**
   * Ship a loading truck: assign driver, set status to shipping, update order to shipped.
   */
  async ship(id: string, driverId: string) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: { currentOrder: true },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    if (truck.status !== 'loading') {
      throw new BadRequestException(
        'Only trucks in loading status can be shipped',
      );
    }

    // Verify driver exists and is active
    const driver = await this.prisma.worker.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.status !== 'available') {
      throw new BadRequestException('Driver not found or not available');
    }

    // Update truck: shipping, assign driver
    const updatedTruck = await this.prisma.truck.update({
      where: { id },
      data: {
        status: 'shipping',
        driverId,
      },
      include: {
        driver: { select: { id: true, name: true } },
        currentOrder: true,
      },
    });

    // Update worker to driving
    await this.prisma.worker.update({
      where: { id: driverId },
      data: { status: 'driving' },
    });

    // Update order to shipped
    if (truck.currentOrderId) {
      await this.prisma.order.update({
        where: { id: truck.currentOrderId },
        data: { status: 'shipped' },
      });
    }

    return updatedTruck;
  }

  async returnToFactory(id: string, newKilometrage: number) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: { currentOrder: true },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    if (truck.status !== 'returning') {
      throw new BadRequestException(
        'Only trucks in returning status can be marked as available',
      );
    }

    // Reset truck to available
    const updatedTruck = await this.prisma.truck.update({
      where: { id },
      data: {
        status: 'available',
        kilometrage: newKilometrage,
        currentDestination: null,
        availableCapacity: null,
        currentOrderId: null,
        driverId: null,
      },
    });

    // Set worker back to active
    if (truck.driverId) {
      await this.prisma.worker.update({
        where: { id: truck.driverId },
        data: { status: 'available' },
      });
    }

    return updatedTruck;
  }
}
