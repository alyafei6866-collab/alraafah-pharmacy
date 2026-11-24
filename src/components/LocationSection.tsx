import { useState } from 'react';
import { ArrowUpLeft, Check, Clock, Copy, MapPin, Phone } from 'lucide-react';
import {
  GOOGLE_MAPS_URL,
  PHARMACY_ADDRESS,
  PHARMACY_COORDS,
  PHARMACY_PHONE_DISPLAY,
  PHARMACY_PHONE_LINK,
  PHARMACY_WHATSAPP_LINK,
  WEEKLY_HOURS,
} from '../data/pharmacyData';
import { WhatsAppIcon } from './FloatingWhatsAppButton';

export function LocationSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_MAPS_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="location"
      className="py-14 sm:py-20 bg-[#071D42] text-white border-t border-[#143366]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Location & Direct Google Maps Card */}
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-[#F4C400] mb-2">
              الموقع وساعات العمل
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              زيارة صيدلية الرأفة للأدوية — تبوك
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
              نخدمكم في <strong className="text-white">{PHARMACY_ADDRESS}</strong>{' '}
              على مدار ٢٤ ساعة طوال أيام الأسبوع، مع مواقف مباشرة أمام واجهة
              الصيدلية.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#F4C400] shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {PHARMACY_ADDRESS}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-white/75 tabular-nums" dir="ltr">
                    {PHARMACY_COORDS}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#F4C400] shrink-0" />
                <a
                  href={PHARMACY_PHONE_LINK}
                  className="text-sm sm:text-base font-semibold text-white hover:text-[#F4C400] transition-colors tabular-nums"
                  dir="ltr"
                >
                  {PHARMACY_PHONE_DISPLAY}
                </a>
                <span className="text-xs text-white/70">· الاتصال المباشر بالصيدلية</span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F4C400] hover:bg-[#E0B300] text-[#071D42] text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>فتح الموقع في خرائط قوقل</span>
                  <ArrowUpLeft className="w-4 h-4 shrink-0" />
                </a>

                <a
                  href={PHARMACY_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>واتساب الصيدلية</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#F4C400] shrink-0" />
                      <span>تم نسخ رابط الموقع</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      <span>نسخ رابط الموقع</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 24/7 Weekly Schedule Table */}
          <div className="lg:col-span-6 rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/15">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#F4C400] shrink-0" />
                <h3 className="text-lg font-bold text-white">
                  جدول الدوام الأسبوعي
                </h3>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#F4C400] tabular-nums">
                ٢٤ ساعة يومياً
              </span>
            </div>

            <dl className="divide-y divide-white/10">
              {WEEKLY_HOURS.map((row) => (
                <div
                  key={row.day}
                  className="py-3.5 flex items-center justify-between gap-4 text-sm sm:text-base"
                >
                  <dt className="font-medium text-white">{row.day}</dt>
                  <dd className="text-white/85 font-medium tabular-nums">
                    {row.hours}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
