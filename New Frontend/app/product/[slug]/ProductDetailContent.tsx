'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Review } from '@/lib/types';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { getProductReviews } from '@/lib/services/products';

interface ProductDetailContentProps {
  product: Product;
}

export default function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showToast, setShowToast] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const images = product.images || [product.image];

  useEffect(() => {
    getProductReviews(product.id).then(setReviews);
  }, [product.id]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const currentPrice = selectedVariant
    ? product.variants?.find((v) => v.id === selectedVariant)?.price || product.price
    : product.price;

  return (
    <>
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/shop" className="text-gray-600 hover:text-[#B87333] flex items-center gap-2 whitespace-nowrap">
              <i className="ri-arrow-left-line w-5 h-5 flex items-center justify-center"></i>
              Back to Shop
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-[#B87333]' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {product.badge && (
                <span className="inline-block bg-[#B87333] text-white px-3 py-1 rounded-full text-sm font-medium mb-4 whitespace-nowrap">
                  {product.badge}
                </span>
              )}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`${
                        i < Math.floor(product.rating)
                          ? 'ri-star-fill text-yellow-400'
                          : 'ri-star-line text-gray-300'
                      } text-lg`}
                    ></i>
                  ))}
                </div>
                <span className="text-gray-600">{product.rating} ({product.reviewCount} reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Size</label>
                  <div className="flex gap-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-6 py-3 rounded-lg border-2 font-medium transition-colors whitespace-nowrap ${
                          selectedVariant === variant.id
                            ? 'border-[#B87333] bg-[#B87333] text-white'
                            : 'border-gray-300 hover:border-[#B87333]'
                        }`}
                      >
                        {variant.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center whitespace-nowrap"
                  >
                    <i className="ri-subtract-line w-5 h-5 flex items-center justify-center"></i>
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center whitespace-nowrap"
                  >
                    <i className="ri-add-line w-5 h-5 flex items-center justify-center"></i>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#2C3E50] text-white px-8 py-4 rounded-lg hover:bg-[#B87333] transition-colors font-semibold whitespace-nowrap"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlist}
                  className="w-14 h-14 border-2 border-gray-300 rounded-lg hover:border-[#B87333] flex items-center justify-center whitespace-nowrap"
                >
                  <i className={`${inWishlist ? 'ri-heart-fill text-red-500' : 'ri-heart-line'} text-2xl w-6 h-6 flex items-center justify-center`}></i>
                </button>
              </div>

              {product.features && product.features.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-700">
                        <i className="ri-check-line text-[#B87333] w-5 h-5 flex items-center justify-center"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material</span>
                    <span className="font-medium text-gray-900">{product.material}</span>
                  </div>
                )}
                {product.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size</span>
                    <span className="font-medium text-gray-900">{product.size}</span>
                  </div>
                )}
                {product.heatSource && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compatible With</span>
                    <span className="font-medium text-gray-900">{product.heatSource.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability</span>
                  <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="mt-20">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">{review.author}</span>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`${
                                i < review.rating
                                  ? 'ri-star-fill text-yellow-400'
                                  : 'ri-star-line text-gray-300'
                              } text-sm`}
                            ></i>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#2C3E50] text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <i className="ri-check-line text-xl w-6 h-6 flex items-center justify-center"></i>
          <span>Added to cart</span>
        </div>
      )}
    </>
  );
}
