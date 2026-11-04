# Product Theme Development Requirements

Product (fashion) theme-এর জন্য interaction + visual requirements।
Source: ORZR reference video-এর frame-by-frame analysis (36 frames, প্রতি সেকেন্ডে ২টা করে,
`video/47/4799e72bca5f433b0d9199992f14458c64592e3abc8b0f1f9cc44b872741452a.mp4`)।

## 1. Showcase: The Rack (সবচেয়ে গুরুত্বপূর্ণ)

### 1.1 Visual — র‍্যাক দেখতে কেমন হবে
- **Thin dark rail**: টপ edge (35%, 0%) থেকে রাইট edge (100%, 45%) বরাবর সরু কালো
  metal bar। RailY(x) = (x-35)*0.69। **SVG line** দিয়ে আঁকা (rotated div নয় —
  exact alignment-এর জন্য)।
- **Rail hangers-এর উপরে**: Rail garment-এর body-এর মধ্যে দিয়ে যাবে না। প্রতিটা
  hanger-এর **কালো metal J-hook** rail-এর উপর দিয়ে বাঁকানো থাকবে (clearly visible,
  hook curve rail-কে wrap করে), hanger + garment rail-এর নিচে ঝুলবে।
- **Hook counter-scale**: hook SVG tilt wrapper-এর ভেতরে থাকে (hover-এ একসাথে rotate
  হয়), কিন্তু perspective scale-এর জন্য ছোট হয়ে যেত। Fix: wrapper-এর scale `s`
  দিয়ে ভাগ করে size/offset counter-scale করা — সব hanger-এ hook একই screen size-এ
  থাকে আর rail-এর উপরে থাকে।
- Rail-এ **আসল product** hanger-এ ঝুলবে — background photo নয়, প্রতিটা garment
  clickable।
- একটা garment সামনে বড় (featured, বামে), বাকিগুলো rail বেয়ে ডানে-পেছনে সাজানো,
  perspective-এ ছোট হতে হতে মিলিয়ে যায় (3D depth অনুভূতি)। Hanger X: 35% → 88%
  (non-linear, সামনে ফাঁকা বেশি)।
- Warm off-white canvas (`#f7f4ee` family), letterspaced uppercase typography,
  thin spec rows (MATERIAL / COLOR / SIZE)।

### 1.2 Interaction model — SCROLL → SELECT → EXPLORE
ভিডিওর "SCROLL - SELECT - EXPLORE" tagline-এর অর্থ:

| ধাপ | Desktop | Mobile |
|---|---|---|
| **SCROLL (browse)** | Rack area-তে mouse wheel, অথবা left-click ধরে drag | Screen-এ slide/swipe |
| **SELECT** | Garment-এর উপর **mouse hover** → সেটা সামনে এগিয়ে আসে (scale-up) + info panel (counter, নাম, দাম) | Garment **press-and-hold** → একই effect |
| **EXPLORE** | Selected garment-এ **click** → full product view | Tap → full product view |

- **কোনো ← → arrow button থাকবে না।** Navigation শুধু scroll/drag-এ।
- Hover ছাড়া garment নিজে নিজে সরে আসবে না — interaction সবসময় user-driven।

### 1.3 Technical constraints
- Storefront preview **sandboxed, zero JavaScript** — সব interaction pure HTML/CSS:
  - Hover/select: CSS `:hover` (desktop) + `:active` (mobile press-and-hold)
  - Browse: native `overflow-x: auto` scroll (touch swipe + wheel দুটোতেই কাজ করে)
  - Product view / bag: CSS `:target` modal (already proven)
- Featured garment-এর info panel hover-এ দেখাবে (per-garment panel, sibling `:has()` নয়)।

## 2. Product Page (full product view)

- "← BACK TO THE RACK ×" দিয়ে ফেরত।
- Layout: বামে product photo (+ নিচে ON BODY photo), মাঝে counter / নাম / description /
  MATERIAL-COLOR-SIZE / **দাম** / **ADD TO BAG**, ডানে Details column।
- সব ছবি একসাথে দৃশ্যমান (no-JS বলে thumbnail switching সম্ভব নয়)।

## 3. Bag → Checkout

- ADD TO BAG → bag modal: item row (thumb, নাম, qty), total, PROCEED TO CHECKOUT।
- আসল payment gateway launch-এর আগের কাজ (backlog) — theme-এ শুধু UI + সৎ note।

## 4. Accessory View

- Jewelry (ring, bracelet, necklace) হালকা panel-এ ভাসমান layout-এ।
- একই interaction model (hover → select → click → product page)।

