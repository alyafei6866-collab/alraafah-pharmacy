import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Edit3,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  GalleryCategory,
  PHARMACY_EMAIL,
  ProductCategory,
  SiteSettings,
} from '../data/pharmacyData';
import {
  ADMIN_EMAILS,
  FIREBASE_PROJECT_ID,
  auth,
  googleProvider,
  isSafeUrl,
  storage,
} from '../firebase';
import {
  FirestoreDepartment,
  FirestoreFaq,
  FirestoreGalleryPhoto,
  FirestoreProduct,
  PharmacyCmsState,
  deleteDepartment,
  deleteFaq,
  deleteGalleryPhoto,
  deleteProduct,
  saveDepartment,
  saveFaq,
  saveGalleryPhoto,
  saveProduct,
  saveSiteSettings,
  seedDefaultsToFirestore,
} from '../hooks/usePharmacyStore';
import { ResilientImage } from './ResilientImage';

type AdminTab = 'products' | 'settings' | 'gallery' | 'departments' | 'faqs';

const PRODUCT_CATEGORY_OPTIONS: Exclude<ProductCategory, 'الكل'>[] = [
  'الأدوية بدون وصفة',
  'شرابات الكحة',
  'الفيتامينات والمناعة',
  'الأم والطفل',
  'العناية بالبشرة',
  'العناية اليومية',
  'العناية بالشعر',
];

const GALLERY_CATEGORY_OPTIONS: Exclude<GalleryCategory, 'الكل'>[] = [
  'الواجهة الخارجية',
  'داخل الصيدلية',
  'الأم والطفل',
];

interface AdminPanelProps {
  cms: PharmacyCmsState;
  onExitAdmin: () => void;
}

async function compressImageToJpegBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('تعذر معالجة الصورة.'));
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('تعذر ضغط الصورة.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.84
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('الملف المختار ليس صورة صالحة.'));
    };
    img.src = objectUrl;
  });
}

