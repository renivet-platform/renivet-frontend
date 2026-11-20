import assert from "node:assert/strict";
import test from "node:test";
import { buildImportTemplateCsv } from "@/features/seller/import-templates";

test("Shopify import template matches the supported export contract and includes a valid example row", () => {
    const csv = buildImportTemplateCsv("SHOPIFY");
    const rows = csv.trimEnd().split("\n");

    assert.equal(rows[0], "Title,URL handle,Description,Vendor,Product category,Type,Tags,Published on online store,Status,SKU,Variant Barcodes,Option1 name,Option1 value,Option1 Linked To,Option2 name,Option2 value,Option2 Linked To,Option3 name,Option3 value,Option3 Linked To,Price,Compare-at price,Cost per item,Charge tax,Tax code,Unit price total measure,Unit price total measure unit,Unit price base measure,Unit price base measure unit,Inventory tracker,Inventory quantity,Continue selling when out of stock,Weight value (grams),Weight unit for display,Requires shipping,Fulfillment service,Product image URL,Image position,Image alt text,Variant image URL,Gift card,SEO title,SEO description,Color (product.metafields.shopify.color-pattern),Google Shopping / Google product category,Google Shopping / Gender,Google Shopping / Age group,Google Shopping / Manufacturer part number (MPN),Google Shopping / Ad group name,Google Shopping / Ads labels,Google Shopping / Condition,Google Shopping / Custom product,Google Shopping / Custom label 0,Google Shopping / Custom label 1,Google Shopping / Custom label 2,Google Shopping / Custom label 3,Google Shopping / Custom label 4,Packed product length,Packed product width,Packed product height,Packed product dimension unit");
    assert.equal(rows.length, 2);
    assert.match(rows[1], /physical-product-the-band-t-shirt/);
    assert.match(rows[1], /TheBandTShirt-SG/);
});

test("Unicommerce has its own Item Master headers and a populated SKU example", () => {
  const csv = buildImportTemplateCsv("UNICOMMERCE");
  const rows = csv.trimEnd().split("\n");
  assert.equal(rows.length, 2);
  assert.equal(rows[0], "categoryCode,skuCode,name,type,color,size,maxRetailPrice,basePrice,imageUrl,externalItemId");
  assert.match(rows[1], /BAND-TEE-GRN-S/);
  assert.match(rows[1], /TSHIRTS/);
  assert.match(rows[1], /2499/);
  assert.ok(!rows[0].includes("sourceAsOf"), "export timestamp is provided in the import wizard");
});

test("Shopify and Unicommerce templates use different, source-specific schemas", () => {
  const shopify = buildImportTemplateCsv("SHOPIFY").split("\n")[0];
  const uniware = buildImportTemplateCsv("UNICOMMERCE").split("\n")[0];
  assert.notEqual(shopify, uniware);
  assert.ok(shopify.includes("URL handle") && shopify.includes("Option1 value"));
  assert.ok(uniware.includes("skuCode") && uniware.includes("maxRetailPrice"));
  assert.ok(!uniware.includes("URL handle"));
});

test("Shopify example CSV correctly quotes commas and embedded quotation marks", () => {
  const rows = buildImportTemplateCsv("SHOPIFY").trimEnd().split("\n");
  assert.match(rows[1], /^"Physical Product ""The Band"" T-Shirt"/);
  assert.match(rows[1], /"Unisex, Clothing, Men, Women, Casual, Vintage"/);
});
