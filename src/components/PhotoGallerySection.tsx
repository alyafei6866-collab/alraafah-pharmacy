import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import {
  GALLERY_CATEGORIES,
  GalleryCategory,
  PharmacyPhotoCard,
} from '../data/pharmacyData';
import { ResilientImage } from './ResilientImage';

interface PhotoGallerySectionProps {
  gallery: PharmacyPhotoCard[];
}

export function PhotoGallerySection({ gallery }: PhotoGallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('الكل');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const filteredCards =
    selectedCategory === 'الكل'
      ? gallery
      : gallery.filter((card) => card.category === selectedCategory);

  const activeIndex = activeCardId
    ? filteredCards.findIndex((c) => c.id === activeCardId)
    : -1;
  const activeCard: PharmacyPhotoCard | null =
    activeIndex >= 0 ? filteredCards[activeIndex] : null;

  useEffect(() => {
    if (!activeCard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveCardId(null);
      } else if (event.key === 'ArrowLeft') {
        const nextIndex = (activeIndex + 1) % filteredCards.length;
        setActiveCardId(filteredCards[nextIndex].id);
      } else if (event.key === 'ArrowRight') {
        const prevIndex =
          (activeIndex - 1 + filteredCards.length) % filteredCards.length;
        setActiveCardId(filteredCards[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCard, activeIndex, filteredCards]);

  const handleNext = () => {
    if (filteredCards.length === 0) return;
    const nextIndex = (activeIndex + 1) % filteredCards.length;
    setActiveCardId(filteredCards[nextIndex].id);
  };

  const handlePrev = () => {
    if (filteredCards.length === 0) return;
    const prevIndex =
      (activeIndex - 1 + filteredCards.length) % filteredCards.length;
    setActiveCardId(filteredCards[prevIndex].id);
  };

  return (
    <section id="gallery" className="py-14 sm:py-20 bg-white border-b border-[#DCE4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <p className="text-sm font-semibold text-[#0B3C8A] mb-2">
              بطاقات الصور والأقسام
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0B1B36] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              صور صيدلية الرأفة للأدوية وأقسامها
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#435570] max-w-2xl">
              تصفح الواجهة الرسمية للصيدلية وأقسام الرعاية الدوائية المجهزة
              على مدار الساعة. اضغط على أي بطاقة لعرضها بالحجم الكامل.
            </p>
          </div>

          {/* Interactive Category Tabs */}
          <div
            role="tablist"
            aria-label="تصفية صور الصيدلية"
            className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#EEF3FA] rounded-xl border border-[#DCE4EF] self-start lg:self-auto"
          >
            {GALLERY_CATEGORIES.map((category) => {
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
        </div>

        {/* Photo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            return (
              <article
                key={card.id}
                className="group bg-white rounded-2xl border border-[#DCE4EF] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => setActiveCardId(card.id)}
                  className="text-right flex flex-col h-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
                >
                  <div className="relative w-full overflow-hidden bg-[#EEF3FA] aspect-[4/3]">
                    <ResilientImage
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fallbackTitle={card.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="sr-only">تكبير الصورة</span>
                    <div
                      aria-hidden="true"
                      className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-white/95 text-[#0B1B36] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#435570] mb-2">
                        <span className="font-semibold text-[#0B3C8A]">
                          {card.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{card.subtitle}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#0B1B36] leading-snug">
                        {card.title}
                      </h3>

                      <p className="mt-2 text-sm text-[#435570] leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EEF3FA] flex items-center justify-between text-xs font-semibold text-[#0B3C8A]">
                      <span>عرض البطاقة بالحجم الكامل</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeCard.title}
          className="fixed inset-0 z-50 bg-[#071D42]/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveCardId(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden border border-[#DCE4EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#DCE4EF]">
              <div className="text-xs sm:text-sm text-[#435570] flex items-center gap-2 truncate">
                <span className="font-semibold text-[#0B3C8A]">
                  {activeCard.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{activeCard.subtitle}</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveCardId(null)}
                aria-label="إغلاق العرض"
                className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-[#DCE4EF] text-[#0B1B36] hover:bg-[#EEF3FA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-[#071D42] aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
              <ResilientImage
                src={activeCard.imageSrc}
                alt={activeCard.imageAlt}
                fallbackTitle={activeCard.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0B1B36]">
                  {activeCard.title}
                </h3>
                <p className="mt-1.5 text-sm text-[#435570] leading-relaxed max-w-2xl">
                  {activeCard.description}
                </p>
              </div>

              {filteredCards.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="الصورة السابقة"
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[#DCE4EF] bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[#0B1B36] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-medium text-[#435570] tabular-nums px-2">
                    {activeIndex + 1} / {filteredCards.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="الصورة التالية"
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[#DCE4EF] bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[#0B1B36] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
