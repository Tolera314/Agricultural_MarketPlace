import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { BusinessRuleError } from '../../utils/errors.js';

/**
 * Concurrency-safe atomic inventory reservation engine.
 * Ensures stock availability cannot become negative under high-concurrency ordering.
 */
export const inventoryService = {
  /**
   * Check available unreserved stock for a product listing.
   */
  async getAvailableStock(listingId: string): Promise<number> {
    const listing = await prisma.productListing.findUnique({
      where: { id: listingId },
      select: { stockQuantity: true, reservedQuantity: true },
    });
    if (!listing) return 0;
    const stock = Number(listing.stockQuantity);
    const reserved = Number(listing.reservedQuantity);
    return Math.max(0, stock - reserved);
  },

  /**
   * Atomically reserve stock inside a Prisma interactive transaction.
   * Fails immediately if unreserved inventory is insufficient.
   */
  async reserveStock(
    tx: Prisma.TransactionClient,
    listingId: string,
    quantity: number,
    productName = 'Product'
  ): Promise<void> {
    const listing = await tx.productListing.findUnique({
      where: { id: listingId },
      select: { stockQuantity: true, reservedQuantity: true, status: true, unit: true },
    });

    if (!listing) {
      throw new BusinessRuleError(`Product listing ${listingId} not found.`, 'PRODUCT_NOT_FOUND', 'listingId', 404);
    }

    if (listing.status !== 'ACTIVE') {
      throw new BusinessRuleError(
        `Product "${productName}" is currently not active for purchase.`,
        'PRODUCT_INACTIVE',
        'listingId',
        400
      );
    }

    const currentStock = Number(listing.stockQuantity);
    const currentReserved = Number(listing.reservedQuantity);
    const available = currentStock - currentReserved;

    if (quantity > available) {
      throw new BusinessRuleError(
        `The requested quantity (${quantity} ${listing.unit}) is no longer available for "${productName}". Currently available: ${Math.max(0, available)} ${listing.unit}.`,
        'INSUFFICIENT_STOCK',
        'quantity',
        400
      );
    }

    // Atomically increment reservedQuantity
    await tx.productListing.update({
      where: { id: listingId },
      data: {
        reservedQuantity: { increment: quantity },
      },
    });
  },

  /**
   * Commit reservation upon successful payment / order confirmation:
   * Decrements stockQuantity and clears the reservation.
   */
  async commitReservation(
    tx: Prisma.TransactionClient,
    listingId: string,
    quantity: number
  ): Promise<void> {
    const listing = await tx.productListing.findUnique({
      where: { id: listingId },
      select: { stockQuantity: true, reservedQuantity: true },
    });

    if (!listing) return;

    const newStock = Number(listing.stockQuantity) - quantity;
    const newReserved = Math.max(0, Number(listing.reservedQuantity) - quantity);

    await tx.productListing.update({
      where: { id: listingId },
      data: {
        stockQuantity: newStock,
        reservedQuantity: newReserved,
        ...(newStock <= 0 ? { status: 'OUT_OF_STOCK' } : {}),
      },
    });
  },

  /**
   * Release reserved stock on order cancellation, quotation expiration, or payment failure.
   */
  async releaseReservation(
    tx: Prisma.TransactionClient,
    listingId: string,
    quantity: number
  ): Promise<void> {
    const listing = await tx.productListing.findUnique({
      where: { id: listingId },
      select: { reservedQuantity: true },
    });

    if (!listing) return;

    const newReserved = Math.max(0, Number(listing.reservedQuantity) - quantity);

    await tx.productListing.update({
      where: { id: listingId },
      data: {
        reservedQuantity: newReserved,
      },
    });
  },
};