async function uploadImageToFirebaseStorage(
  file: File,
  folder: string
): Promise<string> {
  const blob = await compressImageToJpegBlob(file);
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40) || 'image';
  const storageRef = ref(storage, `${folder}/${Date.now()}_${safeBase}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export function AdminPanel({ cms, onExitAdmin }: AdminPanelProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [authTick, setAuthTick] = useState(0);

  // Login form state (no credentials hardcoded)
  const [loginEmail, setLoginEmail] = useState(PHARMACY_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);

  // Admin workspace state
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<FirestoreProduct | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: PRODUCT_CATEGORY_OPTIONS[0],
    size: '',
    price: '',
    originalPrice: '',
    imageSrc: '',
    imageAlt: '',
    shortNote: '',
    description: '',
    pharmacistTip: '',
    stockNote: 'متوفر في فرع حي الروضة',
    sortOrder: '1',
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(cms.settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Gallery editor state
  const [editingGallery, setEditingGallery] = useState<FirestoreGalleryPhoto | null>(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [confirmDeleteGalleryId, setConfirmDeleteGalleryId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: GALLERY_CATEGORY_OPTIONS[0],
    subtitle: '',
    description: '',
    imageSrc: '',
    imageAlt: '',
    aspectClass: 'aspect-[4/3]',
    featured: false,
    sortOrder: '1',
  });
  const [savingGallery, setSavingGallery] = useState(false);

  // Department editor state
  const [editingDept, setEditingDept] = useState<FirestoreDepartment | null>(null);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [confirmDeleteDeptId, setConfirmDeleteDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    index: '01',
    name: '',
    summary: '',
    guidance: '',
    itemsText: '',
    sortOrder: '1',
  });
  const [savingDept, setSavingDept] = useState(false);

  // FAQ editor state
  const [editingFaq, setEditingFaq] = useState<FirestoreFaq | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [confirmDeleteFaqId, setConfirmDeleteFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    sortOrder: '1',
  });
  const [savingFaq, setSavingFaq] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, [authTick]);

  useEffect(() => {
    setSettingsForm(cms.settings);
  }, [cms.settings]);

  const userEmail = user?.email?.toLowerCase() || '';
  const isAllowlistedEmail = ADMIN_EMAILS.includes(userEmail);
  const isVerifiedAdmin = Boolean(user && isAllowlistedEmail && user.emailVerified);

  // Auto-seed defaults on first verified admin visit or add newly added products
  const hasNewMedicinesInCloud = cms.products.some((p) => p.id.startsWith('med-'));
  const hasCoughSyrupsInCloud = cms.products.some((p) => p.id.startsWith('cough-'));
  const hasStaleMedImages = cms.products.some(
    (p) => typeof p.imageSrc === 'string' && p.imageSrc.startsWith('/src/assets/images/med_')
  );
  useEffect(() => {
    if (
      !isVerifiedAdmin ||
      cms.loading ||
      (cms.hasCloudData &&
        hasNewMedicinesInCloud &&
        hasCoughSyrupsInCloud &&
        !hasStaleMedImages)
    ) {
      return;
    }
    let active = true;
    setSeeding(true);
    seedDefaultsToFirestore(false)
      .then((didSeed) => {
        if (active && didSeed) {
          setStatusMessage({
            type: 'success',
            text: 'تمت مزامنة قاعدة البيانات السحابية وإضافة المنتجات وتحديث الصور من النهدي بنجاح.',
          });
        }
      })
      .catch(() => {
        // Error surfaced by user-triggered actions if permissions are still propagating
      })
      .finally(() => {
        if (active) setSeeding(false);
      });
    return () => {
      active = false;
    };
  }, [
    isVerifiedAdmin,
    cms.loading,
    cms.hasCloudData,
    hasNewMedicinesInCloud,
    hasCoughSyrupsInCloud,
    hasStaleMedImages,
  ]);

  const notify = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEmailPasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setShowConsoleHelp(false);
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginPassword('');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setShowConsoleHelp(true);
        setAuthError(
          'مزود تسجيل الدخول بالبريد وكلمة المرور غير مفعّل بعد في Firebase Console. فعّل Email/Password وأضف المستخدم من الروابط أدناه، أو ادخل فوراً بحساب Google.'
        );
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        setShowConsoleHelp(true);
        setAuthError(
          'بيانات الدخول غير مطابقة أو لم تتم إضافة الحساب في Firebase Authentication بعد. أضفه من Firebase Console أدناه أو ادخل مباشرة بحساب Google.'
        );
      } else if (code === 'auth/too-many-requests') {
        setAuthError('تم تجاوز عدد المحاولات المسموحة مؤقتاً. يرجى المحاولة بعد قليل.');
      } else {
        setAuthError('تعذر تسجيل الدخول. تأكد من صحة البيانات واتصالك بالإنترنت.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code !== 'auth/popup-closed-by-user') {
        setAuthError('تعذر إتمام تسجيل الدخول بحساب قوقل. تأكد من السماح بالنوافذ المنبثقة.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setAuthError(null);
    try {
      await sendEmailVerification(user);
      setAuthInfo(`تم إرسال رابط التوثيق إلى ${user.email}. افتح بريدك ثم اضغط "تم التوثيق — تحديث الحالة".`);
    } catch {
      setAuthError('تعذر إرسال رسالة التوثيق الآن. حاول مرة أخرى بعد دقيقة.');
    }
  };

  const handleRefreshUser = async () => {
    if (!user) return;
    await user.reload();
    await user.getIdToken(true);
    setUser(auth.currentUser);
    setAuthTick((t) => t + 1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setStatusMessage(null);
  };

  const handleForceSeed = async () => {
    setSeeding(true);
    try {
      await seedDefaultsToFirestore(true);
      notify('success', 'تمت مزامنة واستعادة جميع البيانات الافتراضية إلى قاعدة البيانات بنجاح.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر مزامنة البيانات.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleImageFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    folder: string,
    onUrl: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToFirebaseStorage(file, folder);
      onUrl(url);
      notify('success', 'تم رفع الصورة وتجهيز رابطها المباشر بنجاح.');
    } catch {
      notify(
        'error',
        'تعذر رفع الصورة إلى Firebase Storage (تأكد من تفعيل Storage وقواعده في لوحة Firebase، أو أدخل رابط الصورة https:// مباشرة).'
      );
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Product handlers
  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: PRODUCT_CATEGORY_OPTIONS[0],
      size: '',
      price: '',
      originalPrice: '',
      imageSrc: '',
      imageAlt: '',
      shortNote: '',
      description: '',
      pharmacistTip: '',
      stockNote: 'متوفر في فرع حي الروضة',
      sortOrder: String(cms.products.length + 1),
    });
    setShowProductForm(true);
  };

  const openEditProduct = (prod: FirestoreProduct) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      size: prod.size,
      price: String(prod.price),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : '',
      imageSrc: prod.imageSrc,
      imageAlt: prod.imageAlt,
      shortNote: prod.shortNote,
      description: prod.description,
      pharmacistTip: prod.pharmacistTip,
      stockNote: prod.stockNote,
      sortOrder: String(prod.sortOrder ?? 1),
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSafeUrl(productForm.imageSrc)) {
      notify('error', 'يرجى إدخال رابط صورة صحيح يبدأ بـ https:// أو مسار محلي يبدأ بـ /');
      return;
    }
    const price = Number(productForm.price);
    const originalPrice = productForm.originalPrice.trim()
      ? Number(productForm.originalPrice)
      : undefined;

    if (!Number.isFinite(price) || price <= 0) {
      notify('error', 'يرجى إدخال السعر الحالي بشكل صحيح.');
      return;
    }
    if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < price)) {
      notify('error', 'السعر قبل الخصم يجب أن يكون أكبر من أو مساوياً للسعر الحالي.');
      return;
    }

    setSavingProduct(true);
    try {
      await saveProduct(editingProduct?.id || null, {
        name: productForm.name,
        category: productForm.category as Exclude<ProductCategory, 'الكل'>,
        size: productForm.size,
        price,
        originalPrice,
        imageSrc: productForm.imageSrc,
        imageAlt: productForm.imageAlt || productForm.name,
        shortNote: productForm.shortNote,
        description: productForm.description,
        pharmacistTip: productForm.pharmacistTip,
        stockNote: productForm.stockNote,
        sortOrder: Number(productForm.sortOrder) || 1,
      });
      setShowProductForm(false);
      setEditingProduct(null);
      notify(
        'success',
        editingProduct ? 'تم تحديث بيانات المنتج بنجاح.' : 'تم إضافة المنتج الجديد إلى المتجر.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حفظ المنتج.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setConfirmDeleteProdId(null);
      notify('success', 'تم حذف المنتج من المتجر نهائياً.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حذف المنتج.');
    }
  };

  // Settings handler
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSiteSettings(settingsForm);
      notify('success', 'تم حفظ جميع إعدادات الموقع وتحديثها لجميع الزوار.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حفظ الإعدادات.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Gallery handlers
  const openNewGallery = () => {
    setEditingGallery(null);
    setGalleryForm({
      title: '',
      category: GALLERY_CATEGORY_OPTIONS[0],
      subtitle: '',
      description: '',
      imageSrc: '',
      imageAlt: '',
      aspectClass: 'aspect-[4/3]',
      featured: false,
      sortOrder: String(cms.gallery.length + 1),
    });
    setShowGalleryForm(true);
  };

  const openEditGallery = (card: FirestoreGalleryPhoto) => {
    setEditingGallery(card);
    setGalleryForm({
      title: card.title,
      category: card.category,
      subtitle: card.subtitle,
      description: card.description,
      imageSrc: card.imageSrc,
      imageAlt: card.imageAlt,
      aspectClass: card.aspectClass,
      featured: Boolean(card.featured),
      sortOrder: String(card.sortOrder ?? 1),
    });
    setShowGalleryForm(true);
  };

  const handleSaveGallery = async (e: FormEvent) => {
    e.preventDefault();
    setSavingGallery(true);
    try {
      await saveGalleryPhoto(editingGallery?.id || null, {
        title: galleryForm.title,
        category: galleryForm.category as Exclude<GalleryCategory, 'الكل'>,
        subtitle: galleryForm.subtitle,
        description: galleryForm.description,
        imageSrc: galleryForm.imageSrc,
        imageAlt: galleryForm.imageAlt || galleryForm.title,
        aspectClass: galleryForm.aspectClass,
        featured: galleryForm.featured,
        sortOrder: Number(galleryForm.sortOrder) || 1,
      });
      setShowGalleryForm(false);
      setEditingGallery(null);
      notify('success', 'تم حفظ بطاقة المعرض بنجاح.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حفظ بطاقة المعرض.');
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      await deleteGalleryPhoto(id);
      setConfirmDeleteGalleryId(null);
      notify('success', 'تم حذف الصورة من المعرض.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حذف الصورة.');
    }
  };

  // Department handlers
  const openNewDept = () => {
    setEditingDept(null);
    setDeptForm({
      index: String(cms.departments.length + 1).padStart(2, '0'),
      name: '',
      summary: '',
      guidance: '',
      itemsText: '',
      sortOrder: String(cms.departments.length + 1),
    });
    setShowDeptForm(true);
  };

  const openEditDept = (dept: FirestoreDepartment) => {
    setEditingDept(dept);
    setDeptForm({
      index: dept.index,
      name: dept.name,
      summary: dept.summary,
      guidance: dept.guidance,
      itemsText: dept.items.join('\n'),
      sortOrder: String(dept.sortOrder ?? 1),
    });
    setShowDeptForm(true);
  };

  const handleSaveDept = async (e: FormEvent) => {
    e.preventDefault();
    setSavingDept(true);
    try {
      const items = deptForm.itemsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      await saveDepartment(editingDept?.id || null, {
        index: deptForm.index,
        name: deptForm.name,
        summary: deptForm.summary,
        guidance: deptForm.guidance,
        items,
        sortOrder: Number(deptForm.sortOrder) || 1,
      });
      setShowDeptForm(false);
      setEditingDept(null);
      notify('success', 'تم حفظ بيانات القسم بنجاح.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حفظ القسم.');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      await deleteDepartment(id);
      setConfirmDeleteDeptId(null);
      notify('success', 'تم حذف القسم.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حذف القسم.');
    }
  };

  // FAQ handlers
  const openNewFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      question: '',
      answer: '',
      sortOrder: String(cms.faqs.length + 1),
    });
    setShowFaqForm(true);
  };

  const openEditFaq = (faq: FirestoreFaq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      sortOrder: String(faq.sortOrder ?? 1),
    });
    setShowFaqForm(true);
  };

  const handleSaveFaq = async (e: FormEvent) => {
    e.preventDefault();
    setSavingFaq(true);
    try {
      await saveFaq(editingFaq?.id || null, {
        question: faqForm.question,
        answer: faqForm.answer,
        sortOrder: Number(faqForm.sortOrder) || 1,
      });
      setShowFaqForm(false);
      setEditingFaq(null);
      notify('success', 'تم حفظ السؤال الشائع بنجاح.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حفظ السؤال.');
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await deleteFaq(id);
      setConfirmDeleteFaqId(null);
      notify('success', 'تم حذف السؤال الشائع.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر حذف السؤال.');
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <p className="text-sm font-semibold text-[#435570]">
          جاري التحقق من جلسة الإدارة...
        </p>
      </div>
    );
  }

  // Unauthenticated or Unauthorized View
  if (!user || !isAllowlistedEmail || !user.emailVerified) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="bg-white border-b border-[#DCE4EF]">
          <div className="h-1 bg-[#F4C400]" aria-hidden="true" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-[#0B3C8A]" />
              <span className="font-bold text-[#0B1B36]">
                بوابة الإدارة — {cms.settings.pharmacyName}
              </span>
            </div>
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg border border-[#DCE4EF] bg-[#F8FAFC] hover:bg-[#EEF3FA] text-sm font-semibold text-[#0B1B36] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للموقع</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#DCE4EF] p-6 sm:p-8 shadow-sm">
            {user && !isAllowlistedEmail ? (
              <div className="space-y-4 text-center">
                <ShieldAlert className="w-10 h-10 text-red-700 mx-auto" />
                <h1 className="text-xl font-bold text-[#0B1B36]">
                  حساب غير مصرح له بالإدارة
                </h1>
                <p className="text-sm text-[#435570] leading-relaxed">
                  الحساب المسجل حالياً (<span dir="ltr">{user.email}</span>) غير مخوّل
                  للوصول إلى لوحة إدارة الصيدلية. يرجى تسجيل الدخول بالبريد الرسمي{' '}
                  <span dir="ltr" className="font-semibold text-[#0B1B36]">
                    {PHARMACY_EMAIL}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  تسجيل الخروج والدخول بحساب آخر
                </button>
              </div>
            ) : user && isAllowlistedEmail && !user.emailVerified ? (
              <div className="space-y-4">
                <Mail className="w-9 h-9 text-[#0B3C8A]" />
                <h1 className="text-xl font-bold text-[#0B1B36]">
                  تفعيل البريد الإلكتروني مطلوب
                </h1>
                <p className="text-sm text-[#435570] leading-relaxed">
                  أنت مسجل الدخول بحساب{' '}
                  <span dir="ltr" className="font-semibold text-[#0B1B36]">
                    {user.email}
                  </span>
                  ، ولحماية قاعدة البيانات يتطلب النظام توثيق البريد قبل تعديل المنتجات أو
                  إعدادات الموقع.
                </p>

                {authInfo && (
                  <p className="p-3 rounded-xl bg-[#EEF3FA] border border-[#DCE4EF] text-xs text-[#0B3C8A] font-medium">
                    {authInfo}
                  </p>
                )}
                {authError && (
                  <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {authError}
                  </p>
                )}

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleSendVerification}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    إرسال رابط التوثيق إلى البريد الآن
                  </button>
                  <button
                    type="button"
                    onClick={handleRefreshUser}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F4C400] hover:bg-[#E0B300] text-[#071D42] text-sm font-bold transition-colors cursor-pointer"
                  >
                    تم التوثيق — تحديث الحالة
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[#0B1B36] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    أو الدخول المباشر بحساب Google (توثيق فوري)
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full min-h-[40px] text-xs font-medium text-[#435570] hover:text-[#0B1B36] cursor-pointer"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#0B3C8A] mb-1">
                    دخول المشرف الرئيسي
                  </p>
                  <h1 className="text-xl font-bold text-[#0B1B36]">
                    تسجيل الدخول لقسم الأدمن
                  </h1>
                  <p className="mt-1.5 text-sm text-[#435570]">
                    إدارة المنتجات والأسعار وصور المعرض وجميع تفاصيل الموقع بشكل مباشر.
                  </p>
                </div>

                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-xs font-bold text-[#0B1B36] mb-1.5"
                    >
                      البريد الإلكتروني
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      dir="ltr"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={PHARMACY_EMAIL}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-bold text-[#0B1B36] mb-1.5"
                    >
                      كلمة المرور
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      dir="ltr"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed space-y-2.5"
                    >
                      <p>{authError}</p>
                      {showConsoleHelp && (
                        <div className="pt-2 border-t border-red-200 flex flex-col gap-1.5">
                          <a
                            href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between font-bold text-[#0B3C8A] hover:underline"
                          >
                            <span>١. فتح تفعيل Email/Password في Firebase Console ↗</span>
                          </a>
                          <a
                            href={`https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/users`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between font-bold text-[#0B3C8A] hover:underline"
                          >
                            <span>٢. فتح إضافة المستخدم ({PHARMACY_EMAIL}) ↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {authLoading ? 'جاري التحقق...' : 'دخول إلى لوحة التحكم'}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs text-[#435570]">
                  <span className="h-px flex-1 bg-[#DCE4EF]" />
                  <span>أو الدخول المباشر عبر Google</span>
                  <span className="h-px flex-1 bg-[#DCE4EF]" />
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleLogin}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#DCE4EF] bg-white hover:bg-[#EEF3FA] text-[#0B1B36] text-sm font-semibold transition-colors cursor-pointer"
                >
                  تسجيل الدخول المباشر بحساب قوقل (Google)
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#071D42] text-white border-b border-[#143366]">
        <div className="h-1 bg-[#F4C400]" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#F4C400] text-[#071D42] flex items-center justify-center font-extrabold text-sm shrink-0">
              أ
            </span>
            <div className="truncate">
              <p className="text-sm sm:text-base font-bold truncate">
                لوحة إدارة {cms.settings.pharmacyName}
              </p>
              <p className="text-[11px] text-white/70 truncate" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleForceSeed}
              disabled={seeding}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>مزامنة الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#F4C400] hover:bg-[#E0B300] text-[#071D42] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>معاينة الموقع</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Cloud Sync / Status Banner */}
        {statusMessage && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              إخفاء
            </button>
          </div>
        )}

        {!cms.hasCloudData && (
          <div className="rounded-xl border border-[#F4C400] bg-[#F4C400]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#0B1B36]">
              <Database className="w-5 h-5 text-[#0B3C8A] shrink-0" />
              <span>
                {seeding
                  ? 'جاري مزامنة المنتجات والإعدادات إلى قاعدة البيانات السحابية...'
                  : 'اضغط لمزامنة بيانات الموقع الافتراضية وحفظها في قاعدة البيانات.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleForceSeed}
              disabled={seeding}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0B3C8A] text-white text-xs font-semibold hover:bg-[#072B66] cursor-pointer shrink-0"
            >
              حفظ البيانات الآن
            </button>
          </div>
        )}

        {/* Section Switcher Tabs */}
        <div
          role="tablist"
          aria-label="أقسام الإدارة"
          className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-[#DCE4EF]"
        >
          {(
            [
              { id: 'products', label: `المنتجات (${cms.products.length})`, icon: Package },
              { id: 'settings', label: 'بيانات الموقع والهوية', icon: Globe },
              { id: 'gallery', label: `معرض الصور (${cms.gallery.length})`, icon: ImageIcon },
              { id: 'departments', label: `الأقسام (${cms.departments.length})`, icon: Layers },
              { id: 'faqs', label: `الأسئلة الشائعة (${cms.faqs.length})`, icon: HelpCircle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0B3C8A] text-white'
                    : 'text-[#435570] hover:bg-[#EEF3FA] hover:text-[#0B1B36]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1B36]">
                  إدارة المنتجات والأسعار
                </h2>
                <p className="text-sm text-[#435570]">
                  إضافة منتجات جديدة، تعديل الأسعار والخصومات والصور، أو حذف منتجات من
                  المتجر مباشرة.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewProduct}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {showProductForm && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-[#EEF3FA] pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1B36]">
                    {editingProduct ? `تعديل: ${editingProduct.name}` : 'رفع منتج جديد'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="text-xs font-semibold text-[#435570] hover:text-[#0B1B36] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      اسم المنتج
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      التصنيف
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          category: e.target.value as Exclude<ProductCategory, 'الكل'>,
                        }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    >
                      {PRODUCT_CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      الحجم / العبوة
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ٥٠٠ مل · عبوة بضغاط"
                      value={productForm.size}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, size: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      السعر الحالي (ر.س)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      dir="ltr"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, price: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      السعر قبل الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      dir="ltr"
                      placeholder="اتركه فارغاً إذا لا يوجد خصم"
                      value={productForm.originalPrice}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          originalPrice: e.target.value,
                        }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      ترتيب الظهور
                    </label>
                    <input
                      type="number"
                      min="1"
                      dir="ltr"
                      value={productForm.sortOrder}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, sortOrder: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-8">
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      رابط صورة المنتج (أو ارفع ملف صورة مباشرة)
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder="https://... أو /src/assets/images/..."
                      value={productForm.imageSrc}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, imageSrc: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#0B3C8A] bg-[#EEF3FA] hover:bg-[#DCE6F5] text-[#0B3C8A] text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>
                        {uploadingImage ? 'جاري رفع الصورة...' : 'رفع صورة من جهازك'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={(e) =>
                          handleImageFileUpload(e, 'products', (url) =>
                            setProductForm((f) => ({ ...f, imageSrc: url }))
                          )
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      ملاحظة مختصرة على البطاقة
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.shortNote}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, shortNote: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      حالة التوفر
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.stockNote}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, stockNote: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      الوصف التفصيلي
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      إرشاد الصيدلي للاستخدام
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={productForm.pharmacistTip}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          pharmacistTip: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="min-h-[44px] px-5 py-2 rounded-xl border border-[#DCE4EF] text-sm font-semibold text-[#435570] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cms.products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-[#DCE4EF] overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-4 flex gap-3.5 items-start">
                    <div className="w-20 h-20 rounded-xl border border-[#EEF3FA] bg-white p-1 shrink-0 overflow-hidden">
                      <ResilientImage
                        src={prod.imageSrc}
                        alt={prod.imageAlt}
                        fallbackTitle={prod.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#0B3C8A]">
                        {prod.category}
                      </p>
                      <h3 className="text-sm font-bold text-[#0B1B36] line-clamp-2 mt-0.5">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-[#435570] mt-1 truncate">
                        {prod.size}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-base font-extrabold text-[#0B1B36] tabular-nums">
                          {prod.price} ر.س
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-[#435570] line-through tabular-nums">
                            {prod.originalPrice} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#EEF3FA] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditProduct(prod)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#DCE4EF] bg-white hover:bg-[#EEF3FA] text-xs font-semibold text-[#0B1B36] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0B3C8A]" />
                      <span>تعديل</span>
                    </button>

                    {confirmDeleteProdId === prod.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProdId(null)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#DCE4EF] bg-white text-xs text-[#435570] cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteProdId(prod.id)}
                        className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: ALL SITE SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1B36]">
                  التحكم الكامل بتفاصيل الموقع والهوية
                </h2>
                <p className="text-sm text-[#435570]">
                  أي تعديل تحفظه هنا ينعكس فوراً في الواجهة الرئيسية، التواصل، التذييل،
                  وخيارات السلة لجميع الزوار.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ كافة التغييرات'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Identity & Contact */}
              <div className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-bold text-[#0B1B36] border-b border-[#EEF3FA] pb-3">
                  الهوية وبيانات التواصل الرسمية
                </h3>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    اسم الصيدلية
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.pharmacyName}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, pharmacyName: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      البريد الإلكتروني الرئيسي
                    </label>
                    <input
                      type="email"
                      dir="ltr"
                      required
                      value={settingsForm.email}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      رقم الهاتف المعروض
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={settingsForm.phoneDisplay}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, phoneDisplay: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      رقم الواتساب الدولي (بدون +)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={settingsForm.whatsappIntl}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, whatsappIntl: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      ساعات العمل
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.hoursLabel}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, hoursLabel: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    العنوان الكامل
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, address: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      إحداثيات الموقع
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={settingsForm.coords}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, coords: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      رابط خرائط قوقل
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      required
                      value={settingsForm.mapsUrl}
                      onChange={(e) =>
                        setSettingsForm((s) => ({ ...s, mapsUrl: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Official Licenses & Delivery */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#0B1B36] border-b border-[#EEF3FA] pb-3">
                    البيانات النظامية والتراخيص
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                        السجل التجاري
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={settingsForm.commercialReg}
                        onChange={(e) =>
                          setSettingsForm((s) => ({
                            ...s,
                            commercialReg: e.target.value,
                          }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                        رقم الترخيص
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={settingsForm.licenseNumber}
                        onChange={(e) =>
                          setSettingsForm((s) => ({
                            ...s,
                            licenseNumber: e.target.value,
                          }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                        الرقم الضريبي
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={settingsForm.vatNumber}
                        onChange={(e) =>
                          setSettingsForm((s) => ({ ...s, vatNumber: e.target.value }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#0B1B36] border-b border-[#EEF3FA] pb-3">
                    إعدادات التوصيل والسلة
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                        حد التوصيل المجاني (ر.س)
                      </label>
                      <input
                        type="number"
                        min="0"
                        dir="ltr"
                        required
                        value={settingsForm.freeDeliveryThreshold}
                        onChange={(e) =>
                          setSettingsForm((s) => ({
                            ...s,
                            freeDeliveryThreshold: Number(e.target.value),
                          }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                        رسوم التوصيل (ر.س)
                      </label>
                      <input
                        type="number"
                        min="0"
                        dir="ltr"
                        required
                        value={settingsForm.deliveryFee}
                        onChange={(e) =>
                          setSettingsForm((s) => ({
                            ...s,
                            deliveryFee: Number(e.target.value),
                          }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero & Storefront Copy */}
            <div className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-[#0B1B36] border-b border-[#EEF3FA] pb-3">
                نصوص وصور الواجهة الرئيسية والمتجر
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    السطر التمهيدي أعلى الصفحة
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.heroEyebrow}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, heroEyebrow: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    العنوان الرئيسي للواجهة
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.heroTitle}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, heroTitle: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                  الوصف التعريفي بالواجهة الرئيسية
                </label>
                <textarea
                  rows={2}
                  required
                  value={settingsForm.heroSubtitle}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, heroSubtitle: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-8">
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    رابط صورة الواجهة الرئيسية
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={settingsForm.heroImageSrc}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, heroImageSrc: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#0B3C8A] bg-[#EEF3FA] hover:bg-[#DCE6F5] text-[#0B3C8A] text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>تغيير صورة الواجهة برفع ملف</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFileUpload(e, 'hero', (url) =>
                          setSettingsForm((s) => ({ ...s, heroImageSrc: url }))
                        )
                      }
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    عنوان قسم المتجر
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeTitle}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, storeTitle: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    وصف قسم المتجر
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeSubtitle}
                    onChange={(e) =>
                      setSettingsForm((s) => ({ ...s, storeSubtitle: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] focus:bg-white focus:border-[#0B3C8A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: GALLERY */}
        {activeTab === 'gallery' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1B36]">
                  إدارة معرض صور الصيدلية
                </h2>
                <p className="text-sm text-[#435570]">
                  إضافة أو تعديل أو حذف صور الصيدلية الظاهرة في قسم معرض الصور.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewGallery}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صورة للمعرض</span>
              </button>
            </div>

            {showGalleryForm && (
              <form
                onSubmit={handleSaveGallery}
                className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-[#0B1B36]">
                  {editingGallery ? 'تعديل بطاقة المعرض' : 'إضافة بطاقة جديدة للمعرض'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      عنوان الصورة
                    </label>
                    <input
                      type="text"
                      required
                      value={galleryForm.title}
                      onChange={(e) =>
                        setGalleryForm((g) => ({ ...g, title: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      التصنيف
                    </label>
                    <select
                      value={galleryForm.category}
                      onChange={(e) =>
                        setGalleryForm((g) => ({
                          ...g,
                          category: e.target.value as Exclude<GalleryCategory, 'الكل'>,
                        }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    >
                      {GALLERY_CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      العنوان الفرعي
                    </label>
                    <input
                      type="text"
                      required
                      value={galleryForm.subtitle}
                      onChange={(e) =>
                        setGalleryForm((g) => ({ ...g, subtitle: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-8">
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      رابط الصورة
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={galleryForm.imageSrc}
                      onChange={(e) =>
                        setGalleryForm((g) => ({ ...g, imageSrc: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <label className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-[#0B3C8A] bg-[#EEF3FA] text-[#0B3C8A] text-xs font-bold cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageFileUpload(e, 'gallery', (url) =>
                            setGalleryForm((g) => ({ ...g, imageSrc: url }))
                          )
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    وصف الصورة
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={galleryForm.description}
                    onChange={(e) =>
                      setGalleryForm((g) => ({ ...g, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGalleryForm(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DCE4EF] text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingGallery}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B3C8A] text-white text-sm font-semibold cursor-pointer"
                  >
                    {savingGallery ? 'جاري الحفظ...' : 'حفظ الصورة'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cms.gallery.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-[#DCE4EF] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#EEF3FA] overflow-hidden">
                      <ResilientImage
                        src={card.imageSrc}
                        alt={card.imageAlt}
                        fallbackTitle={card.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold text-[#0B3C8A]">
                        {card.category}
                      </p>
                      <h3 className="text-sm font-bold text-[#0B1B36] mt-0.5">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#EEF3FA] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditGallery(card)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-[#DCE4EF] bg-white text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0B3C8A]" />
                      <span>تعديل</span>
                    </button>

                    {confirmDeleteGalleryId === card.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteGallery(card.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteGalleryId(null)}
                          className="min-h-[36px] px-2 py-1 rounded-lg border border-[#DCE4EF] bg-white text-xs cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGalleryId(card.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 4: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1B36]">
                  إدارة الأقسام الصيدلانية
                </h2>
                <p className="text-sm text-[#435570]">
                  تعديل أو إضافة الأقسام الصحية وقائمة الأصناف المتوفرة وإرشادات الصيدلي.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewDept}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            {showDeptForm && (
              <form
                onSubmit={handleSaveDept}
                className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-[#0B1B36]">
                  {editingDept ? `تعديل قسم: ${editingDept.name}` : 'إضافة قسم جديد'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      الرقم الترتيبي (مثال: 07)
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={deptForm.index}
                      onChange={(e) =>
                        setDeptForm((d) => ({ ...d, index: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-left rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                      اسم القسم
                    </label>
                    <input
                      type="text"
                      required
                      value={deptForm.name}
                      onChange={(e) =>
                        setDeptForm((d) => ({ ...d, name: e.target.value }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    وصف القسم
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deptForm.summary}
                    onChange={(e) =>
                      setDeptForm((d) => ({ ...d, summary: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    الأصناف المتوفرة (صنف واحد في كل سطر، بحد أقصى ١٠ أصناف)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={deptForm.itemsText}
                    onChange={(e) =>
                      setDeptForm((d) => ({ ...d, itemsText: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    توجيه الصيدلي
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.guidance}
                    onChange={(e) =>
                      setDeptForm((d) => ({ ...d, guidance: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeptForm(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DCE4EF] text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingDept}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B3C8A] text-white text-sm font-semibold cursor-pointer"
                  >
                    {savingDept ? 'جاري الحفظ...' : 'حفظ القسم'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cms.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-2xl border border-[#DCE4EF] p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-[#0B1B36]">
                        {dept.name}
                      </h3>
                      <span className="text-xs font-bold text-[#0B3C8A] tabular-nums">
                        {dept.index}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#435570]">{dept.summary}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#EEF3FA]">
                    <button
                      type="button"
                      onClick={() => openEditDept(dept)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-[#DCE4EF] text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0B3C8A]" />
                      <span>تعديل</span>
                    </button>

                    {confirmDeleteDeptId === dept.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteDept(dept.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDeptId(null)}
                          className="min-h-[36px] px-2 py-1 rounded-lg border border-[#DCE4EF] text-xs cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteDeptId(dept.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-red-200 text-xs font-semibold text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: FAQS */}
        {activeTab === 'faqs' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1B36]">
                  إدارة الأسئلة الشائعة
                </h2>
                <p className="text-sm text-[#435570]">
                  إضافة وتحديث الأسئلة والإجابات الظاهرة للزوار في قسم الأسئلة الشائعة.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewFaq}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B3C8A] hover:bg-[#072B66] text-white text-sm font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال جديد</span>
              </button>
            </div>

            {showFaqForm && (
              <form
                onSubmit={handleSaveFaq}
                className="bg-white rounded-2xl border border-[#DCE4EF] p-5 sm:p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-[#0B1B36]">
                  {editingFaq ? 'تعديل السؤال الشائع' : 'إضافة سؤال جديد'}
                </h3>
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    السؤال
                  </label>
                  <input
                    type="text"
                    required
                    value={faqForm.question}
                    onChange={(e) =>
                      setFaqForm((f) => ({ ...f, question: e.target.value }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0B1B36] mb-1">
                    الإجابة
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={faqForm.answer}
                    onChange={(e) =>
                      setFaqForm((f) => ({ ...f, answer: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#DCE4EF] bg-[#F8FAFC]"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFaqForm(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DCE4EF] text-sm cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingFaq}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B3C8A] text-white text-sm font-semibold cursor-pointer"
                  >
                    {savingFaq ? 'جاري الحفظ...' : 'حفظ السؤال'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {cms.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[#DCE4EF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1B36]">
                      {faq.question}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[#435570]">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditFaq(faq)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-[#DCE4EF] text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0B3C8A]" />
                      <span>تعديل</span>
                    </button>

                    {confirmDeleteFaqId === faq.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFaqId(null)}
                          className="min-h-[36px] px-2 py-1 rounded-lg border border-[#DCE4EF] text-xs cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFaqId(faq.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-red-200 text-xs font-semibold text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
