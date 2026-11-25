/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { DepartmentsSection } from './components/DepartmentsSection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FaqSection } from './components/FaqSection';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { LocationSection } from './components/LocationSection';
import { Navbar } from './components/Navbar';
import { PhotoGallerySection } from './components/PhotoGallerySection';
import { ServicesAndConsultation } from './components/ServicesAndConsultation';
import { StorefrontSection } from './components/StorefrontSection';
import { usePharmacyStore } from './hooks/usePharmacyStore';

function PharmacyAppContent() {
  const cms = usePharmacyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [adminMode, setAdminMode] = useState<boolean>(
    () => window.location.hash === '#admin'
  );

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setAdminMode(true);
      } else if (adminMode) {
        setAdminMode(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [adminMode]);

  useEffect(() => {
    const canonicalUrl = window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', canonicalUrl);
  }, []);

  useEffect(() => {
    document.title = `${cms.settings.pharmacyName} | تبوك - متجر صيدلاني ٢٤ ساعة`;
  }, [cms.settings.pharmacyName]);

  const openAdmin = () => {
    window.location.hash = 'admin';
    setAdminMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeAdmin = () => {
    if (window.location.hash === '#admin') {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
    setAdminMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (adminMode) {
    return <AdminPanel cms={cms} onExitAdmin={closeAdmin} />;
  }

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const handleAddToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const nextQty = (prev[productId] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: nextQty };
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B1B36]">
      <Navbar
        pharmacyName={cms.settings.pharmacyName}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />
      <main className="flex-1">
        <HeroSection
          settings={cms.settings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <StorefrontSection
          products={cms.products}
          storeTitle={cms.settings.storeTitle}
          storeSubtitle={cms.settings.storeSubtitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
          onOpenCart={() => setCartOpen(true)}
        />
        <PhotoGallerySection gallery={cms.gallery} />
        <DepartmentsSection
          departments={cms.departments}
          phoneDisplay={cms.settings.phoneDisplay}
        />
        <ServicesAndConsultation />
        <FaqSection
          faqs={cms.faqs}
          phoneDisplay={cms.settings.phoneDisplay}
        />
        <LocationSection settings={cms.settings} />
      </main>
      <Footer settings={cms.settings} onOpenAdmin={openAdmin} />
      <CartDrawer
        products={cms.products}
        settings={cms.settings}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
      />
      <FloatingWhatsAppButton
        whatsappIntl={cms.settings.whatsappIntl}
        pharmacyName={cms.settings.pharmacyName}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PharmacyAppContent />
    </ErrorBoundary>
  );
}
