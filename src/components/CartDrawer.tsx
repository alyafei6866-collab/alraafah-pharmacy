import { FormEvent, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  PHARMACY_ADDRESS,
  PHARMACY_PHONE_DISPLAY,
  PHARMACY_WHATSAPP_INTL,
  STORE_PRODUCTS,
} from '../data/pharmacyData';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  onUpdateQty: (productId: string, delta: number) => void;
  onClearCart: () => void;
}

type FulfillmentMethod = 'delivery' | 'pickup';
type PaymentMethod = 'الدفع عند الاستلام' | 'شبكة مدى' | 'Apple Pay';

const FREE_DELIVERY_THRESHOLD = 150;
const DELIVERY_FEE = 15;

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onClearCart,
}: CartDrawerProps) {
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('delivery');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('الدفع عند الاستلام');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    total: number;
    method: FulfillmentMethod;
    payment: PaymentMethod;
    whatsappUrl: string;
    messageText: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cartItems = STORE_PRODUCTS.filter((p) => (cart[p.id] || 0) > 0).map(
    (product) => ({
      product,
      quantity: cart[product.id],
    })
  );

  const subtotal = Number(
    cartItems
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      .toFixed(2)
  );

  const deliveryCost =
    fulfillment === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0
      ? 0
      : DELIVERY_FEE;

  const total = Number((subtotal + deliveryCost).toFixed(2));
  const remainingForFreeDelivery = Number(
    Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)
  );

  const handleCheckout = (e: FormEvent) => {
    e.preventDefault();
    if (customerName.trim().length < 2) {
      setFormError('يرجى إدخال الاسم الكامل.');
      return;
    }
    const cleanPhone = customerPhone.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
      setFormError('يرجى إدخال رقم جوال صحيح.');
      return;
    }
    if (fulfillment === 'delivery' && district.trim().length < 3) {
      setFormError('يرجى كتابة اسم الحي والعنوان داخل تبوك للتوصيل.');
      return;
    }

    setFormError(null);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `RF-${randomNum}`;

    const itemsLines = cartItems
      .map(({ product, quantity }) => {
        const lineTotal = Number((product.price * quantity).toFixed(2));
        return `• ${product.name} (${product.size}) × ${quantity} = ${lineTotal} ر.س`;
      })
      .join('\n');

    const fulfillmentLabel =
      fulfillment === 'pickup'
        ? `استلام من الفرع خلال ١٥ دقيقة (${PHARMACY_ADDRESS})`
        : `توصيل داخل تبوك - ${district.trim()}`;

    const deliveryLabel = deliveryCost === 0 ? 'مجاني' : `${deliveryCost} ر.س`;

    const messageText = [
      '*طلب شراء جديد — صيدلية الرأفة للأدوية*',
      `رقم الطلب: ${orderId}`,
      '',
      '*بيانات العميل:*',
      `الاسم: ${customerName.trim()}`,
      `رقم الجوال: ${customerPhone.trim()}`,
      `طريقة الاستلام: ${fulfillmentLabel}`,
      `طريقة الدفع: ${paymentMethod}`,
      '',
      '*المنتجات المطلوبة:*',
      itemsLines,
      '',
      `المجموع الفرعي: ${subtotal} ر.س`,
      `${fulfillment === 'pickup' ? 'الاستلام من الفرع' : 'رسوم التوصيل'}: ${deliveryLabel}`,
      `*الإجمالي النهائي: ${total} ر.س*`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${PHARMACY_WHATSAPP_INTL}?text=${encodeURIComponent(
      messageText
    )}`;

    setCopiedOrder(false);
    setConfirmedOrder({
      orderId,
      total,
      method: fulfillment,
      payment: paymentMethod,
      whatsappUrl,
      messageText,
    });
    onClearCart();

    // Open WhatsApp in a new tab via a user-gesture-triggered anchor element
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyOrder = async () => {
    if (!confirmedOrder) return;
    try {
      await navigator.clipboard.writeText(confirmedOrder.messageText);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2500);
    } catch {
      // Clipboard API unavailable in restricted context
    }
  };

  const handleNewOrder = () => {
    setConfirmedOrder(null);
    setCopiedOrder(false);
    setCustomerName('');
    setCustomerPhone('');
    setDistrict('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
      className="fixed inset-0 z-50 bg-[#071D42]/70 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col border-r border-[#DCE4EF] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#DCE4EF] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#0B3C8A]" />
            <h2 className="text-lg font-bold text-[#0B1B36]">سلة المشتريات</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السلة"
            className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-[#DCE4EF] text-[#0B1B36] hover:bg-[#EEF3FA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {confirmedOrder ? (
            <div className="rounded-2xl border border-[#DCE4EF] bg-[#EEF3FA] p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#0B3C8A] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-[#0B1B36]">
                    تم تأكيد طلبك وتجهيزه للإرسال عبر واتساب
                  </h3>
                  <p className="mt-1.5 text-sm text-[#435570] leading-relaxed">
                    رقم الطلب:{' '}
                    <span className="font-bold text-[#0B1B36] tabular-nums">
                      {confirmedOrder.orderId}
                    </span>
                    <br />
                    الإجمالي:{' '}
                    <span className="font-bold text-[#0B3C8A] tabular-nums">
                      {confirmedOrder.total} ر.س
                    </span>{' '}
                    ({confirmedOrder.payment})
                    <br />
                    {confirmedOrder.method === 'pickup'
                      ? `جاهز للاستلام خلال ١٥ دقيقة من فرعنا (${PHARMACY_ADDRESS}).`
                      : 'سيتم تجهيز طلبك وتوصيله إليك داخل تبوك فور استلام الرسالة على واتساب.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <a
                  href={confirmedOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>
                    إرسال الطلب عبر واتساب (
                    <span dir="ltr" className="tabular-nums">
                      {PHARMACY_PHONE_DISPLAY}
                    </span>
                    )
                  </span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyOrder}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#DCE4EF] text-[#0B1B36] text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedOrder ? (
                    <>
                      <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>تم نسخ تفاصيل الطلب</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#435570] shrink-0" />
                      <span>نسخ تفاصيل الطلب</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNewOrder}
                  className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  العودة للمتجر
                </button>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-[#435570]/50 mx-auto mb-3" />
              <p className="text-base font-bold text-[#0B1B36]">
                سلة المشتريات فارغة
              </p>
              <p className="mt-1 text-sm text-[#435570]">
                أضف المنتجات من المتجر لبدء الطلب والتوصيل أو الاستلام السريع.
              </p>
            </div>
          ) : (
            <>
              {/* Free Delivery Progress */}
              {fulfillment === 'delivery' && (
                <div className="p-3.5 rounded-xl bg-[#EEF3FA] border border-[#DCE4EF] text-xs sm:text-sm text-[#0B1B36]">
                  {remainingForFreeDelivery > 0 ? (
                    <span>
                      أضف منتجات بقيمة{' '}
                      <strong className="text-[#0B3C8A] tabular-nums">
                        {remainingForFreeDelivery} ر.س
                      </strong>{' '}
                      للحصول على توصيل مجاني داخل تبوك.
                    </span>
                  ) : (
                    <span className="font-semibold text-[#0B3C8A]">
                      تم تفعيل التوصيل المجاني داخل تبوك لهذا الطلب.
                    </span>
                  )}
                </div>
              )}

              {/* Itemized Cart List */}
              <ul className="divide-y divide-[#DCE4EF] border-y border-[#DCE4EF]">
                {cartItems.map(({ product, quantity }) => (
                  <li key={product.id} className="py-4 flex gap-3.5">
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-white border border-[#DCE4EF] shrink-0 p-1">
                      <ResilientImage
                        src={product.imageSrc}
                        alt={product.imageAlt}
                        fallbackTitle={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#0B1B36] leading-snug">
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, -quantity)}
                          aria-label={`حذف ${product.name}`}
                          className="text-[#435570] hover:text-red-700 p-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center border border-[#DCE4EF] rounded-lg bg-[#F8FAFC]">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label="إنقاص الكمية"
                            className="min-h-[34px] min-w-[32px] flex items-center justify-center text-[#0B1B36] hover:bg-[#EEF3FA] rounded-r-lg cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-bold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            aria-label="زيادة الكمية"
                            className="min-h-[34px] min-w-[32px] flex items-center justify-center text-[#0B1B36] hover:bg-[#EEF3FA] rounded-l-lg cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-[#0B3C8A] tabular-nums">
                          {Number((product.price * quantity).toFixed(2))} ر.س
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Fulfillment Mode */}
              <div>
                <span className="block text-xs font-bold text-[#0B1B36] mb-2">
                  طريقة الاستلام
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillment('delivery')}
                    className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      fulfillment === 'delivery'
                        ? 'bg-[#071D42] text-white border-[#071D42]'
                        : 'bg-[#F8FAFC] text-[#435570] border-[#DCE4EF]'
                    }`}
                  >
                    توصيل داخل تبوك
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment('pickup')}
                    className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      fulfillment === 'pickup'
                        ? 'bg-[#071D42] text-white border-[#071D42]'
                        : 'bg-[#F8FAFC] text-[#435570] border-[#DCE4EF]'
                    }`}
                  >
                    استلام من الفرع (١٥ د)
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <span className="block text-xs font-bold text-[#0B1B36] mb-2">
                  طريقة الدفع
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'الدفع عند الاستلام',
                      'شبكة مدى',
                      'Apple Pay',
                    ] as PaymentMethod[]
                  ).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`min-h-[40px] px-2 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#0B3C8A] text-white border-[#0B3C8A]'
                          : 'bg-[#F8FAFC] text-[#435570] border-[#DCE4EF]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Checkout Fields */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-bold text-[#0B1B36] mb-1"
                  >
                    الاسم الكامل
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="الاسم الثلاثي"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-bold text-[#0B1B36] mb-1"
                  >
                    رقم الجوال
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm text-right rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                  />
                </div>

                {fulfillment === 'delivery' && (
                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-bold text-[#0B1B36] mb-1"
                    >
                      الحي والعنوان في تبوك
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="مثال: حي الروضة، شارع المتنبي"
                      className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>
                )}

                {formError && (
                  <p role="alert" className="text-xs font-medium text-red-700">
                    {formError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        {/* Sticky Drawer Footer Summary */}
        {!confirmedOrder && cartItems.length > 0 && (
          <div className="p-5 border-t border-[#DCE4EF] bg-[#F8FAFC] space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#435570]">
                <span>المجموع الفرعي</span>
                <span className="font-semibold text-[#0B1B36] tabular-nums">
                  {subtotal} ر.س
                </span>
              </div>
              <div className="flex justify-between text-[#435570]">
                <span>
                  {fulfillment === 'pickup' ? 'الاستلام من الفرع' : 'رسوم التوصيل'}
                </span>
                <span className="font-semibold text-[#0B1B36] tabular-nums">
                  {deliveryCost === 0 ? 'مجاني' : `${deliveryCost} ر.س`}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE4EF] flex justify-between text-base font-bold text-[#0B1B36]">
                <span>الإجمالي</span>
                <span className="text-[#0B3C8A] tabular-nums">{total} ر.س</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>تأكيد وإرسال الطلب عبر واتساب</span>
            </button>
            <p className="text-[11px] text-center text-[#435570]">
              سيتم إرسال تفاصيل الطلب مباشرة إلى واتساب الصيدلية{' '}
              <span dir="ltr" className="font-semibold text-[#0B1B36] tabular-nums">
                {PHARMACY_PHONE_DISPLAY}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
