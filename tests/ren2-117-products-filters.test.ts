import assert from "node:assert/strict";
import test from "node:test";
import { filteredLoadedProducts, loadedTabCount, productStatusTabs } from "../src/features/seller/product-list-filters";
import type { ProductSummary } from "../src/features/seller/w2-catalog";

const rows = [
  ["Ajrakh cotton shirt", "AJK-1", "PUBLISHED"],
  ["Block print dress", "BLK-1", "REJECTED"],
  ["Dabu tote", "DB-2", "DRAFT"],
  ["Indigo kurta", "IND-2", "PENDING_REVIEW"],
  ["Soft cotton jacket", "COT-3", "APPROVED"],
  ["Mashru stole", "MS-4", "RESTRICTED"],
  ["Pending kurta", "PND-2", "RE_REVIEW"],
] as const;

const products: ProductSummary[] = rows.map(([title,styleCode,publicationState],i) => ({
  id: String(i), brandId:"brand-1", title, styleCode, publicationState, contentVersion:i+1,
}));

test("SE-08 tabs reflect exact backend enum states, without duplicate or fake rows",()=>{
  assert.equal(loadedTabCount(products,"all"),7);
  assert.equal(loadedTabCount(products,"draft"),1);
  assert.equal(loadedTabCount(products,"changes"),1);
  assert.equal(loadedTabCount(products,"review"),2);
  assert.equal(loadedTabCount(products,"approved"),1);
  assert.equal(loadedTabCount(products,"live"),1);
  assert.equal(loadedTabCount(products,"restricted"),1);
  assert.deepEqual(productStatusTabs.map(tab=>tab.id),["all","draft","changes","review","approved","live","restricted"]);
});

test("SE-08 search and tabs combine, ignore case and trim query",()=>{
  assert.deepEqual(filteredLoadedProducts(products,"  Ajra  ","all").map(product=>product.styleCode),["AJK-1"]);
  assert.deepEqual(filteredLoadedProducts(products,"Kurta","review").map(product=>product.styleCode),["IND-2","PND-2"]);
  assert.deepEqual(filteredLoadedProducts(products,"cotton","live").map(product=>product.styleCode),["AJK-1"]);
  assert.equal(filteredLoadedProducts(products,"missing","all").length,0);
});

test("SE-08 filtering never expands beyond the loaded backend page",()=>{
  const loadedOnly = products.slice(0,2);
  assert.deepEqual(filteredLoadedProducts(loadedOnly,"","all").map(p=>p.id),["0","1"]);
  assert.equal(loadedTabCount(loadedOnly,"review"),0);
});
