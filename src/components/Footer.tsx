import {
  COMMERCIAL_REG_NUMBER,
  GOOGLE_MAPS_URL,
  PHARMACY_ADDRESS,
  PHARMACY_LICENSE_NUMBER,
  PHARMACY_PHONE_DISPLAY,
  PHARMACY_PHONE_LINK,
  PHARMACY_WHATSAPP_LINK,
  VAT_NUMBER,
} from '../data/pharmacyData';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#DCE4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold text-[#0B1B36]">
              صيدلية الرأفة للأدوية
            </p>
            <p className="mt-1 text-sm text-[#435570]">
              {PHARMACY_ADDRESS} · خدمة متواصلة ٢٤ ساعة ·{' '}
              <a
                href={PHARMACY_PHONE_LINK}
                className="font-semibold text-[#0B3C8A] hover:underline tabular-nums"
                dir="ltr"
              >
                {PHARMACY_PHONE_DISPLAY}
              </a>
            </p>
          </div>

          <nav
            aria-label="روابط التذييل"
            className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#435570]"
          >
            <a href="#store" className="hover:text-[#0B1B36] transition-colors">
              المتجر
            </a>
            <a href="#gallery" className="hover:text-[#0B1B36] transition-colors">
              معرض الصور
            </a>
            <a
              href="#departments"
              className="hover:text-[#0B1B36] transition-colors"
            >
              الأقسام
            </a>
            <a href="#services" className="hover:text-[#0B1B36] transition-colors">
              الخدمات
            </a>
            <a href="#faq" className="hover:text-[#0B1B36] transition-colors">
              الأسئلة الشائعة
            </a>
            <a
              href="#location"
              className="hover:text-[#0B1B36] transition-colors"
            >
              الموقع والدوام
            </a>
            <a
              href={PHARMACY_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#15803D] font-semibold hover:underline underline-offset-4"
            >
              واتساب الصيدلية
            </a>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0B3C8A] font-semibold hover:underline underline-offset-4"
            >
              خرائط قوقل
            </a>
          </nav>
        </div>

        <div className="mt-8 rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-[#435570]">رقم السجل التجاري</span>
            <span
              dir="ltr"
              className="mt-0.5 text-sm font-bold text-[#0B1B36] tabular-nums text-right"
            >
              {COMMERCIAL_REG_NUMBER}
            </span>
          </div>
          <div className="flex flex-col sm:border-r sm:border-[#DCE4EF] sm:pr-4">
            <span className="text-xs text-[#435570]">رقم الترخيص</span>
            <span
              dir="ltr"
              className="mt-0.5 text-sm font-bold text-[#0B1B36] tabular-nums text-right"
            >
              {PHARMACY_LICENSE_NUMBER}
            </span>
          </div>
          <div className="flex flex-col sm:border-r sm:border-[#DCE4EF] sm:pr-4">
            <span className="text-xs text-[#435570]">الرقم الضريبي</span>
            <span
              dir="ltr"
              className="mt-0.5 text-sm font-bold text-[#0B1B36] tabular-nums text-right"
            >
              {VAT_NUMBER}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#EEF3FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#435570]">
          <p>© {new Date().getFullYear()} صيدلية الرأفة للأدوية. جميع الحقوق محفوظة.</p>
          <p>المعلومات المقدمة إرشادية ولا تغني عن استشارة الطبيب المختص.</p>
        </div>
      </div>
    </footer>
  );
}
