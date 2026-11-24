import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DEPARTMENTS, PharmacyDepartment } from '../data/pharmacyData';

export function DepartmentsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(DEPARTMENTS[0].id);

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return DEPARTMENTS;
    return DEPARTMENTS.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.summary.toLowerCase().includes(query) ||
        dept.items.some((item) => item.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const activeDepartment: PharmacyDepartment | undefined =
    filteredDepartments.find((d) => d.id === selectedId) ??
    filteredDepartments[0];

  return (
    <section
      id="departments"
      className="py-14 sm:py-20 bg-[#F8FAFC] border-b border-[#DCE4EF]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-semibold text-[#0B3C8A] mb-2">
              التغطية الدوائية والصحية
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0B1B36] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              الأقسام المتوفرة في صيدلية الرأفة
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#435570] max-w-2xl">
              اختر القسم أو ابحث عن الفئة الدوائية للاطلاع على الأصناف المتوفرة
              وإرشادات الصيدلي المختص.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80">
            <label htmlFor="department-search" className="sr-only">
              ابحث في الأقسام أو المستلزمات
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-[#435570] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="department-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن قسم أو صنف طبي..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2.5 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] text-[#0B1B36] placeholder:text-[#435570]/70 focus:bg-white focus:border-[#0B3C8A] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFC] p-8 text-center">
            <p className="text-base font-semibold text-[#0B1B36]">
              لا توجد أقسام مطابقة لعبارة البحث "{searchQuery}"
            </p>
            <p className="mt-1 text-sm text-[#435570]">
              يمكنك مسح البحث أو إرسال استفسار مباشر للصيدلي في النموذج أدناه.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-lg bg-[#0B3C8A] text-white text-sm font-medium hover:bg-[#072B66] transition-colors cursor-pointer"
            >
              عرض جميع الأقسام
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Department Index List */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {filteredDepartments.map((dept) => {
                const isSelected = activeDepartment?.id === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedId(dept.id)}
                    className={`w-full text-right p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C8A] ${
                      isSelected
                        ? 'bg-[#071D42] text-white border-[#071D42]'
                        : 'bg-[#F8FAFC] text-[#0B1B36] border-[#DCE4EF] hover:bg-[#EEF3FA]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-base font-bold">{dept.name}</span>
                      <span
                        className={`text-xs font-semibold tabular-nums shrink-0 ${
                          isSelected ? 'text-[#F4C400]' : 'text-[#0B3C8A]'
                        }`}
                      >
                        {dept.index}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xs sm:text-sm line-clamp-2 ${
                        isSelected ? 'text-white/80' : 'text-[#435570]'
                      }`}
                    >
                      {dept.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Department Details Panel */}
            {activeDepartment && (
              <div className="lg:col-span-7 rounded-2xl border border-[#DCE4EF] bg-[#F8FAFC] p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B3C8A] mb-2">
                  <span className="tabular-nums">قسم {activeDepartment.index}</span>
                  <span aria-hidden="true">·</span>
                  <span>متوفر ٢٤ ساعة</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-[#0B1B36]">
                  {activeDepartment.name}
                </h3>

                <p className="mt-2.5 text-sm sm:text-base text-[#435570] leading-relaxed">
                  {activeDepartment.summary}
                </p>

                <div className="mt-6 pt-6 border-t border-[#DCE4EF]">
                  <h4 className="text-sm font-bold text-[#0B1B36] mb-4">
                    أبرز الفئات والأصناف المتوفرة
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDepartment.items.map((item) => (
                      <li
                        key={item}
                        className="p-3.5 rounded-xl bg-white border border-[#DCE4EF] text-sm font-medium text-[#0B1B36]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-6 border-t border-[#DCE4EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs sm:text-sm text-[#435570] leading-relaxed max-w-xl">
                    <span className="font-semibold text-[#0B1B36]">
                      توجيه الصيدلي:{' '}
                    </span>
                    {activeDepartment.guidance}
                  </p>

                  <a
                    href="tel:+966509563821"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    اتصل للاستفسار
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
