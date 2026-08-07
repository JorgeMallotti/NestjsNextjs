import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TrucksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTruckDto, performedById: string) {
    const truck = await this.prisma.truck.create({
      data: {
        ...dto,
        kilometrage: dto.kilometrage ?? 0,
      },
    });

    await this.audit.log({
      entityType: 'truck',
      entityId: truck.id,
      action: 'create',
      newValues: truck as unknown as Record<string, unknown>,
      performedById,
    });

    return truck;
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

  /**
   * Allowed status transitions for admin direct edits.
   * Moving trucks (has driver, shipping, returning) CANNOT be edited.
   */
  private readonly ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    available: ['available', 'under_repair', 'disabled', 'loading'],
    loading: ['loading', 'shipping', 'available'],
    under_repair: ['under_repair', 'available'],
    disabled: ['disabled', 'available'],
  };

  async update(id: string, dto: UpdateTruckDto, performedById: string) {
    const truck = await this.prisma.truck.findUnique({ where: { id } });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    // ── Block editing if truck is in motion ──────────────────────
    const isInMotion =
      truck.driverId !== null ||
      truck.status === 'shipping' ||
      truck.status === 'returning';

    if (isInMotion) {
      throw new ForbiddenException(
        'Cannot edit a truck that is currently in motion (driver assigned, shipping, or returning). ' +
          'Use the Ship/Return workflow to change its status.',
      );
    }

    // ── Validate status transitions ──────────────────────────────
    if (dto.status && dto.status !== truck.status) {
      const allowedNext = this.ALLOWED_STATUS_TRANSITIONS[truck.status];
      if (!allowedNext || !allowedNext.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change status from "${truck.status}" to "${dto.status}". ` +
            `Allowed transitions for "${truck.status}": ${
              allowedNext?.join(', ') ?? 'none'
            }. ` +
            'Use the Ship/Return workflow for loading → shipping → returning → available.',
        );
      }
    }

    // ── Block plateNumber changes on any truck with history ──────
    if (dto.plateNumber && dto.plateNumber !== truck.plateNumber) {
      throw new BadRequestException(
        'Plate number cannot be changed after registration.',
      );
    }

    // ── If going from loading → available, unassign the order ────
    let extraData: Record<string, unknown> = {};
    if (
      truck.status === 'loading' &&
      dto.status === 'available' &&
      truck.currentOrderId
    ) {
      // Reset the order back to pending_approval so it doesn't get lost
      await this.prisma.order.update({
        where: { id: truck.currentOrderId },
        data: { status: 'pending_approval' },
      });

      extraData = {
        currentOrderId: null,
        availableCapacity: null,
        currentDestination: null,
      };
    }

    const oldValues = {
      ...truck,
    } as unknown as Record<string, unknown>;

    // Build Prisma update data (exclude non-Prisma fields like `reason`)
    const prismaData: Record<string, unknown> = {};
    if (dto.plateNumber !== undefined) prismaData.plateNumber = dto.plateNumber;
    if (dto.model !== undefined) prismaData.model = dto.model;
    if (dto.capacity !== undefined) prismaData.capacity = dto.capacity;
    if (dto.kilometrage !== undefined) prismaData.kilometrage = dto.kilometrage;
    if (dto.status !== undefined) prismaData.status = dto.status;

    const updated = await this.prisma.truck.update({
      where: { id },
      data: {
        ...prismaData,
        ...extraData,
      },
    });

    await this.audit.log({
      entityType: 'truck',
      entityId: id,
      action: 'update',
      oldValues,
      newValues: updated as unknown as Record<string, unknown>,
      reason: dto.reason ?? null,
      performedById,
    });

    return updated;
  }

  async remove(id: string, performedById: string) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: { currentOrder: true },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found');
    }

    // ── Block deletion if truck is in use ────────────────────────
    if (truck.driverId || truck.currentOrderId) {
      throw new BadRequestException(
        'Cannot delete a truck that is currently assigned to a driver or order. ' +
          'Make sure the truck has returned and is available before deleting.',
      );
    }

    const oldValues = truck as unknown as Record<string, unknown>;
    await this.prisma.truck.delete({ where: { id } });

    await this.audit.log({
      entityType: 'truck',
      entityId: id,
      action: 'delete',
      oldValues,
      reason: 'Truck removed from fleet',
      performedById,
    });

    return { id, deleted: true };
  }

  /**
   * Ship a loading truck: assign driver, set status to shipping, update order to shipped.
   */
  async ship(id: string, driverId: string, performedById: string) {
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

    await this.audit.log({
      entityType: 'truck',
      entityId: id,
      action: 'ship',
      newValues: { status: 'shipping', driverId },
      reason: 'Truck shipped with driver',
      performedById,
    });

    return updatedTruck;
  }

  async returnToFactory(
    id: string,
    newKilometrage: number,
    performedById: string,
  ) {
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

    await this.audit.log({
      entityType: 'truck',
      entityId: id,
      action: 'update',
      oldValues: { status: 'returning', kilometrage: truck.kilometrage },
      newValues: { status: 'available', kilometrage: newKilometrage },
      reason: 'Truck returned to factory',
      performedById,
    });

    return updatedTruck;
  }
}
