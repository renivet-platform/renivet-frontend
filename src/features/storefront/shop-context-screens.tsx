import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./shop-context-screens.module.css";

function ShopHeader() {
  return <header className={styles.header}>
    <Link className={styles.wordmark} href="/">RENIVET</Link>
    <nav aria-label="Shop navigation">
      <Link href="/shop/brands">Brands</Link>
      <Link href="/shop/saved">Saved</Link>
      <Link href="/sign-in">Sign in</Link>
    </nav>
  </header>;
}

function ShopLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}><ShopHeader />{children}<footer className={styles.footer}>
    <span>Renivet · Independent brands</span>
    <nav aria-label="Policy links"><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></nav>
  </footer></div>;
}

function Notice({ title, children, href = "/sign-in", label = "Sign in" }: { title: string; children: ReactNode; href?: string; label?: string }) {
  return <section className={styles.notice} aria-labelledby="shop-notice-title">
    <span className={styles.noticeMark} aria-hidden="true">R</span>
    <div><p className={styles.status}>Not connected</p><h2 id="shop-notice-title">{title}</h2><p>{children}</p><Link className={styles.action} href={href}>{label}</Link></div>
  </section>;
}

export function BrandDirectoryScreen() {
  return <ShopLayout><main className={styles.content} data-screen-id="CU-05A">
    <p className={styles.kicker}>A little more about who made it</p><h1>Meet the brands</h1>
    <p className={styles.lead}>Every brand here is reviewed by Renivet before its first sale.</p>
    <div className={styles.filterBar} aria-label="Brand directory filters"><span>All brands</span><span>Clothing</span><span>Home</span></div>
    <div className={styles.brandDirectoryEmpty}><span className={styles.patternSwatch} aria-hidden="true"/><div><p className={styles.status}>Catalogue connection pending</p><h2>Brand stories will appear here</h2><p>The public directory is not connected yet. This page will show approved brand profiles only; there are no demo brands in the live interface.</p></div><Link href="/sign-in">Sign in</Link></div>
  </main></ShopLayout>;
}

export function BrandProfileScreen({ slug }: { slug: string }) {
  return <ShopLayout><main className={styles.content} data-screen-id="CU-05B">
    <p className={styles.breadcrumb}><Link href="/shop/brands">Brands</Link><span aria-hidden="true">/</span>{slug}</p>
    <div className={styles.brandBanner}><span className={styles.bannerTitle}>The makers</span><span className={styles.bannerPattern} aria-hidden="true"/></div>
    <div className={styles.brandStory}><p className={styles.kicker}>BRAND PROFILE · {slug}</p><h1>Made with care, shared with proof.</h1><p>Brand stories, maker details and the work behind each collection will appear when the approved public profile is connected.</p></div>
    <section className={styles.brandFacts} aria-label="Reviewed brand information"><article><strong>Maker story</strong><span>Not loaded</span></article><article><strong>What Renivet reviewed</strong><span>Not loaded</span></article><article><strong>Pieces by this brand</strong><span>Not loaded</span></article></section>
    <Notice title="This brand profile is not available yet" href="/shop/brands" label="Back to brands">The public brand profile API is not connected. Private seller information is never exposed here.</Notice>
  </main></ShopLayout>;
}

export function ProductDetailScreen({ productId }: { productId: string }) {
  return <ShopLayout><main className={styles.content} data-screen-id="CU-03" data-product-id={productId}>
    <p className={styles.breadcrumb}><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/shop/brands">Brands</Link><span aria-hidden="true">/</span>Product</p>
    <div className={styles.productGrid}><div className={styles.productGallery} aria-label="Product gallery unavailable"><div className={styles.productImage}><span>RENIVET</span></div><div className={styles.galleryThumbs}><span/><span/></div></div>
      <section className={styles.productInfo}><p className={styles.kicker}>PRODUCT DETAILS</p><h1>Product information</h1><p className={styles.lead}>This product has not been loaded from a public catalogue.</p>
        <div className={styles.productFacts}><p>Price <strong>Not available</strong></p><p>Colour and size <strong>Not available</strong></p><p>Availability <strong>Not available</strong></p></div>
        <Notice title="Product details are not available yet" href="/shop/brands" label="Explore brands">The public product API is not connected. No price, stock, claims or maker details are invented.</Notice>
        <section className={styles.checkedPanel}><h2>What we’ve checked</h2><p>Verified product claims will be shown with their evidence level after catalogue data is connected.</p></section>
      </section></div>
  </main></ShopLayout>;
}

export function SavedItemsScreen() {
  return <ShopLayout><main className={styles.content} data-screen-id="CU-06">
    <section className={styles.savedEmpty}><span className={styles.savedPattern} aria-hidden="true">♡</span><p className={styles.kicker}>YOUR COLLECTION</p><h1>Keep the pieces you love</h1><p>Sign in with your mobile number to save pieces and find them again on any device.</p><Notice title="Saved items are not available yet">Renivet does not have a saved-items API in this release. Signing in will not create or imply a saved list.</Notice><Link className={styles.action} href="/sign-in">Sign in or create an account</Link><Link className={styles.keepBrowsing} href="/">Keep browsing</Link></section>
  </main></ShopLayout>;
}

export function PolicyContentScreen({ policy }: { policy: string }) {
  const title = policy.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <ShopLayout><main className={styles.content} data-screen-id="CU-22">
    <p className={styles.kicker}>Renivet policies</p><h1>{title || "Policy information"}</h1>
    <section className={styles.policyCard}><p className={styles.status}>Content pending owner review</p><h2>We’re preparing this information</h2><p>The approved policy text has not been provided to this frontend. We will publish the current legal wording here after review.</p><Link href="/">Return home</Link></section>
  </main></ShopLayout>;
}
