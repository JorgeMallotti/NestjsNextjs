import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateWorkerDto, performedById: string) {
    const worker = await this.prisma.worker.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
      },
    });

    await this.audit.log({
      entityType: 'worker',
      entityId: worker.id,
      action: 'create',
      newValues: worker as unknown as Record<string, unknown>,
      performedById,
    });

    return worker;
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

  /**
   * Statuses that are "locked" — admin cannot manually change them.
   * Must follow the system cycle (e.g. driving → available when truck returns).
   */
  private readonly LOCKED_STATUSES = [
    'driving',
    'on_vacation',
    'sick_leave',
    'inactive',
  ];

  /**
   * Statuses that admin can manually set FROM 'available'.
   */
  private readonly ALLOWED_FROM_AVAILABLE = [
    'available',
    'on_vacation',
    'sick_leave',
    'inactive',
  ];

  async update(id: string, dto: UpdateWorkerDto, performedById: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // ── Block status changes when worker is not available ─────────
    if (dto.status && dto.status !== worker.status) {
      if (this.LOCKED_STATUSES.includes(worker.status)) {
        throw new ForbiddenException(
          `Cannot change status of a worker who is currently "${worker.status}". ` +
            'The status must follow its natural cycle ' +
            '(e.g. "driving" → "available" when the truck returns, ' +
            '"on_vacation" → "available" when vacation ends).',
        );
      }

      // From 'available', only allow specific transitions
      if (
        worker.status === 'available' &&
        !this.ALLOWED_FROM_AVAILABLE.includes(dto.status)
      ) {
        throw new BadRequestException(
          `Cannot change status from "available" to "${dto.status}". ` +
            `Allowed: ${this.ALLOWED_FROM_AVAILABLE.join(', ')}.`,
        );
      }
    }

    // ── Require justification for sensitive edits ─────────────────
    // If changing name, position, or startDate, a reason is required
    const isSensitiveEdit =
      (dto.name && dto.name !== worker.name) ||
      (dto.position && dto.position !== worker.position) ||
      (dto.startDate &&
        new Date(dto.startDate).getTime() !== worker.startDate.getTime());

    if (isSensitiveEdit && !dto.reason) {
      throw new BadRequestException(
        'A justification is required when changing worker name, position, or start date.',
      );
    }

    const oldValues: Record<string, unknown> = {
      name: worker.name,
      position: worker.position,
      startDate: worker.startDate.toISOString(),
      status: worker.status,
    };

    // Strip non-Prisma fields (reason is audit-only)
    const { reason, ...prismaData } = dto;

    const updated = await this.prisma.worker.update({
      where: { id },
      data: prismaData,
    });

    await this.audit.log({
      entityType: 'worker',
      entityId: id,
      action: 'update',
      oldValues,
      newValues: updated as unknown as Record<string, unknown>,
      reason: dto.reason ?? null,
      performedById,
    });

    return updated;
  }

  async remove(id: string, performedById: string, reason?: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // ── Block deletion if worker is not available ─────────────────
    if (worker.status !== 'available') {
      throw new BadRequestException(
        `Cannot delete a worker with status "${worker.status}". ` +
          'Only workers with "available" status can be removed.',
      );
    }

    if (!reason) {
      throw new BadRequestException('A reason is required to delete a worker.');
    }

    const oldValues = worker as unknown as Record<string, unknown>;
    await this.prisma.worker.delete({ where: { id } });

    await this.audit.log({
      entityType: 'worker',
      entityId: id,
      action: 'delete',
      oldValues,
      reason,
      performedById,
    });

    return { id, deleted: true };
  }
}
