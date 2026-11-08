'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4 w-16 h-16 flex items-center justify-center mx-auto"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/shop"
              className="inline-block bg-[#2C3E50] text-white px-8 py-3 rounded-lg hover:bg-[#B87333] transition-colors whitespace-nowrap"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const variant = item.variantId
                ? item.product.variants?.find((v) => v.id === item.variantId)
                : null;
              const price = variant?.price || item.product.price;

              return (
                <div key={`${item.product.id}-${item.variantId || 'default'}`} className="bg-white rounded-lg p-6 flex gap-6">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover object-top rounded-lg"
                  />
                  <div className="flex-1">
                    <Link href={`/product/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-[#B87333] mb-2 block">
                      {item.product.name}
                    </Link>
                    {variant && (
                      <p className="text-sm text-gray-600 mb-2">Size: {variant.size}</p>
                    )}
                    <p className="text-lg font-bold text-gray-900">${price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.product.id, item.variantId)}
                      className="text-gray-400 hover:text-red-500 w-6 h-6 flex items-center justify-center whitespace-nowrap"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center whitespace-nowrap"
                      >
                        <i className="ri-subtract-line w-4 h-4 flex items-center justify-center"></i>
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center whitespace-nowrap"
                      >
                        <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{totalPrice >= 150 ? 'FREE' : '$9.99'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${(totalPrice + (totalPrice >= 150 ? 0 : 9.99)).toFixed(2)}</span>
                </div>
              </div>

              {totalPrice < 150 && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-6">
                  Add ${(150 - totalPrice).toFixed(2)} more for free shipping!
                </div>
              )}

              <Link
                href="/checkout"
                className="block w-full bg-[#2C3E50] text-white text-center px-8 py-4 rounded-lg hover:bg-[#B87333] transition-colors font-semibold mb-4 whitespace-nowrap"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="block w-full text-center text-[#B87333] hover:text-[#2C3E50] font-semibold whitespace-nowrap"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
