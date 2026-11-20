export type SourceProfile = "SHOPIFY" | "UNICOMMERCE" | "RENIVET" | "GENERIC";

const shopifyHeaders = [
  "Title", "URL handle", "Description", "Vendor", "Product category", "Type", "Tags",
  "Published on online store", "Status", "SKU", "Variant Barcodes", "Option1 name", "Option1 value",
  "Option1 Linked To", "Option2 name", "Option2 value", "Option2 Linked To", "Option3 name", "Option3 value",
  "Option3 Linked To", "Price", "Compare-at price", "Cost per item", "Charge tax", "Tax code",
  "Unit price total measure", "Unit price total measure unit", "Unit price base measure", "Unit price base measure unit",
  "Inventory tracker", "Inventory quantity", "Continue selling when out of stock", "Weight value (grams)",
  "Weight unit for display", "Requires shipping", "Fulfillment service", "Product image URL", "Image position",
  "Image alt text", "Variant image URL", "Gift card", "SEO title", "SEO description",
  "Color (product.metafields.shopify.color-pattern)", "Google Shopping / Google product category",
  "Google Shopping / Gender", "Google Shopping / Age group", "Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name", "Google Shopping / Ads labels", "Google Shopping / Condition",
  "Google Shopping / Custom product", "Google Shopping / Custom label 0", "Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2", "Google Shopping / Custom label 3", "Google Shopping / Custom label 4",
  "Packed product length", "Packed product width", "Packed product height", "Packed product dimension unit",
] as const;

const shopifyExample: Record<string, string> = {
  Title: "Physical Product \"The Band\" T-Shirt",
  "URL handle": "physical-product-the-band-t-shirt",
  Description: "Celebrate the timeless legacy of one of rock music's most influential groups with our exclusive The Band Graphic T-Shirt.",
  Vendor: "Harmony Threads",
  "Product category": "Apparel & Accessories > Clothing > Clothing Tops > T-Shirts",
  Type: "Graphic shirt",
  Tags: "Unisex, Clothing, Men, Women, Casual, Vintage",
  "Published on online store": "TRUE",
  Status: "Active",
  SKU: "TheBandTShirt-SG",
  "Variant Barcodes": "4006381333931",
  "Option1 name": "Size",
  "Option1 value": "Small",
  "Option2 name": "Color",
  "Option2 value": "green",
  Price: "19.99",
  "Compare-at price": "24.99",
  "Cost per item": "11.00",
  "Charge tax": "TRUE",
  "Inventory tracker": "shopify",
  "Inventory quantity": "47",
  "Continue selling when out of stock": "DENY",
  "Weight value (grams)": "150",
  "Weight unit for display": "g",
  "Requires shipping": "TRUE",
  "Fulfillment service": "manual",
  "Product image URL": "https://example.com/catalog/the-band-tshirt-green.jpg",
  "Image position": "1",
  "Image alt text": "Green t-shirt with The Band graphic",
  "Gift card": "FALSE",
  "SEO title": "Vintage The Band Graphic T-Shirt: Iconic Rock Music Tribute Tee",
  "SEO description": "Celebrate the legacy of rock icons with our exclusive The Band Graphic T-Shirt.",
  "Color (product.metafields.shopify.color-pattern)": "green",
  "Google Shopping / Google product category": "Apparel & Accessories > Clothing > Shirts & Tops",
  "Google Shopping / Gender": "Unisex",
  "Google Shopping / Age group": "adult",
  "Google Shopping / Manufacturer part number (MPN)": "TSH-12345-GRY-S",
  "Google Shopping / Ad group name": "Rock Band Graphic Tees",
  "Google Shopping / Ads labels": "Music Merch",
  "Google Shopping / Condition": "New",
  "Google Shopping / Custom product": "FALSE",
  "Packed product length": "30",
  "Packed product width": "20",
  "Packed product height": "3",
  "Packed product dimension unit": "cm",
};

// Uniware Item Master fields are deliberately distinct from Shopify's product export.
// Use one row per SKU; sourceAsOf is collected separately in the import wizard.
const unicommerceHeaders = [
  "categoryCode", "skuCode", "name", "type", "color", "size",
  "maxRetailPrice", "basePrice", "imageUrl", "externalItemId",
] as const;

const unicommerceExample: Record<string, string> = {
  categoryCode: "TSHIRTS",
  skuCode: "BAND-TEE-GRN-S",
  name: "The Band Graphic T-Shirt - Green - Small",
  type: "SIMPLE",
  color: "Green",
  size: "S",
  maxRetailPrice: "2499",
  basePrice: "1999",
  imageUrl: "https://example.com/catalog/the-band-tshirt-green.jpg",
  externalItemId: "BAND-TEE",
};

const templates: Record<SourceProfile, { headers: readonly string[]; example: Record<string, string> }> = {
  SHOPIFY: { headers: shopifyHeaders, example: shopifyExample },
  UNICOMMERCE: { headers: unicommerceHeaders, example: unicommerceExample },
  RENIVET: { headers: ["styleCode", "title", "sku", "categoryCode", "color", "size", "mrp"], example: {} },
  GENERIC: { headers: ["title", "styleCode", "sku", "categoryCode"], example: {} },
};

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function buildImportTemplateCsv(profile: SourceProfile): string {
  const template = templates[profile];
  const example = template.headers.map((header) => csvCell(template.example[header] ?? ""));
  return `${template.headers.map(csvCell).join(",")}\n${example.join(",")}\n`;
}
