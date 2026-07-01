import {
  getMockClients,
  getMockTrucks,
  getMockWorkers,
  getMockDashboardSummary,
  getMockProducts,
  getMockOrders,
  getMockClaims,
  getMockClientUser,
  getMockProductsForClient,
} from "@/lib/mock-data";
import type {
  Client,
  Truck,
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
} from "@/types";

/**
 * Simulated network delay to mimic real API calls.
 */
function delay(ms?: number): Promise<void> {
  const duration = ms ?? Math.floor(Math.random() * 200) + 300;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Base API client with mock data.
 * All methods currently return local mock data.
 * Replace the base URL and fetch logic when the NestJS backend is ready.
 */

/* ─── Clients ─────────────────────────────────────────── */

let clientsCache: Client[] | null = null;

export async function getClients(): Promise<Client[]> {
  await delay();
  clientsCache ??= getMockClients();
  return clientsCache;
}

export async function getClient(id: string): Promise<Client | undefined> {
  const clients = await getClients();
  return clients.find((c) => c.id === id);
}

export async function createClient(data: ClientFormData): Promise<Client> {
  await delay(500);
  const clients = await getClients();
  const newClient: Client = {
    ...data,
    id: `cli-${String(clients.length + 1).padStart(3, "0")}`,
    activationDate: new Date().toISOString(),
    isActive: true,
    purchasesLastMonth: 0,
    purchasesLast3Months: 0,
    purchasesLast6Months: 0,
    purchasesLastYear: 0,
    totalPurchases: 0,
    commonProducts: [],
  };
  clientsCache = [...clients, newClient];
  return newClient;
}

export async function updateClient(
  id: string,
  data: Partial<ClientFormData>,
): Promise<Client> {
  await delay(400);
  const clients = await getClients();
  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Client ${id} not found`);
  const updated: Client = { ...clients[index], ...data };
  clientsCache = [
    ...clients.slice(0, index),
    updated,
    ...clients.slice(index + 1),
  ];
  return updated;
}

export async function deleteClient(id: string): Promise<void> {
  await delay(300);
  const clients = await getClients();
  clientsCache = clients.filter((c) => c.id !== id);
}

/* ─── Trucks ──────────────────────────────────────────── */

let trucksCache: Truck[] | null = null;

export async function getTrucks(): Promise<Truck[]> {
  await delay();
  trucksCache ??= getMockTrucks();
  return trucksCache;
}

export async function getTruck(id: string): Promise<Truck | undefined> {
  const trucks = await getTrucks();
  return trucks.find((t) => t.id === id);
}

export async function createTruck(data: TruckFormData): Promise<Truck> {
  await delay(500);
  const trucks = await getTrucks();
  const newTruck: Truck = {
    ...data,
    id: `trk-${String(trucks.length + 1).padStart(3, "0")}`,
  };
  trucksCache = [...trucks, newTruck];
  return newTruck;
}

export async function updateTruck(
  id: string,
  data: Partial<TruckFormData>,
): Promise<Truck> {
  await delay(400);
  const trucks = await getTrucks();
  const index = trucks.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Truck ${id} not found`);
  const updated: Truck = { ...trucks[index], ...data };
  trucksCache = [
    ...trucks.slice(0, index),
    updated,
    ...trucks.slice(index + 1),
  ];
  return updated;
}

export async function deleteTruck(id: string): Promise<void> {
  await delay(300);
  const trucks = await getTrucks();
  trucksCache = trucks.filter((t) => t.id !== id);
}

/* ─── Workers ─────────────────────────────────────────── */

let workersCache: Worker[] | null = null;

export async function getWorkers(): Promise<Worker[]> {
  await delay();
  workersCache ??= getMockWorkers();
  return workersCache;
}

export async function getWorker(id: string): Promise<Worker | undefined> {
  const workers = await getWorkers();
  return workers.find((w) => w.id === id);
}

export async function createWorker(data: WorkerFormData): Promise<Worker> {
  await delay(500);
  const workers = await getWorkers();
  const newWorker: Worker = {
    ...data,
    id: `wrk-${String(workers.length + 1).padStart(3, "0")}`,
  };
  workersCache = [...workers, newWorker];
  return newWorker;
}

export async function updateWorker(
  id: string,
  data: Partial<WorkerFormData>,
): Promise<Worker> {
  await delay(400);
  const workers = await getWorkers();
  const index = workers.findIndex((w) => w.id === id);
  if (index === -1) throw new Error(`Worker ${id} not found`);
  const updated: Worker = { ...workers[index], ...data };
  workersCache = [
    ...workers.slice(0, index),
    updated,
    ...workers.slice(index + 1),
  ];
  return updated;
}

export async function deleteWorker(id: string): Promise<void> {
  await delay(300);
  const workers = await getWorkers();
  workersCache = workers.filter((w) => w.id !== id);
}

/* ─── Dashboard ───────────────────────────────────────── */

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  return getMockDashboardSummary();
}

