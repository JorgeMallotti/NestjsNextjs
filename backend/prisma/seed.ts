import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.commonProduct.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('demo123456', 12);

  // ─── 1. Admin ────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@comptechpro.com',
      password: hashedPassword,
      name: 'Administrador CompTech',
      role: 'admin',
      isActive: true,
    },
  });
  console.log('  ✓ Admin created:', admin.email);

  // ─── 2. Clients (3 empresas PT) ──────────────────────
  const clientData = [
    {
      email: 'contacto@bytewise.pt',
      name: 'Rui Oliveira',
      companyName: 'ByteWise Lda.',
      location: 'Rua do Comércio 45, 4000-110 Porto',
      idNumber: '512345678',
    },
    {
      email: 'geral@inovadata.pt',
      name: 'Sofia Martins',
      companyName: 'InovaData SA',
      location: 'Av. da Liberdade 189, 1250-141 Lisboa',
      idNumber: '512345679',
    },
    {
      email: 'compras@datacore.pt',
      name: 'João Pereira',
      companyName: 'DataCore Solutions Unip. Lda.',
      location: 'Zona Industrial da Taboeira, 3800-055 Aveiro',
      idNumber: '512345680',
    },
  ];

  const clients = await Promise.all(
    clientData.map((data) =>
      prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          role: 'client',
          isActive: true,
          activationDate: new Date('2026-01-15'),
          approvedAt: new Date('2026-01-16'),
        },
      }),
    ),
  );
  console.log(`  ✓ ${clients.length} clients created`);

  // ─── 3. Products (15+ realistas) ─────────────────────
  const productData = [
    // CPUs
    {
      name: 'Intel Core i5-14600K',
      brand: 'Intel',
      type: 'CPU',
      price: 289.9,
      weight: 0.45,
    },
    {
      name: 'Intel Core i7-14700K',
      brand: 'Intel',
      type: 'CPU',
      price: 449.9,
      weight: 0.48,
    },
    {
      name: 'AMD Ryzen 7 7800X3D',
      brand: 'AMD',
      type: 'CPU',
      price: 399.9,
      weight: 0.42,
    },
    {
      name: 'AMD Ryzen 9 7950X',
      brand: 'AMD',
      type: 'CPU',
      price: 649.9,
      weight: 0.44,
    },
    // GPUs
    {
      name: 'NVIDIA GeForce RTX 4060',
      brand: 'NVIDIA',
      type: 'GPU',
      price: 329.9,
      weight: 1.2,
    },
    {
      name: 'NVIDIA GeForce RTX 4070 Super',
      brand: 'NVIDIA',
      type: 'GPU',
      price: 599.9,
      weight: 1.4,
    },
    {
      name: 'AMD Radeon RX 7800 XT',
      brand: 'AMD',
      type: 'GPU',
      price: 519.9,
      weight: 1.3,
    },
    // RAM
    {
      name: 'Corsair Vengeance 32GB DDR5',
      brand: 'Corsair',
      type: 'RAM',
      price: 129.9,
      weight: 0.15,
    },
    {
      name: 'G.Skill Trident Z5 64GB DDR5',
      brand: 'G.Skill',
      type: 'RAM',
      price: 259.9,
      weight: 0.18,
    },
    {
      name: 'Kingston Fury 16GB DDR4',
      brand: 'Kingston',
      type: 'RAM',
      price: 49.9,
      weight: 0.12,
    },
    // Storage
    {
      name: 'Samsung 990 Pro 1TB NVMe',
      brand: 'Samsung',
      type: 'Storage',
      price: 149.9,
      weight: 0.08,
    },
    {
      name: 'WD Black SN850X 2TB NVMe',
      brand: 'Western Digital',
      type: 'Storage',
      price: 239.9,
      weight: 0.09,
    },
    {
      name: 'Crucial MX500 1TB SATA SSD',
      brand: 'Crucial',
      type: 'Storage',
      price: 89.9,
      weight: 0.07,
    },
    // Motherboards
    {
      name: 'ASUS ROG STRIX Z790-E',
      brand: 'ASUS',
      type: 'Motherboard',
      price: 429.9,
      weight: 1.1,
    },
    {
      name: 'Gigabyte B760M AORUS Elite',
      brand: 'Gigabyte',
      type: 'Motherboard',
      price: 189.9,
      weight: 0.9,
    },
    // PSU
    {
      name: 'Corsair RM850x 850W',
      brand: 'Corsair',
      type: 'PSU',
      price: 149.9,
      weight: 2.1,
    },
    {
      name: 'Seasonic Focus GX-750 750W',
      brand: 'Seasonic',
      type: 'PSU',
      price: 119.9,
      weight: 1.9,
    },
    // Cooling
    {
      name: 'Noctua NH-D15',
      brand: 'Noctua',
      type: 'Cooling',
      price: 109.9,
      weight: 1.3,
    },
    {
      name: 'Corsair H150i Elite Capellix',
      brand: 'Corsair',
      type: 'Cooling',
      price: 189.9,
      weight: 1.6,
    },
    // Other
    {
      name: 'Thermaltake Core P6 Case',
      brand: 'Thermaltake',
      type: 'Other',
      price: 199.9,
      weight: 8.5,
    },
  ];

  const products = await Promise.all(
    productData.map((data) => prisma.product.create({ data })),
  );
  console.log(`  ✓ ${products.length} products created`);

  // ─── 4. Workers ──────────────────────────────────────
  const workerData = [
    {
      name: 'António Silva',
      position: 'Motorista Pesado',
      startDate: new Date('2024-03-01'),
    },
    {
      name: 'Maria Fernandes',
      position: 'Motorista Pesado',
      startDate: new Date('2024-06-15'),
    },
    {
      name: 'Carlos Gomes',
      position: 'Carregador',
      startDate: new Date('2025-01-10'),
    },
    {
      name: 'Ana Costa',
      position: 'Logística',
      startDate: new Date('2024-09-01'),
    },
  ];

  const workers = await Promise.all(
    workerData.map((data) => prisma.worker.create({ data })),
  );
  console.log(`  ✓ ${workers.length} workers created`);

  // ─── 5. Trucks (matrículas PT) ───────────────────────
  const truckData = [
    {
      plateNumber: 'AB-12-CD',
      model: 'Mercedes-Benz Sprinter',
      capacity: 3500,
      kilometrage: 45230,
      status: 'available' as const,
    },
    {
      plateNumber: 'EF-34-GH',
      model: 'IVECO Daily 35S14',
      capacity: 3500,
      kilometrage: 28150,
      status: 'available' as const,
    },
    {
      plateNumber: 'IJ-56-KL',
      model: 'Ford Transit 350L',
      capacity: 3000,
      kilometrage: 67180,
      status: 'loading' as const,
    },
    {
      plateNumber: 'MN-78-OP',
      model: 'Renault Master L3H2',
      capacity: 3200,
      kilometrage: 12450,
      status: 'under_repair' as const,
    },
  ];

  await Promise.all(truckData.map((data) => prisma.truck.create({ data })));
  console.log(`  ✓ ${truckData.length} trucks created`);

  // Refresh trucks with IDs
  const trucks = await prisma.truck.findMany({
    orderBy: { plateNumber: 'asc' },
  });

  // ─── 6. Orders ───────────────────────────────────────
  const orderData = [
    {
      clientId: clients[0].id,
      deliveryAddress: 'Rua do Comércio 45, 4000-110 Porto',
      status: 'delivered' as const,
      items: [
        {
          productId: products[0].id,
          productName: products[0].name,
          quantity: 5,
          unitPrice: products[0].price,
        },
        {
          productId: products[8].id,
          productName: products[8].name,
          quantity: 10,
          unitPrice: products[8].price,
        },
        {
          productId: products[10].id,
          productName: products[10].name,
          quantity: 3,
          unitPrice: products[10].price,
        },
      ],
      confirmedAt: new Date('2026-06-10T09:00:00Z'),
      shippedAt: new Date('2026-06-11T14:00:00Z'),
      deliveredAt: new Date('2026-06-13T10:30:00Z'),
    },
    {
      clientId: clients[1].id,
      deliveryAddress: 'Av. da Liberdade 189, 1250-141 Lisboa',
      status: 'shipped' as const,
      items: [
        {
          productId: products[3].id,
          productName: products[3].name,
          quantity: 2,
          unitPrice: products[3].price,
        },
        {
          productId: products[5].id,
          productName: products[5].name,
          quantity: 4,
          unitPrice: products[5].price,
        },
        {
          productId: products[6].id,
          productName: products[6].name,
          quantity: 3,
          unitPrice: products[6].price,
        },
      ],
      confirmedAt: new Date('2026-07-20T10:00:00Z'),
      shippedAt: new Date('2026-07-22T08:00:00Z'),
    },
    {
      clientId: clients[2].id,
      deliveryAddress: 'Zona Industrial da Taboeira, 3800-055 Aveiro',
      status: 'confirmed' as const,
      items: [
        {
          productId: products[1].id,
          productName: products[1].name,
          quantity: 3,
          unitPrice: products[1].price,
        },
        {
          productId: products[4].id,
          productName: products[4].name,
          quantity: 8,
          unitPrice: products[4].price,
        },
        {
          productId: products[13].id,
          productName: products[13].name,
          quantity: 2,
          unitPrice: products[13].price,
        },
      ],
      confirmedAt: new Date('2026-07-25T11:00:00Z'),
    },
    {
      clientId: clients[0].id,
      deliveryAddress: 'Rua do Comércio 45, 4000-110 Porto',
      status: 'pending_approval' as const,
      items: [
        {
          productId: products[2].id,
          productName: products[2].name,
          quantity: 1,
          unitPrice: products[2].price,
        },
        {
          productId: products[14].id,
          productName: products[14].name,
          quantity: 3,
          unitPrice: products[14].price,
        },
      ],
    },
    {
      clientId: clients[1].id,
      deliveryAddress: 'Av. da Liberdade 189, 1250-141 Lisboa',
      status: 'cancelled' as const,
      items: [
        {
          productId: products[7].id,
          productName: products[7].name,
          quantity: 15,
          unitPrice: products[7].price,
        },
        {
          productId: products[11].id,
          productName: products[11].name,
          quantity: 5,
          unitPrice: products[11].price,
        },
      ],
      confirmedAt: new Date('2026-07-01T09:00:00Z'),
      cancelledAt: new Date('2026-07-02T16:00:00Z'),
      cancelledReason: 'Cancelado pelo cliente — alteração de requisitos',
    },
  ];

  const createdOrders = await Promise.all(
    orderData.map((order) => {
      const totalAmount = order.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      return prisma.order.create({
        data: {
          clientId: order.clientId,
          deliveryAddress: order.deliveryAddress,
          status: order.status,
          totalAmount,
          confirmedAt: order.confirmedAt,
          confirmedById: order.confirmedAt ? admin.id : undefined,
          shippedAt: order.shippedAt,
          shippedById: order.shippedAt ? admin.id : undefined,
          deliveredAt: order.deliveredAt,
          deliveredById: order.deliveredAt ? admin.id : undefined,
          cancelledAt: order.cancelledAt,
          cancelledById: order.cancelledAt ? admin.id : undefined,
          cancelledReason: order.cancelledReason,
          items: {
            create: order.items,
          },
        },
      });
    }),
  );
  console.log(`  ✓ ${createdOrders.length} orders created`);

  // ─── 7. Claims ───────────────────────────────────────
  const claimData = [
    {
      clientId: clients[0].id,
      orderId: createdOrders[0].id,
      productId: products[10].id,
      productName: products[10].name,
      reason: 'Produto defeituoso',
      description:
        'O SSD Samsung 990 Pro não é detetado pela BIOS. Já testámos em duas motherboards diferentes.',
      status: 'approved' as const,
      resolution: 'Substituição aprovada. Novo SSD enviado no dia 15/06.',
    },
    {
      clientId: clients[2].id,
      orderId: createdOrders[2].id,
      productId: products[4].id,
      productName: products[4].name,
      reason: 'Quantidade incorreta',
      description:
        'Encomendámos 8 unidades da RTX 4060, mas apenas recebemos 6.',
      status: 'in_process' as const,
      resolution: null,
    },
    {
      clientId: clients[1].id,
      orderId: createdOrders[4].id,
      productId: products[7].id,
      productName: products[7].name,
      reason: 'Danificado durante transporte',
      description:
        'Recebemos as 15 unidades de RAM Corsair Vengeance, mas 3 delas vieram com os invólucros danificados e não funcionam.',
      status: 'pending' as const,
      resolution: null,
    },
  ];

  await Promise.all(claimData.map((data) => prisma.claim.create({ data })));
  console.log(`  ✓ ${claimData.length} claims created`);

  // ─── 8. Common Products (per-client frequency) ───────
  const commonProductData = [
    {
      clientId: clients[0].id,
      type: 'RAM',
      quantity: 20,
      frequency: 'monthly' as const,
    },
    {
      clientId: clients[0].id,
      type: 'Storage',
      quantity: 10,
      frequency: 'monthly' as const,
    },
    {
      clientId: clients[1].id,
      type: 'GPU',
      quantity: 15,
      frequency: 'monthly' as const,
    },
    {
      clientId: clients[1].id,
      type: 'CPU',
      quantity: 8,
      frequency: 'monthly' as const,
    },
    {
      clientId: clients[2].id,
      type: 'Storage',
      quantity: 30,
      frequency: 'weekly' as const,
    },
    {
      clientId: clients[2].id,
      type: 'Motherboard',
      quantity: 5,
      frequency: 'biweekly' as const,
    },
  ];

  await Promise.all(
    commonProductData.map((data) => prisma.commonProduct.create({ data })),
  );
  console.log(`  ✓ ${commonProductData.length} common products created`);

  // ─── 9. Audit Logs ───────────────────────────────────
  const auditLogs = [
    {
      entityType: 'client',
      entityId: clients[0].id,
      action: 'create',
      performedById: admin.id,
      newValues: JSON.stringify({
        name: 'ByteWise Lda.',
        email: 'contacto@bytewise.pt',
      }),
    },
    {
      entityType: 'client',
      entityId: clients[1].id,
      action: 'create',
      performedById: admin.id,
      newValues: JSON.stringify({
        name: 'InovaData SA',
        email: 'geral@inovadata.pt',
      }),
    },
    {
      entityType: 'client',
      entityId: clients[2].id,
      action: 'create',
      performedById: admin.id,
      newValues: JSON.stringify({
        name: 'DataCore Solutions',
        email: 'compras@datacore.pt',
      }),
    },
    {
      entityType: 'order',
      entityId: createdOrders[0].id,
      action: 'confirm',
      performedById: admin.id,
      newValues: JSON.stringify({ status: 'confirmed' }),
    },
    {
      entityType: 'order',
      entityId: createdOrders[0].id,
      action: 'deliver',
      performedById: admin.id,
      newValues: JSON.stringify({ status: 'delivered' }),
    },
  ];

  await Promise.all(
    auditLogs.map((log) => prisma.auditLog.create({ data: log })),
  );
  console.log(`  ✓ ${auditLogs.length} audit logs created`);

  console.log('\n✅ Seed complete!');
  console.log('──────────────────────────────────────────');
  console.log('  Admin:     admin@comptechpro.com / demo123456');
  console.log('  Client 1:  contacto@bytewise.pt / demo123456');
  console.log('  Client 2:  geral@inovadata.pt / demo123456');
  console.log('  Client 3:  compras@datacore.pt / demo123456');
  console.log('──────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
