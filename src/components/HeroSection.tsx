import { FormEvent } from 'react';
import { ArrowUpLeft, MapPin, Phone, Search } from 'lucide-react';
import { SiteSettings } from '../data/pharmacyData';
import { WhatsAppIcon } from './FloatingWhatsAppButton';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  settings: SiteSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function HeroSection({
  settings,
  searchQuery,
  onSearchChange,
}: HeroSectionProps) {
  const phoneDigits = settings.phoneDisplay.replace(/^0/, '');
  const phoneLink = `tel:+966${phoneDigits}`;
  const whatsappLink = `https://wa.me/${settings.whatsappIntl}?text=${encodeURIComponent(
    `السلام عليكم، أود التواصل مع ${settings.pharmacyName}.`
  )}`;

  const heroStandards = [
    {
      value: '٢٤ / ٧',
      label: 'خدمة متواصلة يومياً',
      detail: 'دون انقطاع طوال الأسبوع',
    },
    {
      value: '١٥ دقيقة',
      label: 'استلام فوري من الفرع',
      detail: 'تجهيز الطلبات قبل الوصول',
    },
    {
      value: 'توصيل سريع',
      label: 'داخل مدينة تبوك',
      detail: `مجاني للطلبات من ${settings.freeDeliveryThreshold} ر.س`,
    },
    {
      value: 'مدى · Apple Pay',
      label: 'خيارات دفع مرنة',
      detail: 'أو الدفع عند الاستلام',
    },
  ];

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    const storeEl = document.getElementById('store');
    storeEl?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="border-b border-[#DCE4EF] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 lg:pt-12 lg:pb-14">
        {/* 2-Column Balanced Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Storefront & Clinical Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2 lg:py-3">
            <div>
              <p className="text-sm font-semibold text-[#0B3C8A] mb-3">
                {settings.heroEyebrow}
              </p>

              <h1
                className="text-[#0B1B36] font-extrabold tracking-tight leading-[1.2] max-w-xl"
                style={{
                  fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
                  textWrap: 'balance',
                }}
              >
                {settings.heroTitle}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#435570] leading-relaxed max-w-xl">
                {settings.heroSubtitle}
              </p>

              {/* Storefront Hero Quick Search */}
              <form
                onSubmit={handleHeroSearch}
                className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl"
              >
                <div className="relative flex-1">
                  <label htmlFor="hero-store-search" className="sr-only">
                    ابحث في المتجر
                  </label>
                  <Search
                    aria-hidden="true"
                    className="w-4 h-4 text-[#435570] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    id="hero-store-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ابحث عن حليب هيومانا، غسول بيودرما، بنادول، سنسوداين..."
                    className="w-full min-h-[46px] pr-10 pl-4 py-2.5 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] text-[#0B1B36] placeholder:text-[#435570]/75 focus:bg-white focus:border-[#0B3C8A] focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  بحث في المتجر
                </button>
              </form>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#store"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-[#071D42] hover:bg-[#0B3C8A] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                تصفح المنتجات الآن
              </a>

              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[#0B1B36] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <MapPin className="w-4 h-4 text-[#0B3C8A] shrink-0" />
                <span>خرائط قوقل</span>
                <ArrowUpLeft className="w-4 h-4 text-[#435570] shrink-0" />
              </a>

              <a
                href={phoneLink}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#F4C400] bg-[#F4C400]/20 hover:bg-[#F4C400]/35 text-[#0B1B36] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums"
              >
                <Phone className="w-4 h-4 text-[#0B3C8A] shrink-0" />
                <span dir="ltr">{settings.phoneDisplay}</span>
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>واتساب مباشر</span>
              </a>
            </div>
          </div>

          {/* Dominant Visual Carrier — Clean Enhanced Storefront */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-[#DCE4EF] bg-[#071D42]">
              <ResilientImage
                src={settings.heroImageSrc}
                alt={`الواجهة الرئيسية لـ ${settings.pharmacyName}`}
                fallbackTitle={settings.pharmacyName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071D42]/95 via-[#071D42]/55 to-transparent p-5 sm:p-6">
                <p className="text-sm font-bold text-[#F4C400]">
                  {settings.pharmacyName}
                </p>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                  {settings.address} · خدمة متواصلة {settings.hoursLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Service Standards Strip */}
        <div className="mt-10 pt-8 border-t border-[#DCE4EF] grid grid-cols-2 lg:grid-cols-4 gap-6">
          {heroStandards.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-[#0B3C8A] tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 text-sm sm:text-base font-semibold text-[#0B1B36]">
                {item.label}
              </span>
              <span className="mt-0.5 text-xs sm:text-sm text-[#435570]">
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
