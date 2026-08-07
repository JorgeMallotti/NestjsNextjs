/**
 * API client — all functions call the real NestJS backend.
 *
 * Naming conventions:
 * - Admin-scoped: getClients, getTrucks, getWorkers, getOrders, getClaims, getProducts
 * - Client-scoped: getMyOrders, getMyClaims — these use `/my` endpoints
 *   and NEVER require a clientId parameter (extracted from JWT server-side).
 */
import { api } from "./api";
import type {
  Client,
  Truck,
  AvailableTruck,
  Worker,
  DashboardSummary,
  ClientFormData,
  TruckFormData,
  WorkerFormData,
  Product,
  ProductFormData,
  Order,
  OrderFormData,
  Claim,
  ClaimFormData,
  ClientUser,
  AuditLogEntry,
} from "@/types";

/* ─── Clients (Admin) ─────────────────────────────────── */

export async function getClients(showDeleted = false): Promise<Client[]> {
  return api.get<Client[]>(`/clients${showDeleted ? "?showDeleted=true" : ""}`);
}

export async function getClient(id: string): Promise<Client> {
  return api.get<Client>(`/clients/${id}`);
}

export async function createClient(data: ClientFormData): Promise<Client> {
  return api.post<Client>("/clients", data);
}

export async function updateClient(
  id: string,
  data: Partial<ClientFormData>,
): Promise<Client> {
  return api.patch<Client>(`/clients/${id}`, data);
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export async function approveClient(id: string): Promise<{
  id: string;
  name: string;
  email: string;
  approvedAt: string;
  isActive: boolean;
}> {
  return api.patch(`/clients/${id}/approve`);
}

/* ─── Trucks (Admin) ──────────────────────────────────── */

export async function getTrucks(): Promise<Truck[]> {
  return api.get<Truck[]>("/trucks");
}

export async function getTruck(id: string): Promise<Truck> {
  return api.get<Truck>(`/trucks/${id}`);
}

export async function createTruck(data: TruckFormData): Promise<Truck> {
  return api.post<Truck>("/trucks", data);
}

export async function updateTruck(
  id: string,
  data: Partial<TruckFormData>,
): Promise<Truck> {
  return api.patch<Truck>(`/trucks/${id}`, data);
}

export async function deleteTruck(id: string): Promise<void> {
  await api.delete(`/trucks/${id}`);
}

/* ─── Workers (Admin) ─────────────────────────────────── */

export async function getWorkers(): Promise<Worker[]> {
  return api.get<Worker[]>("/workers");
}

export async function getWorker(id: string): Promise<Worker> {
  return api.get<Worker>(`/workers/${id}`);
}

export async function createWorker(data: WorkerFormData): Promise<Worker> {
  return api.post<Worker>("/workers", data);
}

export async function updateWorker(
  id: string,
  data: Partial<WorkerFormData>,
): Promise<Worker> {
  return api.patch<Worker>(`/workers/${id}`, data);
}

export async function deleteWorker(id: string, reason?: string): Promise<void> {
  await api.delete(`/workers/${id}`, reason ? { reason } : undefined);
}

/* ─── Products (Admin) ────────────────────────────────── */

export async function getProducts(): Promise<Product[]> {
  return api.get<Product[]>("/products");
}

export async function getProduct(id: string): Promise<Product> {
  return api.get<Product>(`/products/${id}`);
}

export async function getActiveProducts(): Promise<Product[]> {
  return api.get<Product[]>("/products/active");
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  return api.post<Product>("/products", data);
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>,
): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function toggleProductActive(id: string): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, {});
}

/* ─── Orders (Admin — all orders) ─────────────────────── */

export async function getOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders");
}

export async function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

export async function updateOrderStatus(
  id: string,
  status: string,
  estimatedDeliveryDate?: string,
  adminNote?: string,
  truckId?: string,
): Promise<Order> {
  return api.patch<Order>(`/orders/${id}`, {
    status,
    ...(estimatedDeliveryDate ? { estimatedDeliveryDate } : {}),
    ...(adminNote ? { adminNote } : {}),
    ...(truckId ? { truckId } : {}),
  });
}

export async function approveOrder(
  id: string,
  estimatedDeliveryDate?: string,
  adminNote?: string,
  truckId?: string,
): Promise<Order> {
  return updateOrderStatus(
    id,
    "confirmed",
    estimatedDeliveryDate,
    adminNote,
    truckId,
  );
}

