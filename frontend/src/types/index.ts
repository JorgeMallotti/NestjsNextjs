export interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  location: string;
  idNumber: string;
  activationDate: string;
  createdAt: string;
  isActive: boolean;
  approvedAt: string | null;
  commonProducts: CommonProduct[];
  _count?: { orders: number; claims: number };
}

export interface CommonProduct {
  type: string;
  quantity: number;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
}

export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  availableCapacity: number | null;
  kilometrage: number;
  status:
    | "available"
    | "loading"
    | "shipping"
    | "returning"
    | "under_repair"
    | "disabled";
  currentDestination: string | null;
  driver?: { id: string; name: string } | null;
  currentOrder?: { id: string; deliveryAddress: string } | null;
}

export interface AvailableTruck {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  availableCapacity: number | null;
  status: "available" | "loading";
  currentDestination: string | null;
}

export interface Worker {
  id: string;
  name: string;
  position: string;
  startDate: string;
  status: "available" | "driving" | "on_vacation" | "sick_leave" | "inactive";
}

export interface DashboardSummary {
  totalRevenue: number;
  activeClients: number;
  availableTrucks: number;
  activeWorkers: number;
  revenueLastMonth: number;
  revenueLast3Months: number;
  revenueLast6Months: number;
  revenueLastYear: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | "client_added"
    | "sale_completed"
    | "truck_status_change"
    | "worker_status_change";
  description: string;
  timestamp: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  location: string;
  idNumber: string;
  password?: string;
}

export interface TruckFormData {
  plateNumber: string;
  model: string;
  capacity: number;
  kilometrage: number;
  status: Truck["status"];
}

export interface WorkerFormData {
  name: string;
  position: string;
  startDate: string;
  status: Worker["status"];
}

// ─── Products (Factory/Admin) ──────────────────────────

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  weight: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  brand: string;
  type: string;
  price: number;
  weight: number;
  isActive: boolean;
}

// ─── Orders (Client → Factory) ─────────────────────────

export type OrderStatus =
  | "pending_approval"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  truckId?: string | null;
  estimatedDeliveryDate: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFormData {
  deliveryAddress: string;
  items: { productId: string; quantity: number }[];
}

// ─── Claims (Client → Factory) ─────────────────────────

export type ClaimStatus = "pending" | "in_process" | "approved" | "refused";

export interface Claim {
  id: string;
  clientId: string;
  clientName: string;
  orderId: string;
  productId: string;
  productName: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimFormData {
  orderId: string;
  productId: string;
  reason: string;
  description: string;
}

// ─── Client User ───────────────────────────────────────

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  companyName: string;
  location: string;
  idNumber: string;
  createdAt: string;
}
