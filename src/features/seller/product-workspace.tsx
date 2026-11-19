"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AuthApiError, getCurrentSession } from "@/features/identity/auth-api";
import { categoryDraftVersion, categoryLabel, createIdempotencyKey, selectableCategories, type Category, type CategoryAttribute, type Paged, type ProductPage, type ProductSummary, W2ApiError, w2Request } from "@/features/seller/w2-catalog";
import styles from "./product-workspace.module.css";

import { filteredLoadedProducts, loadedTabCount, productStatusTabs, type ProductTab } from "./product-list-filters";

type CreateDraftReceipt = { productId: string; publicationState: "DRAFT"; categorySchemaVersion: number };

function errorMessage(error: unknown): string {
  if (error instanceof W2ApiError) return error.message;
  if (error instanceof AuthApiError && error.status === 401) return "Your session has expired. Sign in again, then reopen this workspace.";
  return "The catalogue service is temporarily unavailable. Try again shortly.";
}

function ProductState({ state }: { state: ProductSummary["publicationState"] }) {
  return <span className={`${styles.state} ${state === "DRAFT" || state === "INCOMPLETE" ? styles.stateDraft : state === "PUBLISHED" ? styles.statePublished : styles.stateReview}`}>{state === "REJECTED" ? "Changes requested" : state === "PUBLISHED" ? "Live" : state.replaceAll("_", " ").toLocaleLowerCase()}</span>;
}