/* ─── Products ────────────────────────────────────────── */

let productsCache: Product[] | null = null;

export async function getProducts(): Promise<Product[]> {
  await delay();
  productsCache ??= getMockProducts();
  return productsCache;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function getActiveProducts(): Promise<Product[]> {
  await delay();
  return getMockProductsForClient();
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  await delay(500);
  const products = await getProducts();
  const newProduct: Product = {
    ...data,
    id: `prd-${String(products.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  productsCache = [...products, newProduct];
  return newProduct;
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>,
): Promise<Product> {
  await delay(400);
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Product ${id} not found`);
  const updated: Product = { ...products[index], ...data };
  productsCache = [
    ...products.slice(0, index),
    updated,
    ...products.slice(index + 1),
  ];
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  await delay(300);
  const products = await getProducts();
  productsCache = products.filter((p) => p.id !== id);
}

export async function toggleProductActive(id: string): Promise<Product> {
  await delay(300);
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Product ${id} not found`);
  const updated: Product = {
    ...products[index],
    isActive: !products[index].isActive,
  };
  productsCache = [
    ...products.slice(0, index),
    updated,
    ...products.slice(index + 1),
  ];
  return updated;
}

/* ─── Orders ──────────────────────────────────────────── */

let ordersCache: Order[] | null = null;

export async function getOrders(): Promise<Order[]> {
  await delay();
  ordersCache ??= getMockOrders();
  return ordersCache;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id);
}

export async function getClientOrders(clientId: string): Promise<Order[]> {
  const orders = await getOrders();
  return orders.filter((o) => o.clientId === clientId);
}

export async function createOrder(
  data: OrderFormData,
  clientId: string,
  clientName: string,
  products: Product[],
): Promise<Order> {
  await delay(500);
  const orders = await getOrders();
  const items = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const newOrder: Order = {
    id: `ord-${String(orders.length + 1).padStart(3, "0")}`,
    clientId,
    clientName,
    items,
    totalAmount,
    status: "pending_approval",
    estimatedDeliveryDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ordersCache = [...orders, newOrder];
  return newOrder;
}

export async function approveOrder(
  id: string,
  deliveryDate: string,
): Promise<Order> {
  await delay(400);
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) throw new Error(`Order ${id} not found`);
  const updated: Order = {
    ...orders[index],
    status: "confirmed",
    estimatedDeliveryDate: deliveryDate,
    updatedAt: new Date().toISOString(),
  };
  ordersCache = [
    ...orders.slice(0, index),
    updated,
    ...orders.slice(index + 1),
  ];
  return updated;
}

export async function cancelOrder(id: string): Promise<Order> {
  await delay(300);
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) throw new Error(`Order ${id} not found`);
  const updated: Order = {
    ...orders[index],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  ordersCache = [
    ...orders.slice(0, index),
    updated,
    ...orders.slice(index + 1),
  ];
  return updated;
}

/* ─── Claims ──────────────────────────────────────────── */

let claimsCache: Claim[] | null = null;

export async function getClaims(): Promise<Claim[]> {
  await delay();
  claimsCache ??= getMockClaims();
  return claimsCache;
}

export async function getClientClaims(clientId: string): Promise<Claim[]> {
  const claims = await getClaims();
  return claims.filter((c) => c.clientId === clientId);
}

export async function createClaim(
  data: ClaimFormData,
  clientId: string,
  clientName: string,
  productName: string,
): Promise<Claim> {
  await delay(500);
  const claims = await getClaims();
  const newClaim: Claim = {
    ...data,
    id: `clm-${String(claims.length + 1).padStart(3, "0")}`,
    clientId,
    clientName,
    productName,
    status: "pending",
    resolution: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  claimsCache = [...claims, newClaim];
  return newClaim;
}

export async function acceptClaim(id: string): Promise<Claim> {
  await delay(300);
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Claim ${id} not found`);
  const updated: Claim = {
    ...claims[index],
    status: "in_process",
    updatedAt: new Date().toISOString(),
  };
  claimsCache = [
    ...claims.slice(0, index),
    updated,
    ...claims.slice(index + 1),
  ];
  return updated;
}

export async function resolveClaim(
  id: string,
  status: "approved" | "refused",
  resolution: string,
): Promise<Claim> {
  await delay(400);
  const claims = await getClaims();
  const index = claims.findIndex((c) => c.id === id);
  if (index === -1) throw new Error(`Claim ${id} not found`);
  const updated: Claim = {
    ...claims[index],
    status,
    resolution,
    updatedAt: new Date().toISOString(),
  };
  claimsCache = [
    ...claims.slice(0, index),
    updated,
    ...claims.slice(index + 1),
  ];
  return updated;
}

/* ─── Client User ─────────────────────────────────────── */

export async function getClientUser(): Promise<ClientUser> {
  await delay();
  return getMockClientUser();
}
