# REN2-117 · W3 shopper-context and CU-22 policy prototype alignment

The approved `w1-w2-ideal-prototype-2026-11-17.zip` explicitly marks CU-01, CU-03, CU-05A, CU-05B and CU-06 as **W3 context only** (NOT W1/W2 API delivery), and CU-22 as a W3/W4 legal placeholder.

| Screen | Route | Implemented visual structure | Contract still needed |
| --- | --- | --- | --- |
| CU-01 | `/` | Source-patterned hero, craft discovery and 8-item product-card skeleton grid | Public catalogue browse/search W3, only live approved products |
| CU-03 | `/shop/products/:productId` | Large product gallery, details, unavailable size/bag/save controls, claim evidence panel | Published revision read, effective approved price, verified claims, variant ATP, wishlist/cart |
| CU-05A | `/shop/brands` | Responsive 3-card brand directory skeleton + no-data disclosure | Approved/active public brand directory |
| CU-05B | `/shop/brands/:slug` | Brand motif banner, maker story/verification areas, product tile skeleton | Reviewed public brand profile and published products |
| CU-06 | `/shop/saved` | Source-patterned empty state, sign-in with return target, no fake saved items | Authenticated, persistent W3 wishlist |
| CU-22 | `/legal/:policy` | Centred legal placeholder and explicit owner approval state for privacy/terms/returns/shipping | Legally approved versioned copy, effective date, retention/handling policies |

These are **visual/structural W3 context implementations, not a claimed W3 launch**. Product prices, user favorites, approved sustainability claims, availability, customer consent, legal wording and seller profiles must **not** come from fictional prototype seed data. No non-existent endpoint was called or substituted with static success.

Pending: owner-approved W3 APIs and release wave, legal reviewed wording, real data E2E, 1280/390px independent screenshot comparison, accessibility and security/privacy tests. W1/W2 architecture and activation gates are unchanged.

Parent: https://linear.app/renivet/issue/REN2-117.