export function ProductWorkspace({ brandId, mode = "list" }: { brandId: string; mode?: "list" | "new" }) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [productCursor, setProductCursor] = useState<string | null>(null);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const showForm = mode === "new";
  const [searchText, setSearchText] = useState("");
  const [activeStatus, setActiveStatus] = useState<ProductTab>("all");
  const [title, setTitle] = useState("");
  const [styleCode, setStyleCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeError, setAttributeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const idempotency = useRef<{ hash: string; key: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setProducts([]);
    setTotalCount(0);
    setProductCursor(null);
    setCategories([]);
    Promise.all([
      w2Request<ProductPage>(["brands", brandId, "products"], { query: { limit: "50" }, signal: controller.signal }),
      w2Request<Paged<Category>>(["brands", brandId, "categories"], { query: { limit: "100" }, signal: controller.signal }),
    ]).then(([productPage, categoryPage]) => {
      setProducts(productPage.items);
      setTotalCount(productPage.totalCount);
      setProductCursor(productPage.nextCursor ?? null);
      setNextCursor(categoryPage.nextCursor ?? null);
      setCategories(categoryPage.items);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(errorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [brandId, reloadKey]);

  const selectable = useMemo(() => selectableCategories(categories), [categories]);
  const selectedCategory = selectable.find((category) => category.id === categoryId);
  const visibleCategories = useMemo(() => {
    const normalized = categoryFilter.trim().toLocaleLowerCase();
    return selectable.filter((category) => !normalized || categoryLabel(category, categories).toLocaleLowerCase().includes(normalized));
  }, [categories, categoryFilter, selectable]);

  useEffect(() => {
    if (!categoryId) { setAttributes([]); setAttributeError(""); return; }
    const controller = new AbortController();
    setAttributes([]);
    setAttributeError("");
    w2Request<Paged<CategoryAttribute>>(["brands", brandId, "categories", categoryId, "attributes"], {
      query: { limit: "100" }, signal: controller.signal,
    }).then((page) => setAttributes(page.items)).catch((error: unknown) => {
      if (!controller.signal.aborted) setAttributeError(errorMessage(error));
    });
    return () => controller.abort();
  }, [brandId, categoryId]);

  async function loadMoreCategories() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await w2Request<Paged<Category>>(["brands", brandId, "categories"], { query: { limit: "100", cursor: nextCursor } });
      setCategories((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor ?? null);
    } catch (error) { setLoadError(errorMessage(error)); }
    finally { setLoadingMore(false); }
  }

  async function loadMoreProducts() {
    if (!productCursor || loadingMoreProducts) return;
    setLoadingMoreProducts(true);
    try {
      const page = await w2Request<ProductPage>(["brands", brandId, "products"], { query: { limit: "50", cursor: productCursor } });
      setProducts((current) => [...current, ...page.items]);
      setProductCursor(page.nextCursor ?? null);
    } catch (error) { setLoadError(errorMessage(error)); }
    finally { setLoadingMoreProducts(false); }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    if (!selectedCategory) { setFormError("Choose an active leaf category with a published schema."); return; }
    const body = {
      title: title.trim(),
      styleCode: styleCode.trim(),
      categoryCode: selectedCategory.code,
      categorySchemaVersion: categoryDraftVersion(selectedCategory),
    };
    if (!body.title || !body.styleCode) { setFormError("Enter a product name and style code."); return; }
    const hash = JSON.stringify(body);
    if (!idempotency.current || idempotency.current.hash !== hash) idempotency.current = { hash, key: createIdempotencyKey() };

    setSaving(true);
    try {
      const session = await getCurrentSession();
      const receipt = await w2Request<CreateDraftReceipt>(["brands", brandId, "products"], {
        method: "POST", body, csrfToken: session.csrfToken, idempotencyKey: idempotency.current.key,
      });
      idempotency.current = null;
      setFormNotice("Draft saved. Opening its details…");
      router.push(`/brands/${encodeURIComponent(brandId)}/products/${encodeURIComponent(receipt.productId)}`);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally { setSaving(false); }
  }

  const filtered = useMemo(() => filteredLoadedProducts(products, searchText, activeStatus), [products, searchText, activeStatus]);
  const categoryNames = useMemo(() => new Map(categories.map(category => [category.id, categoryLabel(category, categories)])), [categories]);

  return (
    <main className={styles.page} aria-labelledby="products-title" data-screen-id="SE-08">
      <header className={styles.header}>
        <div><h1 id="products-title">{mode === "new" ? "Add a product" : "Products"}</h1><p className={styles.subtitle}>{mode === "new" ? "Create a new draft. You can add details, images, sizes and prices in the editor." : "Everything in your catalogue, from drafts to live listings."}</p></div>
        <div className={styles.headerActions}>{mode === "new" ? <Link className={styles.secondaryButton} href={"/brands/"+encodeURIComponent(brandId)+"/products"}>Back to products</Link> : <>
          <Link className={styles.secondaryButton} href={"/brands/"+encodeURIComponent(brandId)+"/imports"}>Import products</Link>
          <Link className={styles.primaryButton} href={"/brands/"+encodeURIComponent(brandId)+"/products/new"}>Add a product</Link>
        </>}</div>
      </header>



      {showForm && <section className={styles.formPanel} aria-labelledby="draft-title">
        <div className={styles.formHeading}><div><p className={styles.kicker}>STEP 1 · PRODUCT BASICS</p><h2 id="draft-title">Create a product draft</h2><p>Choose a category and save the basics. Variants, images, pricing and evidence can be added later.</p></div><span className={styles.draftBadge}>SAVES AS DRAFT</span></div>
        <form onSubmit={createDraft} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.field}><label htmlFor="product-title">Product name <span aria-hidden="true">*</span></label><input id="product-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} autoComplete="off" aria-describedby="product-title-help" /><small id="product-title-help">Use a clear name customers and your team will recognize.</small></div>
            <div className={styles.field}><label htmlFor="product-style">Style code <span aria-hidden="true">*</span></label><input id="product-style" name="styleCode" value={styleCode} onChange={(event) => setStyleCode(event.target.value)} required maxLength={128} autoComplete="off" aria-describedby="product-style-help" /><small id="product-style-help">Your brand’s unique reference for this product.</small></div>
            <div className={styles.fieldWide}>
              <label htmlFor="category-filter">Find a category</label>
              <input id="category-filter" type="search" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} placeholder="Search categories" autoComplete="off" />
              <label className={styles.visuallyHidden} htmlFor="product-category">Select an active leaf category</label>
              <select id="product-category" name="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required aria-describedby="category-help">
                <option value="">Choose a category</option>
                {visibleCategories.map((category) => <option key={category.id} value={category.id}>{categoryLabel(category, categories)}</option>)}
              </select>
              <small id="category-help">Only active leaf categories with a published schema can be selected.</small>
              {nextCursor && <button className={styles.textButton} type="button" onClick={loadMoreCategories} disabled={loadingMore}>{loadingMore ? "Loading categories…" : "Load more categories"}</button>}
            </div>
          </div>

          {selectedCategory && <div className={styles.schemaPanel} aria-live="polite">
            <div><p className={styles.kicker}>CATEGORY GUIDANCE</p><h3>{categoryLabel(selectedCategory, categories)}</h3><p>Drafts will use published schema version {categoryDraftVersion(selectedCategory)}. You can return to category fields while editing.</p></div>
            {attributeError ? <p className={styles.inlineError}>{attributeError}</p> : attributes.length > 0 ? <ul className={styles.attributeList}>{attributes.map((attribute) => <li key={`${attribute.scope}-${attribute.code}`}><span>{attribute.code}</span><small>{attribute.type}{attribute.required ? " · Required before review" : " · Optional"}</small></li>)}</ul> : <p className={styles.schemaLoading}>Loading category fields…</p>}
          </div>}

          {formError && <p className={styles.error} role="alert">{formError}</p>}
          {formNotice && <p className={styles.notice} role="status">{formNotice}</p>}
          <div className={styles.formActions}><p><span aria-hidden="true">*</span> Required to create a draft</p><button className={styles.primaryButton} type="submit" disabled={saving || loading}>{saving ? "Saving draft…" : "Save draft"}</button></div>
        </form>
      </section>}

      {mode === "list" && <section className={styles.catalogueControls} aria-label="Find and filter products">
        <label className={styles.visuallyHidden} htmlFor="product-search">Search by product name or style code</label>
        <input id="product-search" type="search" className={styles.productSearch} placeholder="Search by product name" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} />
        <div className={styles.statusTabs} role="group" aria-label="Filter by product status">
          {productStatusTabs.map(tab => <button className={activeStatus === tab.id ? styles.activeStatusTab : styles.statusTab} type="button" aria-pressed={activeStatus === tab.id} key={tab.id} onClick={() => setActiveStatus(tab.id)}>
            {tab.label} <span>{loadedTabCount(products, tab.id)}</span>
          </button>)}
        </div>
        <p className={styles.filterDisclosure}>Search and status filters apply to the {products.length} loaded product{products.length === 1 ? "" : "s"}. Load more to see additional records.</p>
      </section>}
      {mode === "list" && <section className={styles.listSection} aria-labelledby="draft-list-title">
        <h2 id="draft-list-title" className={styles.visuallyHidden}>Products by publication state</h2>
        {loading && <p className={styles.stateMessage} role="status">Loading your brand catalogue…</p>}
        {!loading && loadError && <div className={styles.errorPanel} role="alert"><strong>Catalogue unavailable</strong><p>{loadError}</p><button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div>}
        {!loading && !loadError && products.length === 0 && <div className={styles.emptyState}><span className={styles.emptyMark} aria-hidden="true">✳</span><h3>No products yet</h3><p>Your brand catalogue is empty. Start with a draft; you can add the details in stages.</p><Link className={styles.secondaryButton} href={"/brands/"+encodeURIComponent(brandId)+"/products/new"}>Add your first product</Link></div>}
        {!loading && !loadError && products.length > 0 && <>
          <div className={styles.tableWrap}><div className={styles.tableHead} aria-hidden="true"><span>Product</span><span>Status</span><span>Version</span><span>Updated</span><span>Action</span></div>
            <ul className={styles.productList}>{filtered.map((product) => <li key={product.id}>
              <Link href={`/brands/${encodeURIComponent(brandId)}/products/${encodeURIComponent(product.id)}`} className={styles.productRow}>
                <span className={styles.productCopy}><strong>{product.title}</strong><small>{product.categoryId ? categoryNames.get(product.categoryId) ?? `Style ${product.styleCode}` : `Style ${product.styleCode}`}</small></span>
                <ProductState state={product.publicationState} />
                <span className={styles.productVersion}>v{product.contentVersion}</span>
                <span className={styles.productUpdated}>{product.updatedAt && !Number.isNaN(Date.parse(product.updatedAt)) ? new Date(product.updatedAt).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}) : "Not available"}</span>
                <span className={styles.productOpen}>Open</span>
              </Link>
            </li>)}</ul>
            {filtered.length === 0 && <p className={styles.filteredEmpty}>No products in the loaded results match this search and status. Adjust the filters or load more products.</p>}
          </div>
          <div className={styles.pagination}><span>Showing {products.length} of {totalCount}</span>{productCursor && <button className={styles.textButton} type="button" onClick={loadMoreProducts} disabled={loadingMoreProducts}>{loadingMoreProducts ? "Loading products…" : "Load more products"}</button>}</div>
        </>}
      </section>}
    </main>
  );
}
