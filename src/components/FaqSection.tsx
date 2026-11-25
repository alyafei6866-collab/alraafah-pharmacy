import { useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';
import { FaqItem } from '../data/pharmacyData';

interface FaqSectionProps {
  faqs: FaqItem[];
  phoneDisplay: string;
}

export function FaqSection({ faqs, phoneDisplay }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);
  const phoneLink = `tel:+966${phoneDisplay.replace(/^0/, '')}`;

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="py-14 sm:py-20 bg-[#F8FAFC] border-t border-[#DCE4EF]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Section Context */}
          <div className="lg:col-span-4">
            <p className="text-sm font-semibold text-[#0B3C8A] mb-2">
              إجابات واضحة ومباشرة
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0B1B36] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              الأسئلة الشائعة
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#435570] leading-relaxed">
              كل ما تحتاج معرفته عن ساعات الدوام المتواصلة، الطلب والتوصيل داخل
              تبوك، وطرق الدفع وصرف الوصفات الطبية.
            </p>

            <div className="mt-6 pt-6 border-t border-[#DCE4EF]">
              <p className="text-xs font-semibold text-[#435570] mb-2">
                هل لديك استفسار دوائي آخر؟
              </p>
              <a
                href={phoneLink}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>تواصل مع الصيدلي</span>
                <span dir="ltr" className="text-[#F4C400]">
                  {phoneDisplay}
                </span>
              </a>
            </div>
          </div>

          {/* Accordion List */}
          <div className="lg:col-span-8 divide-y divide-[#DCE4EF] border-y border-[#DCE4EF] bg-white rounded-2xl border-x px-5 sm:px-7">
            {faqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id}>
                  <h3>
                    <button
                      type="button"
                      id={`faq-btn-${item.id}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      onClick={() => toggleItem(item.id)}
                      className="w-full min-h-[56px] py-4 sm:py-5 flex items-center justify-between gap-4 text-right cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A]"
                    >
                      <span className="text-sm sm:text-base font-bold text-[#0B1B36] leading-snug">
                        {item.question}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`w-5 h-5 text-[#0B3C8A] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </h3>

                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    hidden={!isOpen}
                    className="pb-5 text-sm text-[#435570] leading-relaxed"
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
