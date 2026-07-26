import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  reason?: string | null;
  performedById: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an audit log entry.
   * oldValues and newValues are automatically serialised to JSON strings.
   */
  async log(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        reason: entry.reason ?? null,
        performedById: entry.performedById,
      },
    });
  }

  /**
   * Find audit logs for a specific entity.
   */
  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * List all audit logs with pagination and optional entity type filter.
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  }) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.action) where.action = params.action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