export async function shipOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, "shipped");
}

export async function deliverOrder(id: string): Promise<Order> {
  return updateOrderStatus(id, "delivered");
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  return api.patch<Order>(`/orders/${id}`, {
    status: "cancelled",
    ...(reason ? { cancelledReason: reason } : {}),
  });
}

/* ─── Clients — Restore & Permanent Delete ───────────── */

export async function restoreClient(
  id: string,
): Promise<{ id: string; deletedAt: string | null; isActive: boolean }> {
  return api.patch(`/clients/${id}/restore`);
}

export async function permanentDeleteClient(
  id: string,
): Promise<{ id: string; permanentlyDeleted: boolean }> {
  return api.delete(`/clients/${id}/permanent`);
}

/* ─── Audit Log ──────────────────────────────────────── */

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
}): Promise<{
  data: AuditLogEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.entityType) query.set("entityType", params.entityType);
  if (params?.action) query.set("action", params.action);
  const qs = query.toString();
  return api.getPaginated(`/audit${qs ? `?${qs}` : ""}`);
}

/* ─── Trucks — Shipping & Returns ────────────────────── */

export async function getAvailableTrucks(): Promise<AvailableTruck[]> {
  return api.get<AvailableTruck[]>("/trucks/available-for-loading");
}

export async function shipTruck(id: string, driverId: string): Promise<Truck> {
  return api.post<Truck>(`/trucks/${id}/ship`, { driverId });
}

export async function returnTruck(
  id: string,
  newKilometrage: number,
): Promise<Truck> {
  return api.post<Truck>(`/trucks/${id}/return`, { newKilometrage });
}

/* ─── Workers — Available Drivers ────────────────────── */

export async function getAvailableDrivers(): Promise<
  { id: string; name: string; position: string; status: string }[]
> {
  return api.get("/workers/available-drivers");
}

/* ─── Client — Mark Order as Delivered ───────────────── */

export async function deliverOrderClient(id: string): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/deliver`);
}

/* ─── Orders (Client — my orders only) ────────────────── */

export async function getMyOrders(): Promise<Order[]> {
  return api.get<Order[]>("/orders/my");
}

export async function createOrder(data: OrderFormData): Promise<Order> {
  return api.post<Order>("/orders", data);
}

/* ─── Claims (Admin) ──────────────────────────────────── */

export async function getClaims(): Promise<Claim[]> {
  return api.get<Claim[]>("/claims");
}

export async function getClaim(id: string): Promise<Claim> {
  return api.get<Claim>(`/claims/${id}`);
}

export async function updateClaim(
  id: string,
  data: { status?: string; resolution?: string },
): Promise<Claim> {
  return api.patch<Claim>(`/claims/${id}`, data);
}

export async function deleteClaim(id: string): Promise<void> {
  await api.delete(`/claims/${id}`);
}

/* ─── Claims (Client — my claims only) ────────────────── */

export async function getMyClaims(): Promise<Claim[]> {
  return api.get<Claim[]>("/claims/my");
}

export async function createClaim(data: ClaimFormData): Promise<Claim> {
  return api.post<Claim>("/claims", data);
}

export async function acceptClaim(id: string): Promise<Claim> {
  return api.patch<Claim>(`/claims/${id}`, { status: "in_process" });
}

export async function resolveClaim(
  id: string,
  status: "approved" | "refused",
  resolution: string,
): Promise<Claim> {
  return api.patch<Claim>(`/claims/${id}`, { status, resolution });
}

/* ─── Dashboard ───────────────────────────────────────── */

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>("/clients/stats");
}

/* ─── Client User Profile ─────────────────────────────── */

export async function getClientUser(): Promise<ClientUser> {
  return api.get<ClientUser>("/auth/profile");
}

/* ─── Client Orders/Claims (Legacy — kept for compatibility) ─── */
/* These are kept so existing page imports still work.      */
/* They ignore the clientId parameter — the backend         */
/* extracts the user from the JWT token.                    */
export async function getClientOrders(_clientId: string): Promise<Order[]> {
  return getMyOrders();
}

export async function getClientClaims(_clientId: string): Promise<Claim[]> {
  return getMyClaims();
}