## 5. Non-goals (এই requirements-এর বাইরে)

- Auto-play / auto-rotate carousel — সব interaction user-driven।
- Arrow/pagination button navigation।
- JavaScript-dependent কোনো effect।

## 6. Product Photo Requirements (rack rail)

- **Rail showcase is OPT-IN per product** (user 2026-11-04): merchant specifically
  selects which products appear on the rail; all uploaded products do NOT go on the rail.
- Rail-এর জন্য merchant প্রতি product-এ **minimum ৩টা photo** upload করবে:
  **front view, side view, angle view**।
- Upload-এর পর rail-এ যাওয়া photo-র **background AUTO-REMOVE** করা হবে → transparent PNG.
  Background-removed না হলে rail-এর clean cutout look আসবে না — এটা mandatory।
- **Rack rail-এ শুধু background-removed photo থাকবে** — side view (bg-removed) rail-এ দেখাবে।
- Front view → product page-এর main photo; angle view → product page-এর extra photo।
- **AI hanger generation** (user 2026-11-04): merchant-এর photo-তে product hanger-এ
  ঝুলানো না থাকলে AI দিয়ে hanger-এ ঝুলানো version generate করতে হবে —
  product on hanger, background removed, hook-tip normalized (§7 pipeline অনুযায়ী)।

## 6A. Showcase Sections (multi-select, user 2026-11-04)

একই theme-এ multiple showcase section থাকবে: **rail** (hanger rail), **spotlight**,
আর ভবিষ্যতে আরো। Merchant product upload/edit-এর সময় select করবে কোন section-এ
product দেখাবে — **multi-select**: চাইলে দুই জায়গাতেই, চাইলে এক জায়গাতে।

- **Data model:** `products.showcase_sections` (simple-array, nullable).
  e.g. `['rail']`, `['rail','spotlight']`, `[]`/`null` = default listings only.
- **API:** `CreateProductDto`/`UpdateProductDto` accept `showcaseSections?: string[]`
  (validated against `SHOWCASE_SECTIONS = ['rail','spotlight']`).
- **Merchant UI:** `/dashboard` AddProductForm-এ "SHOW IN:" checkboxes
  (Hanger Rail, Spotlight).
- **Rail filtering (fashion clothing only):** rail-এ শুধু সেই product আসবে যার
  `showcaseSections` contains `'rail'` AND category/collection = clothing/fashion.
  জুতা বা অন্য category-র product rail-এ উঠবে না — merchant opt-in করলেও
  category mismatch হলে rail filter বাদ দেবে।
- **Spotlight:** `showcaseSections` contains `'spotlight'` → spotlight section-এ।

## 7. Auto Hanger Detection System (merchant upload pipeline)

Merchant hanger-সহ photo upload করলে system automatically hanger detect করে rail-এ বসাবে।

### 7.1 Pipeline
1. **Background removal** → transparent PNG (rembg)
2. **Hook tip detection** → hanger-এর সবচেয়ে উপরের point খুঁজে বের করা
3. **Normalization** → 700×1000 canvas-এ hook tip (350, 10)-এ আনা
4. **Rail placement** → perspective scale + position

### 7.2 Math (physics লাগে না)
এটা pure **geometry/coordinate math** — physics simulation দরকার নেই। Photo-তেই
natural hanging capture করা আছে; আমাদের শুধু সঠিক position-এ বসাতে হবে।

- **Tip detection**: Top-down scan। প্রথম row যেখানে ≥3px opaque cluster (width ≤30px)
  → সেটাই hook tip। Hook সরু, তাই narrow cluster খোঁজা হয়।
- **Normalization**: Affine translation। `T = (350 - x_tip, 10 - y_tip)`।
  Image-কে T দিয়ে shift করলে tip (350,10)-এ আসে।
- **Rail placement**: Perspective projection। `scale = 0.8 / (1 + 0.12*dd)` —
  সামনে আসলে বড়, পেছনে ছোট। Hook tip transform-origin-এ pin করা থাকে।

### 7.3 Script
`scripts/auto_hanger.py` — এক কমান্ডে পুরো pipeline:
```bash
python scripts/auto_hanger.py input.jpg -o output.png
```

---
*Derived 2026-11-03 from user corrections after v3 rejection. v3-এর flat horizontal
scroll-strip explicitly rejected — "র‍্যাকটা এরকম হবেনা"।*
*§7 added 2026-11-04: auto hanger detection per user request — "মার্চেন্টরা হ্যাঙ্গার
সহ ফটো আপলোড করলে যেনো রেশিও বুঝে অটোমেটিক সেট হয়"।*
