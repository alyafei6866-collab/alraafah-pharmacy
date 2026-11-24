/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { DepartmentsSection } from './components/DepartmentsSection';
import { FaqSection } from './components/FaqSection';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { LocationSection } from './components/LocationSection';
import { Navbar } from './components/Navbar';
import { PhotoGallerySection } from './components/PhotoGallerySection';
import { ServicesAndConsultation } from './components/ServicesAndConsultation';
import { StorefrontSection } from './components/StorefrontSection';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

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
      <Navbar cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />
      <main className="flex-1">
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <StorefrontSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
          onOpenCart={() => setCartOpen(true)}
        />
        <PhotoGallerySection />
        <DepartmentsSection />
        <ServicesAndConsultation />
        <FaqSection />
        <LocationSection />
      </main>
      <Footer />
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
      />
      <FloatingWhatsAppButton />
    </div>
  );
}
