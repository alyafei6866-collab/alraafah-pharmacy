import { CLINICAL_SERVICES } from '../data/pharmacyData';

export function ServicesAndConsultation() {
  return (
    <section id="services" className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#0B3C8A] mb-2">
            منهجية الرعاية الصيدلانية
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#0B1B36] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            خدماتنا على مدار ٢٤ ساعة
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#435570] leading-relaxed">
            نلتزم بتقديم خدمة صيدلانية سريعة ومنضبطة في جميع الأوقات، مع مراعاة
            الدقة الدوائية وسرية بيانات المراجع.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 border-t border-[#DCE4EF]">
          {CLINICAL_SERVICES.map((service) => (
            <div
              key={service.number}
              className="py-6 sm:py-7 border-b border-[#DCE4EF]"
            >
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-[#0B1B36]">
                  <span className="text-[#0B3C8A] tabular-nums ml-2">
                    {service.number}.
                  </span>
                  {service.title}
                </h3>
                <span className="text-xs font-medium text-[#435570] whitespace-nowrap shrink-0 tabular-nums">
                  {service.metric}
                </span>
              </div>
              <p className="text-sm text-[#435570] leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
