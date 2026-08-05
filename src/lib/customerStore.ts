import type { CustomerPublic, CustomerRecord } from "@/data/customer";
import {
  createPasswordHash,
  onlyDigits,
  verifyPassword,
} from "@/lib/wholesaleStore";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/db/mappers";

export async function readCustomers(): Promise<CustomerRecord[]> {
  const rows = await prisma.customer.findMany({
    include: {
      addresses: true,
      orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
      warranties: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((c) => ({
    id: c.id,
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
    name: c.name,
    cpf: c.cpf,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    passwordHash: c.passwordHash,
    favoriteProductIds: c.favoriteProductIds || [],
    blingContactId: c.blingContactId || undefined,
    blingSyncedAt: c.blingSyncedAt ? iso(c.blingSyncedAt) : undefined,
    addresses: c.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      cep: a.cep,
      street: a.street,
      number: a.number,
      complement: a.complement || undefined,
      district: a.district,
      city: a.city,
      state: a.state,
      isDefault: a.isDefault,
    })),
    orders: c.orders.map((o) => ({
      id: o.id,
      createdAt: iso(o.createdAt),
      status: o.status as CustomerRecord["orders"][0]["status"],
      trackingCode: o.trackingCode || undefined,
      carrier: o.carrier || undefined,
      eta: o.eta || undefined,
      total: o.total,
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        image: i.image || undefined,
      })),
      invoiceUrl: o.invoiceUrl || undefined,
      blingOrderId: o.blingOrderId || undefined,
    })),
    warranties: c.warranties.map((w) => ({
      id: w.id,
      createdAt: iso(w.createdAt),
      orderId: w.orderId,
      productName: w.productName,
      status: w.status as CustomerRecord["warranties"][0]["status"],
      notes: w.notes,
    })),
  }));
}

export async function writeCustomers(customers: CustomerRecord[]) {
  await prisma.$transaction(async (tx) => {
    // Replace strategy for API compatibility
    await tx.orderItem.deleteMany({
      where: { order: { customerId: { not: null } } },
    });
    await tx.order.deleteMany({ where: { customerId: { not: null } } });
    await tx.warrantyClaim.deleteMany({});
    await tx.customerAddress.deleteMany({});
    await tx.cartItem.deleteMany({});
    await tx.customer.deleteMany({});

    for (const c of customers) {
      await tx.customer.create({
        data: {
          id: c.id,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt || c.createdAt),
          name: c.name,
          cpf: c.cpf,
          email: c.email,
          phone: c.phone || "",
          whatsapp: c.whatsapp || "",
          passwordHash: c.passwordHash,
          favoriteProductIds: c.favoriteProductIds || [],
          blingContactId: c.blingContactId || null,
          blingSyncedAt: c.blingSyncedAt ? new Date(c.blingSyncedAt) : null,
          addresses: {
            create: (c.addresses || []).map((a) => ({
              id: a.id,
              label: a.label || "Principal",
              cep: a.cep || "",
              street: a.street || "",
              number: a.number || "",
              complement: a.complement || null,
              district: a.district || "",
              city: a.city || "",
              state: a.state || "",
              isDefault: Boolean(a.isDefault),
            })),
          },
          warranties: {
            create: (c.warranties || []).map((w) => ({
              id: w.id,
              orderId: w.orderId,
              productName: w.productName,
              status: w.status,
              notes: w.notes || "",
              createdAt: new Date(w.createdAt),
            })),
          },
          orders: {
            create: (c.orders || []).map((o) => ({
              id: o.id,
              createdAt: new Date(o.createdAt),
              customerName: c.name,
              customerType: "CPF",
              customerCpf: c.cpf,
              total: o.total,
              status: o.status,
              payment: "Checkout",
              trackingCode: o.trackingCode || null,
              carrier: o.carrier || null,
              eta: o.eta || null,
              invoiceUrl: o.invoiceUrl || null,
              blingOrderId: o.blingOrderId || null,
              source: "site",
              items: {
                create: (o.items || []).map((i) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  image: i.image || null,
                })),
              },
            })),
          },
        },
      });
    }
  });
}

export function publicCustomer(customer: CustomerRecord): CustomerPublic {
  const { passwordHash: _, ...rest } = customer;
  return rest;
}

export function isValidCpfLength(cpf: string) {
  return onlyDigits(cpf).length === 11;
}

export { createPasswordHash, onlyDigits, verifyPassword };
