import { useEffect, useState } from 'react';
import { CheckCircle2, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  PharmacyProduct,
  ProductCategory,
} from '../data/pharmacyData';
import { ResilientImage } from './ResilientImage';

export interface CartItem {
  product: PharmacyProduct;
  quantity: number;
}

interface StorefrontSectionProps {
  products: PharmacyProduct[];
  storeTitle: string;
  storeSubtitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cart: Record<string, number>;
  onAddToCart: (productId: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onOpenCart: () => void;
}

export function StorefrontSection({
  products,
  storeTitle,
  storeSubtitle,
  searchQuery,
  onSearchChange,
  cart,
  onAddToCart,
  onUpdateQty,
  onOpenCart,
}: StorefrontSectionProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>('الكل');
  const [activeProduct, setActiveProduct] = useState<PharmacyProduct | null>(
    null
  );

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'الكل' || product.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.shortNote.toLowerCase().includes(q) ||
      product.size.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (!activeProduct) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveProduct(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeProduct]);

  return (
    <section
      id="store"
      className="py-14 sm:py-20 bg-[#F8FAFC] border-b border-[#DCE4EF]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Storefront Header + Live Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-semibold text-[#0B3C8A] mb-2">
              المتجر الإلكتروني · استلام من الفرع أو توصيل داخل تبوك
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0B1B36] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {storeTitle}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#435570] max-w-2xl">
              {storeSubtitle}
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label htmlFor="store-search" className="sr-only">
              ابحث في منتجات المتجر
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-[#435570] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="store-search"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن بنادول، بروسبان، برونشيكير، فيفادول، بروفين..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2.5 text-sm rounded-xl border border-[#DCE4EF] bg-white text-[#0B1B36] placeholder:text-[#435570]/70 focus:border-[#0B3C8A] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Segmented Bar */}
        <div
          role="tablist"
          aria-label="تصنيفات المتجر"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#EEF3FA] rounded-xl border border-[#DCE4EF] mb-8"
        >
          {PRODUCT_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A] ${
                  isActive
                    ? 'bg-[#0B3C8A] text-white shadow-sm'
                    : 'text-[#435570] hover:text-[#0B1B36]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#DCE4EF] bg-white p-10 text-center">
            <p className="text-base font-bold text-[#0B1B36]">
              لم يتم العثور على منتجات مطابقة للبحث
            </p>
            <p className="mt-1 text-sm text-[#435570]">
              جرّب البحث بكلمة أخرى أو تصفح جميع التصنيفات المتاحة.
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setSelectedCategory('الكل');
              }}
              className="mt-4 inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-lg bg-[#0B3C8A] text-white text-sm font-semibold hover:bg-[#072B66] transition-colors cursor-pointer"
            >
              عرض جميع المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const qty = cart[product.id] || 0;
              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl border border-[#DCE4EF] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {/* Product Image (opens quick detail PDP modal) */}
                  <button
                    type="button"
                    onClick={() => setActiveProduct(product)}
                    className="relative w-full aspect-[4/3] bg-white border-b border-[#EEF3FA] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
                  >
                    <ResilientImage
                      src={product.imageSrc}
                      alt={product.imageAlt}
                      fallbackTitle={product.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  {/* Uniform Card Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#435570] mb-1.5">
                        <span className="font-semibold text-[#0B3C8A]">
                          {product.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{product.size}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="text-right w-full cursor-pointer"
                      >
                        <h3 className="text-base sm:text-lg font-bold text-[#0B1B36] leading-snug hover:text-[#0B3C8A] transition-colors">
                          {product.name}
                        </h3>
                      </button>

                      <p className="mt-1.5 text-xs sm:text-sm text-[#435570] line-clamp-2">
                        {product.shortNote}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#EEF3FA] flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-extrabold text-[#0B1B36] tabular-nums">
                            {Number.isInteger(product.price)
                              ? product.price
                              : product.price.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-[#435570]">
                            ر.س
                          </span>
                        </div>
                        {product.originalPrice && (
                          <div className="flex items-center gap-1.5 text-xs text-[#435570]">
                            <span className="line-through tabular-nums">
                              {product.originalPrice} ر.س
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#0B3C8A]">
                              خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}٪
                            </span>
                          </div>
                        )}
                      </div>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => onAddToCart(product.id)}
                          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
                        >
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          <span>أضف للسلة</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center border border-[#0B3C8A] rounded-xl bg-[#EEF3FA]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(product.id, -1)}
                              aria-label="إنقاص الكمية"
                              className="min-h-[40px] min-w-[36px] flex items-center justify-center text-[#0B3C8A] hover:bg-[#DCE6F5] rounded-r-xl transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-sm font-bold text-[#0B1B36] tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(product.id, 1)}
                              aria-label="زيادة الكمية"
                              className="min-h-[40px] min-w-[36px] flex items-center justify-center text-[#0B3C8A] hover:bg-[#DCE6F5] rounded-l-xl transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={onOpenCart}
                            className="min-h-[40px] px-2.5 rounded-xl bg-[#F4C400] hover:bg-[#E0B300] text-[#071D42] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            السلة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Quick-View Modal (PDP) */}
      {activeProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeProduct.name}
          className="fixed inset-0 z-50 bg-[#071D42]/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl border border-[#DCE4EF] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#DCE4EF]">
              <div className="text-xs sm:text-sm text-[#435570] flex items-center gap-2 truncate">
                <span className="font-semibold text-[#0B3C8A]">
                  {activeProduct.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{activeProduct.size}</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                aria-label="إغلاق تفاصيل المنتج"
                className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-[#DCE4EF] text-[#0B1B36] hover:bg-[#EEF3FA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-6 bg-white border-b md:border-b-0 md:border-l border-[#EEF3FA] aspect-[4/3] md:aspect-auto flex items-center justify-center p-4">
                <ResilientImage
                  src={activeProduct.imageSrc}
                  alt={activeProduct.imageAlt}
                  fallbackTitle={activeProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="md:col-span-6 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0B1B36]">
                    {activeProduct.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#0B3C8A] tabular-nums">
                        {Number.isInteger(activeProduct.price)
                          ? activeProduct.price
                          : activeProduct.price.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-[#435570]">
                        ر.س · شامل الضريبة
                      </span>
                    </div>
                    {activeProduct.originalPrice && (
                      <span className="text-sm text-[#435570] line-through tabular-nums">
                        {activeProduct.originalPrice} ر.س
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-[#435570] leading-relaxed">
                    {activeProduct.description}
                  </p>

                  <div className="mt-4 p-3.5 rounded-xl bg-[#EEF3FA] border border-[#DCE4EF]">
                    <p className="text-xs font-bold text-[#0B3C8A] mb-1">
                      إرشاد الصيدلي للاستخدام
                    </p>
                    <p className="text-xs sm:text-sm text-[#0B1B36] leading-relaxed">
                      {activeProduct.pharmacistTip}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#0B3C8A]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{activeProduct.stockNote} · جاهز خلال ١٥ دقيقة</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DCE4EF] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(activeProduct.id);
                      setActiveProduct(null);
                      onOpenCart();
                    }}
                    className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    أضف للسلة واطلب الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
