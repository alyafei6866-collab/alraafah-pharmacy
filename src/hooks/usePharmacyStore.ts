import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_SITE_SETTINGS,
  DEPARTMENTS,
  FAQ_ITEMS,
  PHOTO_CARDS,
  PharmacyDepartment,
  PharmacyPhotoCard,
  PharmacyProduct,
  FaqItem,
  STORE_PRODUCTS,
  SiteSettings,
} from '../data/pharmacyData';
import { auth, db, handleFirestoreError, isSafeUrl, OperationType } from '../firebase';

export interface FirestoreProduct extends PharmacyProduct {
  sortOrder?: number;
}

export interface FirestoreFaq extends FaqItem {
  sortOrder?: number;
}

export interface FirestoreDepartment extends PharmacyDepartment {
  sortOrder?: number;
}

export interface FirestoreGalleryPhoto extends PharmacyPhotoCard {
  sortOrder?: number;
}

export interface PharmacyCmsState {
  settings: SiteSettings;
  products: FirestoreProduct[];
  faqs: FirestoreFaq[];
  departments: FirestoreDepartment[];
  gallery: FirestoreGalleryPhoto[];
  hasCloudData: boolean;
  loading: boolean;
}

function sortByOrder<T extends { sortOrder?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function sanitizeSlugId(prefix: string): string {
  const clean = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return clean.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function usePharmacyStore(): PharmacyCmsState {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [hasCloudSettings, setHasCloudSettings] = useState(false);

  const [cloudProducts, setCloudProducts] = useState<FirestoreProduct[] | null>(null);
  const [cloudFaqs, setCloudFaqs] = useState<FirestoreFaq[] | null>(null);
  const [cloudDepts, setCloudDepts] = useState<FirestoreDepartment[] | null>(null);
  const [cloudGallery, setCloudGallery] = useState<FirestoreGalleryPhoto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'siteSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SiteSettings>;
          setSettings({ ...DEFAULT_SITE_SETTINGS, ...data });
          setHasCloudSettings(true);
        } else {
          setSettings(DEFAULT_SITE_SETTINGS);
          setHasCloudSettings(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore settings listener error:', error);
        setLoading(false);
      }
    );

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), limit(100)),
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreProduct, 'id'>),
        }));
        setCloudProducts(sortByOrder(docs));
      },
      (error) => {
        console.error('Firestore products listener error:', error);
      }
    );

    const unsubFaqs = onSnapshot(
      query(collection(db, 'faqs'), limit(100)),
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreFaq, 'id'>),
        }));
        setCloudFaqs(sortByOrder(docs));
      },
      (error) => {
        console.error('Firestore faqs listener error:', error);
      }
    );

    const unsubDepts = onSnapshot(
      query(collection(db, 'departments'), limit(100)),
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreDepartment, 'id'>),
        }));
        setCloudDepts(sortByOrder(docs));
      },
      (error) => {
        console.error('Firestore departments listener error:', error);
      }
    );

    const unsubGallery = onSnapshot(
      query(collection(db, 'gallery'), limit(100)),
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreGalleryPhoto, 'id'>),
        }));
        setCloudGallery(sortByOrder(docs));
      },
      (error) => {
        console.error('Firestore gallery listener error:', error);
      }
    );

    return () => {
      unsubSettings();
      unsubProducts();
      unsubFaqs();
      unsubDepts();
      unsubGallery();
    };
  }, []);

  const products =
    cloudProducts && (cloudProducts.length > 0 || hasCloudSettings)
      ? cloudProducts
      : STORE_PRODUCTS;

  const faqs =
    cloudFaqs && (cloudFaqs.length > 0 || hasCloudSettings)
      ? cloudFaqs
      : FAQ_ITEMS;

  const departments =
    cloudDepts && (cloudDepts.length > 0 || hasCloudSettings)
      ? cloudDepts
      : DEPARTMENTS;

  const gallery =
    cloudGallery && (cloudGallery.length > 0 || hasCloudSettings)
      ? cloudGallery
      : PHOTO_CARDS;

  return {
    settings,
    products,
    faqs,
    departments,
    gallery,
    hasCloudData: hasCloudSettings,
    loading,
  };
}

