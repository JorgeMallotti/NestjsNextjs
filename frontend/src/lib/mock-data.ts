import type {
  Client,
  Truck,
  Worker,
  DashboardSummary,
  ActivityItem,
  Product,
  Order,
  Claim,
  ClientUser,
  OrderItem,
} from "@/types";

const now = new Date();

function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function monthsAgo(months: number): string {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

export function getMockClients(): Client[] {
  return [
    {
      id: "cli-001",
      name: "TechParts Lda",
      email: "contacto@techparts.pt",
      location: "Lisboa, Portugal",
      idNumber: "PT512345678",
      activationDate: monthsAgo(14),
      isActive: true,
      purchasesLastMonth: 45200,
      purchasesLast3Months: 128500,
      purchasesLast6Months: 245000,
      purchasesLastYear: 510000,
      totalPurchases: 890000,
      commonProducts: [
        {
          type: "Processadores Intel Xeon",
          quantity: 150,
          frequency: "monthly",
        },
        { type: "Memórias RAM DDR5 32GB", quantity: 300, frequency: "monthly" },
        { type: "SSDs NVMe 1TB", quantity: 200, frequency: "monthly" },
      ],
    },
    {
      id: "cli-002",
      name: "CompuComponentes SA",
      email: "vendas@compucomponentes.es",
      location: "Madrid, España",
      idNumber: "ESB12345678",
      activationDate: monthsAgo(20),
      isActive: true,
      purchasesLastMonth: 67800,
      purchasesLast3Months: 189000,
      purchasesLast6Months: 356000,
      purchasesLastYear: 720000,
      totalPurchases: 1450000,
      commonProducts: [
        {
          type: "Placas Gráficas RTX 4060",
          quantity: 80,
          frequency: "monthly",
        },
        {
          type: "Fontes de Alimentação 850W",
          quantity: 120,
          frequency: "monthly",
        },
        { type: "Coolers CPU Noctua", quantity: 200, frequency: "biweekly" },
      ],
    },
    {
      id: "cli-003",
      name: "ByteBuilders GmbH",
      email: "info@bytebuilders.de",
      location: "Berlim, Alemanha",
      idNumber: "DE987654321",
      activationDate: monthsAgo(8),
      isActive: true,
      purchasesLastMonth: 89500,
      purchasesLast3Months: 245000,
      purchasesLast6Months: 478000,
      purchasesLastYear: 895000,
      totalPurchases: 1250000,
      commonProducts: [
        { type: "Motherboards Z790", quantity: 100, frequency: "monthly" },
        { type: "Memórias RAM DDR5 64GB", quantity: 150, frequency: "monthly" },
        {
          type: "Processadores AMD Ryzen 9",
          quantity: 60,
          frequency: "monthly",
        },
      ],
    },
    {
      id: "cli-004",
      name: "MicroCenter France SAS",
      email: "commandes@microcenter.fr",
      location: "Paris, França",
      idNumber: "FR852963741",
      activationDate: monthsAgo(6),
      isActive: true,
      purchasesLastMonth: 34500,
      purchasesLast3Months: 98700,
      purchasesLast6Months: 195000,
      purchasesLastYear: 340000,
      totalPurchases: 340000,
      commonProducts: [
        { type: "Discos HDD 4TB", quantity: 500, frequency: "monthly" },
        { type: "Cabos SATA III", quantity: 1000, frequency: "quarterly" },
      ],
    },
    {
      id: "cli-005",
      name: "ChipLogic Italia Srl",
      email: "ordini@chiplogic.it",
      location: "Milão, Itália",
      idNumber: "IT45678901234",
      activationDate: monthsAgo(3),
      isActive: true,
      purchasesLastMonth: 12300,
      purchasesLast3Months: 34500,
      purchasesLast6Months: 34500,
      purchasesLastYear: 34500,
      totalPurchases: 34500,
      commonProducts: [
        { type: "Raspberry Pi 5", quantity: 200, frequency: "monthly" },
        { type: "Teclados Mecânicos", quantity: 100, frequency: "monthly" },
      ],
    },
    {
      id: "cli-006",
      name: "DataSys Solutions Ltd",
      email: "sales@datasys.co.uk",
      location: "Londres, Reino Unido",
      idNumber: "GB741852963",
      activationDate: monthsAgo(24),
      isActive: false,
      purchasesLastMonth: 0,
      purchasesLast3Months: 15000,
      purchasesLast6Months: 89000,
      purchasesLastYear: 210000,
      totalPurchases: 980000,
      commonProducts: [
        {
          type: "Servidores Dell PowerEdge",
          quantity: 10,
          frequency: "quarterly",
        },
        { type: "Switches Cisco 48-port", quantity: 5, frequency: "quarterly" },
      ],
    },
    {
      id: "cli-007",
      name: "PC Componentes NL BV",
      email: "info@pccomponentes.nl",
      location: "Amesterdão, Países Baixos",
      idNumber: "NL852963741B01",
      activationDate: monthsAgo(10),
      isActive: true,
      purchasesLastMonth: 56700,
      purchasesLast3Months: 156000,
      purchasesLast6Months: 312000,
      purchasesLastYear: 580000,
      totalPurchases: 720000,
      commonProducts: [
        {
          type: "Gabinetes ATX Mid-Tower",
          quantity: 300,
          frequency: "monthly",
        },
        { type: "Ventoinhas 120mm", quantity: 800, frequency: "monthly" },
        { type: "Pastas Térmicas", quantity: 400, frequency: "quarterly" },
      ],
    },
  ];
}

export function getMockTrucks(): Truck[] {
  return [
    {
      id: "trk-001",
      plateNumber: "AB-12-CD",
      model: "Mercedes-Benz Actros 1845",
      capacity: 18000,
      kilometrage: 145700,
      status: "available",
    },
    {
      id: "trk-002",
      plateNumber: "EF-34-GH",
      model: "Volvo FH 460",
      capacity: 20000,
      kilometrage: 234500,
      status: "shipping",
    },
    {
      id: "trk-003",
      plateNumber: "IJ-56-KL",
      model: "MAN TGX 18.510",
      capacity: 22000,
      kilometrage: 89000,
      status: "available",
    },
    {
      id: "trk-004",
      plateNumber: "MN-67-OP",
      model: "Scania R 500",
      capacity: 20000,
      kilometrage: 312000,
      status: "under_repair",
    },
    {
      id: "trk-005",
      plateNumber: "QR-89-ST",
      model: "DAF XF 480",
      capacity: 19000,
      kilometrage: 56700,
      status: "available",
    },
    {
      id: "trk-006",
      plateNumber: "UV-01-WX",
      model: "Iveco S-Way 460",
      capacity: 18000,
      kilometrage: 12300,
      status: "disabled",
    },
  ];
}

export function getMockWorkers(): Worker[] {
  return [
    {
      id: "wrk-001",
      name: "João Silva",
      position: "Motorista",
      startDate: "2022-03-15T00:00:00.000Z",
      status: "active",
    },
    {
      id: "wrk-002",
      name: "Maria Santos",
      position: "Gestora de Armazém",
      startDate: "2021-07-01T00:00:00.000Z",
      status: "active",
    },
    {
      id: "wrk-003",
      name: "António Ferreira",
      position: "Carregador",
      startDate: "2023-01-10T00:00:00.000Z",
      status: "on_vacation",
    },
    {
      id: "wrk-004",
      name: "Sofia Costa",
      position: "Logística",
      startDate: "2020-11-20T00:00:00.000Z",
      status: "active",
    },
    {
      id: "wrk-005",
      name: "Pedro Martins",
      position: "Motorista",
      startDate: "2024-02-05T00:00:00.000Z",
      status: "sick_leave",
    },
    {
      id: "wrk-006",
      name: "Ana Rodrigues",
      position: "Administrativa",
      startDate: "2023-09-18T00:00:00.000Z",
      status: "active",
    },
    {
      id: "wrk-007",
      name: "Carlos Pereira",
      position: "Motorista Sénior",
      startDate: "2019-05-12T00:00:00.000Z",
      status: "inactive",
    },
    {
      id: "wrk-008",
      name: "Inês Almeida",
      position: "Gestora de Clientes",
      startDate: "2024-06-01T00:00:00.000Z",
      status: "active",
    },
  ];
}

export function getMockActivity(): ActivityItem[] {
  return [
    {
      id: "act-001",
      type: "sale_completed",
      description: "TechParts Lda realizou uma encomenda de €45.200",
      timestamp: daysAgo(0),
    },
    {
      id: "act-002",
      type: "client_added",
      description: "Novo cliente registado: ChipLogic Italia Srl",
      timestamp: daysAgo(1),
    },
    {
      id: "act-003",
      type: "truck_status_change",
      description: "Camião Scania R 500 (MN-67-OP) marcado como 'Em Reparação'",
      timestamp: daysAgo(2),
    },
    {
      id: "act-004",
      type: "worker_status_change",
      description: "Pedro Martins marcado como 'Baixa Médica'",
      timestamp: daysAgo(3),
    },
    {
      id: "act-005",
      type: "sale_completed",
      description: "ByteBuilders GmbH realizou uma encomenda de €89.500",
      timestamp: daysAgo(4),
    },
    {
      id: "act-006",
      type: "worker_status_change",
      description: "António Ferreira marcado como 'De Férias'",
      timestamp: daysAgo(5),
    },
    {
      id: "act-007",
      type: "sale_completed",
      description: "PC Componentes NL BV realizou uma encomenda de €56.700",
      timestamp: daysAgo(7),
    },
    {
      id: "act-008",
      type: "truck_status_change",
      description: "Camião DAF XF 480 (QR-89-ST) marcado como 'Disponível'",
      timestamp: daysAgo(10),
    },
  ];
}

export function getMockDashboardSummary(): DashboardSummary {
  return {
    totalRevenue: 6235000,
    activeClients: 6,
    availableTrucks: 3,
    activeWorkers: 5,
    revenueLastMonth: 326000,
    revenueLast3Months: 947700,
    revenueLast6Months: 1749500,
    revenueLastYear: 3778500,
    recentActivity: getMockActivity(),
  };
}

/* ─── Products ────────────────────────────────────────── */

export function getMockProducts(): Product[] {
  return [
    {
      id: "prd-001",
      name: "Intel Core i9-14900K",
      brand: "Intel",
      type: "CPU",
      price: 589,
      isActive: true,
      createdAt: monthsAgo(6),
    },
    {
      id: "prd-002",
      name: "AMD Ryzen 9 7950X",
      brand: "AMD",
      type: "CPU",
      price: 649,
      isActive: true,
      createdAt: monthsAgo(8),
    },
    {
      id: "prd-003",
      name: "NVIDIA RTX 4080 Super",
      brand: "NVIDIA",
      type: "GPU",
      price: 999,
      isActive: true,
      createdAt: monthsAgo(4),
    },
    {
      id: "prd-004",
      name: "Samsung DDR5 32GB (2x16GB)",
      brand: "Samsung",
      type: "RAM",
      price: 189,
      isActive: true,
      createdAt: monthsAgo(10),
    },
    {
      id: "prd-005",
      name: "Samsung 990 Pro 2TB NVMe",
      brand: "Samsung",
      type: "Storage",
      price: 249,
      isActive: true,
      createdAt: monthsAgo(7),
    },
    {
      id: "prd-006",
      name: "ASUS ROG Strix Z790-E",
      brand: "ASUS",
      type: "Motherboard",
      price: 429,
      isActive: true,
      createdAt: monthsAgo(5),
    },
    {
      id: "prd-007",
      name: "Corsair RM850x 850W",
      brand: "Corsair",
      type: "PSU",
      price: 139,
      isActive: true,
      createdAt: monthsAgo(12),
    },
    {
      id: "prd-008",
      name: "Noctua NH-D15",
      brand: "Noctua",
      type: "Cooling",
      price: 109,
      isActive: true,
      createdAt: monthsAgo(9),
    },
    {
      id: "prd-009",
      name: "WD Black 4TB HDD",
      brand: "Western Digital",
      type: "Storage",
      price: 149,
      isActive: false,
      createdAt: monthsAgo(3),
    },
    {
      id: "prd-010",
      name: "Corsair Vengeance 64GB DDR5",
      brand: "Corsair",
      type: "RAM",
      price: 359,
      isActive: false,
      createdAt: monthsAgo(2),
    },
  ];
}

export function getMockProductsForClient(): Product[] {
  return getMockProducts().filter((p) => p.isActive);
}

/* ─── Orders ──────────────────────────────────────────── */

export function getMockOrders(): Order[] {
  const makeItem = (
    pid: string,
    pname: string,
    qty: number,
    price: number,
  ): OrderItem => ({
    productId: pid,
    productName: pname,
    quantity: qty,
    unitPrice: price,
  });

  return [
    {
      id: "ord-001",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [
        makeItem("prd-001", "Intel Core i9-14900K", 50, 589),
        makeItem("prd-004", "Samsung DDR5 32GB (2x16GB)", 200, 189),
      ],
      totalAmount: 67250,
      status: "delivered",
      estimatedDeliveryDate: daysAgo(45),
      createdAt: daysAgo(75),
      updatedAt: daysAgo(40),
    },
    {
      id: "ord-002",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [
        makeItem("prd-003", "NVIDIA RTX 4080 Super", 30, 999),
        makeItem("prd-008", "Noctua NH-D15", 100, 109),
      ],
      totalAmount: 40870,
      status: "shipped",
      estimatedDeliveryDate: daysAgo(3),
      createdAt: daysAgo(20),
      updatedAt: daysAgo(10),
    },
    {
      id: "ord-003",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [
        makeItem("prd-005", "Samsung 990 Pro 2TB NVMe", 150, 249),
        makeItem("prd-007", "Corsair RM850x 850W", 80, 139),
        makeItem("prd-006", "ASUS ROG Strix Z790-E", 40, 429),
      ],
      totalAmount: 66410,
      status: "confirmed",
      estimatedDeliveryDate: daysAgo(-15),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    {
      id: "ord-004",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [makeItem("prd-002", "AMD Ryzen 9 7950X", 25, 649)],
      totalAmount: 16225,
      status: "pending_approval",
      estimatedDeliveryDate: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: "ord-005",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [
        makeItem("prd-004", "Samsung DDR5 32GB (2x16GB)", 500, 189),
        makeItem("prd-005", "Samsung 990 Pro 2TB NVMe", 100, 249),
      ],
      totalAmount: 119400,
      status: "pending_approval",
      estimatedDeliveryDate: null,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: "ord-006",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [makeItem("prd-007", "Corsair RM850x 850W", 200, 139)],
      totalAmount: 27800,
      status: "cancelled",
      estimatedDeliveryDate: null,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(28),
    },
    {
      id: "ord-007",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [
        makeItem("prd-001", "Intel Core i9-14900K", 100, 589),
        makeItem("prd-003", "NVIDIA RTX 4080 Super", 20, 999),
        makeItem("prd-008", "Noctua NH-D15", 300, 109),
      ],
      totalAmount: 111470,
      status: "confirmed",
      estimatedDeliveryDate: daysAgo(-10),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(6),
    },
    {
      id: "ord-008",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      items: [makeItem("prd-006", "ASUS ROG Strix Z790-E", 60, 429)],
      totalAmount: 25740,
      status: "delivered",
      estimatedDeliveryDate: daysAgo(60),
      createdAt: daysAgo(90),
      updatedAt: daysAgo(55),
    },
  ];
}

/* ─── Claims ──────────────────────────────────────────── */

export function getMockClaims(): Claim[] {
  return [
    {
      id: "clm-001",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      orderId: "ord-001",
      productId: "prd-001",
      productName: "Intel Core i9-14900K",
      reason: "Product arrived damaged",
      description:
        "10 units of the Intel Core i9-14900K arrived with bent pins. The packaging was intact but the internal tray was damaged.",
      status: "approved",
      resolution:
        "After reviewing photos and serial numbers, we confirm the damage occurred during shipping. Full refund for 10 units will be processed within 5 business days.",
      createdAt: daysAgo(60),
      updatedAt: daysAgo(50),
    },
    {
      id: "clm-002",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      orderId: "ord-003",
      productId: "prd-006",
      productName: "ASUS ROG Strix Z790-E",
      reason: "Incorrect specifications",
      description:
        "The received motherboards are revision 1.0, not revision 1.1 as specified in the product listing. The BIOS chip is different.",
      status: "in_process",
      resolution: null,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: "clm-003",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      orderId: "ord-002",
      productId: "prd-003",
      productName: "NVIDIA RTX 4080 Super",
      reason: "Dead on arrival",
      description:
        "5 units of RTX 4080 Super do not power on. No LED, no fan spin. Tested on multiple systems.",
      status: "pending",
      resolution: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: "clm-004",
      clientId: "cli-001",
      clientName: "TechParts Lda",
      orderId: "ord-001",
      productId: "prd-004",
      productName: "Samsung DDR5 32GB (2x16GB)",
      reason: "Performance below advertised",
      description:
        "RAM modules are running at 4800MHz instead of the advertised 5600MHz. XMP profile does not apply correctly.",
      status: "refused",
      resolution:
        "Our tests show the modules reach 5600MHz with proper BIOS settings. Your motherboard may need a BIOS update for full compatibility. Please check with your motherboard manufacturer.",
      createdAt: daysAgo(40),
      updatedAt: daysAgo(30),
    },
  ];
}

/* ─── Client User ─────────────────────────────────────── */

export function getMockClientUser(): ClientUser {
  return {
    id: "cli-001",
    name: "Carlos Mendes",
    email: "contacto@techparts.pt",
    companyName: "TechParts Lda",
    location: "Lisboa, Portugal",
    idNumber: "PT512345678",
    createdAt: monthsAgo(14),
  };
}
