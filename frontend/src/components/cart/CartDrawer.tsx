'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, CheckCircle2, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { CartItem, MarketLocation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { buyerApi } from '@/lib/buyerApi';
import { getHumanReadableErrorMessage } from '@/lib/errorHandler';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentLocation: MarketLocation;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentLocation,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [buyerName, setBuyerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [roleErrorMessage, setRoleErrorMessage] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 50 : 0; // ETB
  const platformFee = items.length > 0 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + deliveryFee + platformFee;

  const handleStartCheckout = () => {
    setRoleErrorMessage(null);
    setOrderError(null);

    // Guest protection: Require authentication before checkout
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    // Role check: Only Buyers (or admins) can create orders
    if (user.role !== 'BUYER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      setRoleErrorMessage(
        `Orders can only be placed from a Customer (Buyer) account. You are currently signed in as ${user.role}.`
      );
      return;
    }

    setCheckoutStep('checkout');
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setOrderError('Please enter your delivery street address.');
      return;
    }

    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      // Revalidate and place order through backend API
      const orderPayload = {
        items: items.map((i) => ({
          listingId: i.product.id,
          quantity: i.quantity,
        })),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: 'TELEBIRR',
        buyerNotes: deliveryNotes.trim() || undefined,
        idempotencyKey: `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      };

      const res = await buyerApi.createOrder(orderPayload);
      const generatedRef = res.data?.orderNumber || `AGRI-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderRef(generatedRef);
      setCheckoutStep('confirmed');
      onClearCart();
    } catch (err: any) {
      const friendlyMessage = getHumanReadableErrorMessage(
        err,
        'Unable to complete your order at this time. Please check available stock and try again.'
      );
      setOrderError(friendlyMessage);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleReset = () => {
    setCheckoutStep('cart');
    setRoleErrorMessage(null);
    setOrderError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FAF8F5] dark:bg-[#0B1512] h-full shadow-2xl flex flex-col justify-between border-l border-[#E5EDE4] dark:border-[#1E3A2F] animate-in slide-in-from-right duration-200 text-[#252B26] dark:text-[#E8F7EE]">
        
        {/* Header */}
        <div className="p-5 bg-white dark:bg-[#0E1C17] border-b border-[#E5EDE4] dark:border-[#1E3A2F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#173F35] dark:text-[#34D399]" />
            <h3 className="font-display font-bold text-lg text-[#173F35] dark:text-[#EDF7F1]">
              {checkoutStep === 'cart' && 'Your Direct Farm Order'}
              {checkoutStep === 'checkout' && 'Delivery Information'}
              {checkoutStep === 'confirmed' && 'Order Confirmed'}
            </h3>
          </div>
          <button
            onClick={checkoutStep === 'confirmed' ? handleReset : onClose}
            className="p-1.5 rounded-lg text-[#68766C] dark:text-[#88A89A] hover:text-[#173F35] dark:hover:text-[#34D399] hover:bg-[#FAF8F5] dark:hover:bg-[#18352A] transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {roleErrorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{roleErrorMessage}</span>
            </div>
          )}

          {checkoutStep === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E5EDE4] dark:bg-[#18352A] text-[#173F35] dark:text-[#34D399] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#173F35] dark:text-[#EDF7F1]">Your harvest bag is empty</h4>
                    <p className="text-xs text-[#68766C] dark:text-[#88A89A] mt-1 max-w-xs mx-auto">
                      Explore fresh seasonal harvests and direct farm produce to start an order.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#173F35] hover:bg-[#103028] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Browse Local Produce
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#68766C] dark:text-[#88A89A] pb-2 border-b border-[#E5EDE4] dark:border-[#1E3A2F]">
                    <span>Items from verified local family farms</span>
                    <button
                      onClick={onClearCart}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white dark:bg-[#11221C] p-3.5 rounded-2xl border border-[#E5EDE4] dark:border-[#1E3A2F] flex items-center gap-3 shadow-2xs"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#E5EDE4] dark:border-[#1E3A2F] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#173F35] dark:text-[#EDF7F1] truncate">
                            {item.product.name}
                          </h4>
                          <div className="text-[11px] text-[#39745A] dark:text-[#34D399] font-medium truncate">
                            {item.product.farmName}
                          </div>
                          <div className="text-xs font-bold text-[#173F35] dark:text-[#F3FAF6] mt-1 tabular-nums">
                            ETB {(item.product.price * item.quantity).toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-[#68766C] dark:text-[#7A9C8D]">
                              (ETB {item.product.price} / {item.product.unit})
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center border border-[#E5EDE4] dark:border-[#1E3A2F] rounded-lg overflow-hidden bg-[#FAF8F5] dark:bg-[#162D24]">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 text-[#68766C] dark:text-[#88A89A] hover:text-[#173F35] dark:hover:text-white cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-bold text-[#173F35] dark:text-white tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 text-[#68766C] dark:text-[#88A89A] hover:text-[#173F35] dark:hover:text-white cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-[10px] text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-0.5 cursor-pointer mt-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Location Note */}
                  <div className="p-3 bg-[#E5EDE4]/60 dark:bg-[#163327] rounded-xl text-xs text-[#173F35] dark:text-[#B6E0CC] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#39745A] dark:text-[#34D399] shrink-0" />
                    <span>
                      Routed via verified cold couriers in <strong className="font-semibold">{currentLocation.name}</strong>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {checkoutStep === 'checkout' && (
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              {orderError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#173F35] dark:text-[#EDF7F1] mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Abebech Tadesse"
                  className="w-full text-xs p-3 rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-white dark:bg-[#11221C] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-1 focus:ring-[#39745A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173F35] dark:text-[#EDF7F1] mb-1">
                  Delivery Street Address
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Bole Subcity, Woreda 03, House 412"
                  className="w-full text-xs p-3 rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-white dark:bg-[#11221C] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-1 focus:ring-[#39745A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173F35] dark:text-[#EDF7F1] mb-1">
                  Delivery Notes / Gate Code (Optional)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Call upon arrival at compound gate"
                  className="w-full text-xs p-3 rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] bg-white dark:bg-[#11221C] text-[#252B26] dark:text-[#F3FAF6] focus:outline-none focus:ring-1 focus:ring-[#39745A]"
                />
              </div>

              <div className="p-3 bg-white dark:bg-[#11221C] rounded-xl border border-[#E5EDE4] dark:border-[#1E3A2F] space-y-1.5 text-xs">
                <div className="font-semibold text-[#173F35] dark:text-[#EDF7F1] mb-1">Payment Method</div>
                <div className="flex items-center justify-between text-[#68766C] dark:text-[#88A89A]">
                  <span>Telebirr / CBE Birr Direct Escrow</span>
                  <span className="text-[#39745A] dark:text-[#34D399] font-semibold">Verified Escrow</span>
                </div>
              </div>
            </form>
          )}

          {checkoutStep === 'confirmed' && (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-[#E5EDE4] dark:bg-[#18352A] text-[#173F35] dark:text-[#34D399] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#39745A] dark:text-[#34D399]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#39745A] dark:text-[#34D399]">
                  Order Placed Successfully
                </span>
                <h4 className="font-display text-2xl font-bold text-[#173F35] dark:text-[#EDF7F1] mt-1">
                  Direct Harvest Reserved
                </h4>
                <p className="text-xs text-[#68766C] dark:text-[#88A89A] mt-1">
                  Reference: <strong className="font-mono text-[#173F35] dark:text-[#34D399]">{orderRef}</strong>
                </p>
              </div>

              <div className="bg-white dark:bg-[#11221C] p-4 rounded-2xl border border-[#E5EDE4] dark:border-[#1E3A2F] text-left space-y-2 text-xs">
                <div className="font-semibold text-[#173F35] dark:text-[#EDF7F1] pb-1 border-b border-[#E5EDE4] dark:border-[#1E3A2F]">
                  Dispatch Timeline:
                </div>
                <div className="flex items-center gap-2 text-[#252B26] dark:text-[#E8F7EE]">
                  <span className="w-2 h-2 rounded-full bg-[#39745A] dark:bg-[#34D399]" />
                  <span>Harvest packing scheduled at producer gate</span>
                </div>
                <div className="flex items-center gap-2 text-[#68766C] dark:text-[#88A89A]">
                  <span className="w-2 h-2 rounded-full bg-[#E5EDE4] dark:bg-[#1E3A2F]" />
                  <span>Proximity courier dispatch: Within 3 hours</span>
                </div>
                <div className="flex items-center gap-2 text-[#68766C] dark:text-[#88A89A]">
                  <span className="w-2 h-2 rounded-full bg-[#E5EDE4] dark:bg-[#1E3A2F]" />
                  <span>Doorstep delivery to: {deliveryAddress || 'Selected Address'}</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#173F35] dark:bg-[#10B981] hover:bg-[#103028] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Return to Marketplace
              </button>
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {checkoutStep !== 'confirmed' && items.length > 0 && (
          <div className="p-5 bg-white dark:bg-[#0E1C17] border-t border-[#E5EDE4] dark:border-[#1E3A2F] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#68766C] dark:text-[#88A89A]">
                <span>Produce Total (100% to farmers)</span>
                <span className="font-medium text-[#252B26] dark:text-[#EDF7F1] tabular-nums">ETB {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#68766C] dark:text-[#88A89A]">
                <span>Local Proximity Delivery Courier</span>
                <span className="font-medium text-[#252B26] dark:text-[#EDF7F1] tabular-nums">ETB {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#68766C] dark:text-[#88A89A]">
                <span>Platform Support & Cold Chain (5%)</span>
                <span className="font-medium text-[#252B26] dark:text-[#EDF7F1] tabular-nums">ETB {platformFee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5EDE4] dark:border-[#1E3A2F] flex justify-between font-bold text-[#173F35] dark:text-[#34D399] text-sm">
                <span>Total Amount</span>
                <span className="tabular-nums">ETB {total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button
                onClick={handleStartCheckout}
                className="w-full py-3 bg-[#173F35] hover:bg-[#103028] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <span>Proceed to Delivery Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="w-1/3 py-3 border border-[#E5EDE4] dark:border-[#1E3A2F] text-xs font-semibold text-[#173F35] dark:text-[#EDF7F1] rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#162D24] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isSubmittingOrder}
                  className="w-2/3 py-3 bg-[#173F35] dark:bg-[#10B981] hover:bg-[#103028] disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Place Direct Order</span>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#68766C] dark:text-[#88A89A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39745A] dark:text-[#34D399]" />
              <span>100% farm gate price guarantee</span>
            </div>
          </div>
        )}

      </div>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl="/dashboard/buyer?checkout=true"
      />
    </div>
  );
};