export async function seedDefaultsToFirestore(forceAll = false): Promise<boolean> {
  const settingsRef = doc(db, 'siteSettings', 'main');
  try {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    const existingSettings = await getDoc(settingsRef);
    const existingProducts = await getDocs(query(collection(db, 'products'), limit(100)));

    const existingProductMap = new Map(
      existingProducts.docs.map((d) => [d.id, d.data() as Record<string, unknown>])
    );
    const existingProductIds = new Set(existingProductMap.keys());
    const hasSeededMedicines = existingProductIds.has('med-panadol-advance');
    const hasSeededCoughSyrups = existingProductIds.has('cough-prospan-200');

    const storeById = new Map(STORE_PRODUCTS.map((p) => [p.id, p]));
    const staleImageIds = new Set(
      existingProducts.docs
        .filter((d) => {
          const data = d.data() as { imageSrc?: unknown };
          const defaultProd = storeById.get(d.id);
          return (
            Boolean(defaultProd) &&
            typeof data.imageSrc === 'string' &&
            data.imageSrc.startsWith('/src/assets/images/med_') &&
            data.imageSrc !== defaultProd?.imageSrc
          );
        })
        .map((d) => d.id)
    );

    if (
      !forceAll &&
      existingSettings.exists() &&
      !existingProducts.empty &&
      hasSeededMedicines &&
      hasSeededCoughSyrups &&
      staleImageIds.size === 0
    ) {
      return false;
    }

    const batch = writeBatch(db);
    let writeCount = 0;

    if (!existingSettings.exists()) {
      batch.set(settingsRef, {
        ...DEFAULT_SITE_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    } else if (forceAll) {
      batch.update(settingsRef, {
        ...DEFAULT_SITE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      writeCount++;
    }

    if (
      forceAll ||
      existingProducts.empty ||
      !hasSeededMedicines ||
      !hasSeededCoughSyrups ||
      staleImageIds.size > 0
    ) {
      STORE_PRODUCTS.forEach((p, idx) => {
        const { id, ...rest } = p;
        const exists = existingProductIds.has(id);
        const basePayload: Record<string, unknown> = {
          name: rest.name,
          category: rest.category,
          size: rest.size,
          price: rest.price,
          imageSrc: rest.imageSrc,
          imageAlt: rest.imageAlt,
          shortNote: rest.shortNote,
          description: rest.description,
          pharmacistTip: rest.pharmacistTip,
          stockNote: rest.stockNote,
          sortOrder: idx + 1,
          updatedAt: serverTimestamp(),
        };
        if (typeof rest.originalPrice === 'number' && rest.originalPrice >= rest.price) {
          basePayload.originalPrice = rest.originalPrice;
        } else if (exists) {
          basePayload.originalPrice = deleteField();
        }
        if (exists) {
          if (forceAll) {
            batch.update(doc(db, 'products', id), basePayload);
            writeCount++;
          } else if (staleImageIds.has(id)) {
            const existingDoc = existingProductMap.get(id);
            const patchPayload: Record<string, unknown> = {
              imageSrc: rest.imageSrc,
              imageAlt: rest.imageAlt,
              updatedAt: serverTimestamp(),
            };
            if (
              id === 'med-strepsils-honey' &&
              existingDoc?.size === '٢٤ قرص استحلاب · عسل وليمون'
            ) {
              patchPayload.size = rest.size;
            }
            if (
              id === 'med-fevadol-syrup' &&
              existingDoc?.size === '١٤٥ مل · باراسيتامول ١٢٠ ملجم / ٥ مل'
            ) {
              patchPayload.size = rest.size;
            }
            batch.update(doc(db, 'products', id), patchPayload);
            writeCount++;
          }
        } else {
          batch.set(doc(db, 'products', id), {
            ...basePayload,
            createdAt: serverTimestamp(),
          });
          writeCount++;
        }
      });
    }

    const existingFaqs = await getDocs(query(collection(db, 'faqs'), limit(100)));
    const existingFaqIds = new Set(existingFaqs.docs.map((d) => d.id));
    if (forceAll || existingFaqs.empty) {
      FAQ_ITEMS.forEach((item, idx) => {
        const exists = existingFaqIds.has(item.id);
        const basePayload = {
          question: item.question,
          answer: item.answer,
          sortOrder: idx + 1,
          updatedAt: serverTimestamp(),
        };
        if (exists) {
          if (forceAll) {
            batch.update(doc(db, 'faqs', item.id), basePayload);
            writeCount++;
          }
        } else {
          batch.set(doc(db, 'faqs', item.id), {
            ...basePayload,
            createdAt: serverTimestamp(),
          });
          writeCount++;
        }
      });
    }

    const existingDepts = await getDocs(query(collection(db, 'departments'), limit(100)));
    const existingDeptIds = new Set(existingDepts.docs.map((d) => d.id));
    if (forceAll || existingDepts.empty) {
      DEPARTMENTS.forEach((dept, idx) => {
        const exists = existingDeptIds.has(dept.id);
        const basePayload = {
          index: dept.index,
          name: dept.name,
          summary: dept.summary,
          guidance: dept.guidance,
          items: dept.items.slice(0, 10),
          sortOrder: idx + 1,
          updatedAt: serverTimestamp(),
        };
        if (exists) {
          if (forceAll) {
            batch.update(doc(db, 'departments', dept.id), basePayload);
            writeCount++;
          }
        } else {
          batch.set(doc(db, 'departments', dept.id), {
            ...basePayload,
            createdAt: serverTimestamp(),
          });
          writeCount++;
        }
      });
    }

    const existingGallery = await getDocs(query(collection(db, 'gallery'), limit(100)));
    const existingGalleryIds = new Set(existingGallery.docs.map((d) => d.id));
    if (forceAll || existingGallery.empty) {
      PHOTO_CARDS.forEach((card, idx) => {
        const exists = existingGalleryIds.has(card.id);
        const basePayload = {
          title: card.title,
          category: card.category,
          subtitle: card.subtitle,
          description: card.description,
          imageSrc: card.imageSrc,
          imageAlt: card.imageAlt,
          aspectClass: card.aspectClass,
          featured: Boolean(card.featured),
          sortOrder: idx + 1,
          updatedAt: serverTimestamp(),
        };
        if (exists) {
          if (forceAll) {
            batch.update(doc(db, 'gallery', card.id), basePayload);
            writeCount++;
          }
        } else {
          batch.set(doc(db, 'gallery', card.id), {
            ...basePayload,
            createdAt: serverTimestamp(),
          });
          writeCount++;
        }
      });
    }

    if (writeCount === 0) {
      return false;
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedDefaultsToFirestore');
  }
}

export async function saveSiteSettings(nextSettings: SiteSettings): Promise<void> {
  if (!isSafeUrl(nextSettings.mapsUrl)) {
    throw new Error('رابط خرائط قوقل غير صالح (يجب أن يبدأ بـ https:// أو http://).');
  }
  if (!isSafeUrl(nextSettings.heroImageSrc)) {
    throw new Error('رابط صورة الواجهة الرئيسية غير صالح.');
  }
  const ref = doc(db, 'siteSettings', 'main');
  try {
    const snap = await getDoc(ref);
    const cleanData: SiteSettings = {
      ...nextSettings,
      pharmacyName: nextSettings.pharmacyName.trim().slice(0, 120),
      tagline: nextSettings.tagline.trim().slice(0, 200),
      email: nextSettings.email.trim().slice(0, 120),
      phoneDisplay: nextSettings.phoneDisplay.trim().slice(0, 30),
      whatsappIntl: nextSettings.whatsappIntl.trim().slice(0, 30),
      address: nextSettings.address.trim().slice(0, 200),
      coords: nextSettings.coords.trim().slice(0, 80),
      mapsUrl: nextSettings.mapsUrl.trim().slice(0, 400),
      hoursLabel: nextSettings.hoursLabel.trim().slice(0, 80),
      commercialReg: nextSettings.commercialReg.trim().slice(0, 40),
      licenseNumber: nextSettings.licenseNumber.trim().slice(0, 40),
      vatNumber: nextSettings.vatNumber.trim().slice(0, 40),
      heroEyebrow: nextSettings.heroEyebrow.trim().slice(0, 200),
      heroTitle: nextSettings.heroTitle.trim().slice(0, 200),
      heroSubtitle: nextSettings.heroSubtitle.trim().slice(0, 500),
      heroImageSrc: nextSettings.heroImageSrc.trim().slice(0, 600),
      storeTitle: nextSettings.storeTitle.trim().slice(0, 200),
      storeSubtitle: nextSettings.storeSubtitle.trim().slice(0, 500),
      freeDeliveryThreshold: Math.max(0, Number(nextSettings.freeDeliveryThreshold) || 0),
      deliveryFee: Math.max(0, Number(nextSettings.deliveryFee) || 0),
    };

    if (snap.exists()) {
      await updateDoc(ref, {
        ...cleanData,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteSettings/main');
  }
}

export async function saveProduct(
  productId: string | null,
  input: Omit<FirestoreProduct, 'id'>
): Promise<void> {
  if (!isSafeUrl(input.imageSrc)) {
    throw new Error('رابط صورة المنتج غير صالح (استخدم رابط https:// أو ارفع الصورة).');
  }
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('يرجى إدخال سعر صحيح أكبر من صفر.');
  }

  const id = productId || sanitizeSlugId('prod');
  const path = `products/${id}`;
  const ref = doc(db, 'products', id);

  const payload: Record<string, unknown> = {
    name: input.name.trim().slice(0, 160),
    category: input.category.trim().slice(0, 60),
    size: input.size.trim().slice(0, 120),
    price,
    imageSrc: input.imageSrc.trim().slice(0, 600),
    imageAlt: (input.imageAlt || input.name).trim().slice(0, 200),
    shortNote: input.shortNote.trim().slice(0, 240),
    description: input.description.trim().slice(0, 1000),
    pharmacistTip: input.pharmacistTip.trim().slice(0, 600),
    stockNote: input.stockNote.trim().slice(0, 120),
    sortOrder: Math.max(0, Number(input.sortOrder) || 1),
    updatedAt: serverTimestamp(),
  };

  if (
    typeof input.originalPrice === 'number' &&
    Number.isFinite(input.originalPrice) &&
    input.originalPrice >= price
  ) {
    payload.originalPrice = input.originalPrice;
  }

  try {
    if (productId) {
      if (!('originalPrice' in payload)) {
        payload.originalPrice = deleteField();
      }
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, productId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveFaq(
  faqId: string | null,
  input: Omit<FirestoreFaq, 'id'>
): Promise<void> {
  const id = faqId || sanitizeSlugId('faq');
  const path = `faqs/${id}`;
  const ref = doc(db, 'faqs', id);
  const payload = {
    question: input.question.trim().slice(0, 300),
    answer: input.answer.trim().slice(0, 1200),
    sortOrder: Math.max(0, Number(input.sortOrder) || 1),
    updatedAt: serverTimestamp(),
  };

  try {
    if (faqId) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, faqId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteFaq(faqId: string): Promise<void> {
  const path = `faqs/${faqId}`;
  try {
    await deleteDoc(doc(db, 'faqs', faqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDepartment(
  deptId: string | null,
  input: Omit<FirestoreDepartment, 'id'>
): Promise<void> {
  const id = deptId || sanitizeSlugId('dept');
  const path = `departments/${id}`;
  const ref = doc(db, 'departments', id);
  const cleanItems = input.items
    .map((s) => s.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 10);

  if (cleanItems.length === 0) {
    throw new Error('يرجى إضافة صنف واحد على الأقل للقسم.');
  }

  const payload = {
    index: input.index.trim().slice(0, 10),
    name: input.name.trim().slice(0, 120),
    summary: input.summary.trim().slice(0, 400),
    guidance: input.guidance.trim().slice(0, 500),
    items: cleanItems,
    sortOrder: Math.max(0, Number(input.sortOrder) || 1),
    updatedAt: serverTimestamp(),
  };

  try {
    if (deptId) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, deptId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteDepartment(deptId: string): Promise<void> {
  const path = `departments/${deptId}`;
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGalleryPhoto(
  photoId: string | null,
  input: Omit<FirestoreGalleryPhoto, 'id'>
): Promise<void> {
  if (!isSafeUrl(input.imageSrc)) {
    throw new Error('رابط صورة المعرض غير صالح.');
  }
  const id = photoId || sanitizeSlugId('gallery');
  const path = `gallery/${id}`;
  const ref = doc(db, 'gallery', id);
  const payload = {
    title: input.title.trim().slice(0, 200),
    category: input.category.trim().slice(0, 80),
    subtitle: input.subtitle.trim().slice(0, 200),
    description: input.description.trim().slice(0, 600),
    imageSrc: input.imageSrc.trim().slice(0, 600),
    imageAlt: (input.imageAlt || input.title).trim().slice(0, 200),
    aspectClass: input.aspectClass.trim().slice(0, 40) || 'aspect-[4/3]',
    featured: Boolean(input.featured),
    sortOrder: Math.max(0, Number(input.sortOrder) || 1),
    updatedAt: serverTimestamp(),
  };

  try {
    if (photoId) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, photoId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteGalleryPhoto(photoId: string): Promise<void> {
  const path = `gallery/${photoId}`;
  try {
    await deleteDoc(doc(db, 'gallery', photoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
