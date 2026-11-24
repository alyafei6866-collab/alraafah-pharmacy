import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#store', label: 'المتجر' },
  { href: '#gallery', label: 'معرض الصور' },
  { href: '#departments', label: 'الأقسام' },
  { href: '#faq', label: 'الأسئلة الشائعة' },
  { href: '#location', label: 'الموقع والدوام' },
];

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export function Navbar({ cartCount, onOpenCart }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#DCE4EF]">
      <div className="h-1 bg-[#F4C400]" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#hero"
          className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-tight text-[#0B1B36] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B3C8A] rounded"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="1.5" y="1.5" width="23" height="23" rx="6" fill="#0B3C8A" />
            <path
              d="M13 7.5V18.5M7.5 13H18.5"
              stroke="#F4C400"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span>صيدلية الرأفة للأدوية</span>
        </a>

        {/* Zone 2: Clean Single-Line Nav Links (Desktop) */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#435570]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#0B3C8A] hover:underline underline-offset-8 decoration-[#F4C400] decoration-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B3C8A] rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action (Shopping Bag) + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-[#0B3C8A] hover:bg-[#072B66] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>السلة</span>
            <span className="tabular-nums text-xs font-bold bg-[#F4C400] text-[#071D42] px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[#DCE4EF] bg-white text-[#0B1B36] hover:bg-[#EEF3FA] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DCE4EF] bg-white px-4 py-4">
          <nav aria-label="قائمة الجوال" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium text-[#0B1B36] hover:bg-[#EEF3FA] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
