import { Lock } from 'lucide-react';
import { SiteSettings } from '../data/pharmacyData';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
}

export function Footer({ settings, onOpenAdmin }: FooterProps) {
  const phoneLink = `tel:+966${settings.phoneDisplay.replace(/^0/, '')}`;
  const whatsappLink = `https://wa.me/${settings.whatsappIntl}?text=${encodeURIComponent(
    `السلام عليكم، أود التواصل مع ${settings.pharmacyName}.`
  )}`;

  return (
    <footer className="bg-white border-t border-[#DCE4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-base font-bold text-[#0B1B36]">
              {settings.pharmacyName}
            </p>
            <p className="mt-1 text-sm text-[#435570]">
              {settings.address} · خدمة متواصلة {settings.hoursLabel} ·{' '}
              <a
                href={phoneLink}
                className="font-semibold text-[#0B3C8A] hover:underline tabular-nums"
                dir="ltr"
              >
                {settings.phoneDisplay}
              </a>
              {' · '}
              <a
                href={`mailto:${settings.email}`}
                className="font-semibold text-[#0B3C8A] hover:underline"
                dir="ltr"
              >
                {settings.email}
              </a>
            </p>
          </div>

          <nav
            aria-label="روابط التذييل"
            className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#435570]"
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
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#15803D] font-semibold hover:underline underline-offset-4"
            >
              واتساب الصيدلية
            </a>
            <a
              href={settings.mapsUrl}
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
              {settings.commercialReg}
            </span>
          </div>
          <div className="flex flex-col sm:border-r sm:border-[#DCE4EF] sm:pr-4">
            <span className="text-xs text-[#435570]">رقم الترخيص</span>
            <span
              dir="ltr"
              className="mt-0.5 text-sm font-bold text-[#0B1B36] tabular-nums text-right"
            >
              {settings.licenseNumber}
            </span>
          </div>
          <div className="flex flex-col sm:border-r sm:border-[#DCE4EF] sm:pr-4">
            <span className="text-xs text-[#435570]">الرقم الضريبي</span>
            <span
              dir="ltr"
              className="mt-0.5 text-sm font-bold text-[#0B1B36] tabular-nums text-right"
            >
              {settings.vatNumber}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#DCE4EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#0B1B36]">
              إدارة الموقع والمتجر (قسم الأدمن)
            </p>
            <p className="mt-0.5 text-xs text-[#435570]">
              إضافة وتعديل وحذف المنتجات، وتحديث بيانات الصيدلية وأقسامها ومعرض الصور.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0B3C8A] hover:bg-[#092F6D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>الدخول إلى قسم الأدمن</span>
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-[#EEF3FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#435570]">
          <p>
            © {new Date().getFullYear()} {settings.pharmacyName}. جميع الحقوق محفوظة.
          </p>
          <p>المعلومات المقدمة إرشادية ولا تغني عن استشارة الطبيب المختص.</p>
        </div>
      </div>
    </footer>
  );
}
