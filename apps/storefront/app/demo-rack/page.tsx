'use client';

import { useState, useRef, useEffect } from 'react';

type DemoProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
  material: string;
  color: string;
  size: string;
  onBodyImageUrl: string;
  category: string; // e.g. 'clothing', 'shoes'
};

const CATEGORIES = [
  { id: 'clothing', label: 'Clothing', desc: 'Shirts, blousons, blazers on the hanger rail' },
  { id: 'shoes', label: 'Shoes', desc: 'Footwear — grid view, no rail' },
  { id: 'accessory', label: 'Accessories', desc: 'Belts, bags & more' },
];

const PRODUCTS: DemoProduct[] = [
  {
    id: 'p1', name: 'Air Shell Blouson', price: 12800, currency: 'BDT',
    imageUrl: '/demo/w01.png',
    description: 'A lightweight blouson in airy shell fabric.',
    material: 'Nylon 100%', color: 'Beige', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p2', name: 'Oversized Shirt', price: 8900, currency: 'BDT',
    imageUrl: '/demo/w02.png',
    description: 'A relaxed oversized shirt in washed cotton.',
    material: 'Cotton 100%', color: 'Black', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p3', name: 'Pale Over Shirt', price: 9200, currency: 'BDT',
    imageUrl: '/demo/w03.png',
    description: 'A pale over shirt in washed cotton.',
    material: 'Cotton 95% / Silk 5%', color: 'Pale Grey', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p4', name: 'Long Wool Blouson', price: 14500, currency: 'BDT',
    imageUrl: '/demo/w04.png',
    description: 'A long wool blouson for cold days.',
    material: 'Wool 80% / Nylon 20%', color: 'Grey', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p5', name: 'Wool Overcoat', price: 18900, currency: 'BDT',
    imageUrl: '/demo/w05.png',
    description: 'A tailored wool overcoat in deep black.',
    material: 'Wool 90% / Cashmere 10%', color: 'Black', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p6', name: 'Essential Tee', price: 2900, currency: 'BDT',
    imageUrl: '/demo/w06.png',
    description: 'A clean essential tee in heavy cotton.',
    material: 'Cotton 100%', color: 'White', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p7', name: 'Loopback Hoodie', price: 6900, currency: 'BDT',
    imageUrl: '/demo/w07.png',
    description: 'A relaxed hoodie in loopback cotton.',
    material: 'Cotton 100%', color: 'Grey', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p8', name: 'Tailored Blazer', price: 15900, currency: 'BDT',
    imageUrl: '/demo/w08.png',
    description: 'A sharp tailored blazer in navy wool.',
    material: 'Wool 100%', color: 'Navy', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p9', name: 'Leather Riders', price: 24500, currency: 'BDT',
    imageUrl: '/demo/w09.png',
    description: 'A brown leather riders jacket.',
    material: 'Cowhide Leather', color: 'Brown', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p10', name: 'Fisherman Sweater', price: 7900, currency: 'BDT',
    imageUrl: '/demo/w10.png',
    description: 'A chunky cream knit fisherman sweater.',
    material: 'Wool 100%', color: 'Cream', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p11', name: 'Denim Trucker', price: 8900, currency: 'BDT',
    imageUrl: '/demo/w11.png',
    description: 'A dark indigo denim trucker jacket.',
    material: 'Denim 100%', color: 'Indigo', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p12', name: 'Camel Overcoat', price: 19900, currency: 'BDT',
    imageUrl: '/demo/w12.png',
    description: 'A long camel wool overcoat.',
    material: 'Wool 85% / Cashmere 15%', color: 'Camel', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p13', name: 'Turtleneck Knit', price: 5900, currency: 'BDT',
    imageUrl: '/demo/w13.png',
    description: 'A black turtleneck in fine knit.',
    material: 'Wool 70% / Nylon 30%', color: 'Black', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p14', name: 'Stripe Oxford', price: 6900, currency: 'BDT',
    imageUrl: '/demo/w14.png',
    description: 'A blue stripe oxford shirt.',
    material: 'Cotton 100%', color: 'Blue Stripe', size: '1 / 2',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
  {
    id: 'p15', name: 'Field Jacket', price: 12900, currency: 'BDT',
    imageUrl: '/demo/w15.png',
    description: 'An olive field jacket in ripstop.',
    material: 'Cotton 65% / Nylon 35%', color: 'Olive', size: 'M / L',
    onBodyImageUrl: '/demo/onbody-shirt.jpg',
    category: 'clothing',
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmt = (p: DemoProduct) => `৳${p.price.toLocaleString('en-US')}`;

// Spotlight products (user 2026-11-04: single pages like the reference video)
const SHOE_PRODUCTS = [
  { name: 'RUNNER SNEAKER', price: 8900, img: '/demo/shoes/shoe1.png', tag: 'SALE' as const, desc: 'A featherlight runner with responsive cushioning.', material: 'Engineered Mesh', color: 'Ember Orange', sizes: ['40', '41', '42', '43', '44'] },
  { name: 'LEATHER LOAFER', price: 12500, img: '/demo/shoes/shoe2.png', tag: 'DISC' as const, disc: '-20%', desc: 'Hand-finished leather loafer, all-day comfort.', material: 'Full-grain Leather', color: 'Cognac Brown', sizes: ['40', '41', '42', '43', '44'] },
  { name: 'TRAIL BOOT', price: 14800, img: '/demo/shoes/shoe3.png', tag: 'PRICE' as const, desc: 'Rugged trail boot with all-terrain grip.', material: 'Nubuck / Gore-Tex', color: 'Midnight Black', sizes: ['40', '41', '42', '43', '44'] },
  { name: 'MINIMAL WHITE', price: 6900, img: '/demo/shoes/shoe4.png', tag: 'SALE' as const, desc: 'Clean minimal sneaker in crisp white.', material: 'Premium Leather', color: 'White', sizes: ['40', '41', '42', '43', '44'] },
];
const PERF_PRODUCTS = [
  { name: 'OUD ROYALE', price: 6800, tint: '#d4a84b', img: '/demo/perfumes/perf1.png', tag: 'SALE' as const, desc: 'Smoked oud wrapped in golden amber. A scent of quiet power.', notes: 'Oud · Amber · Sandalwood' },
  { name: 'CITRUS BLOOM', price: 4500, tint: '#e8c86a', img: '/demo/perfumes/perf2.png', tag: 'DISC' as const, disc: '-15%', desc: 'Sunlit citrus over white florals. Bright, weightless, alive.', notes: 'Bergamot · Neroli · Musk' },
  { name: 'MIDNIGHT MUSK', price: 7200, tint: '#8b8bd4', img: '/demo/perfumes/perf3.png', tag: 'PRICE' as const, desc: 'Dark musk and ink-blue woods for after hours.', notes: 'Black Musk · Cedar · Vetiver' },
  { name: 'OCEAN BREEZE', price: 5100, tint: '#6ab8d4', img: '/demo/perfumes/perf4.png', tag: 'SALE' as const, desc: 'Salt air and cold water. Minimal, marine, precise.', notes: 'Sea Salt · Sage · Driftwood' },
  { name: 'ROSE LUNE', price: 8400, tint: '#d48a9a', img: '/demo/perfumes/perf5.png', tag: 'DISC' as const, disc: '-15%', desc: 'Moonlit rose in a glass orb. Romantic, modern, unforgettable.', notes: 'Damask Rose · Peony · Moonflower' },
];

// PANTS — "Shop the Look" (user 2026-11-04, from Nike reference video analysis)
const PANT_LOOKS = [
  {
    name: 'STUDIO DAY', img: '/demo/pants/look1.png',
    items: [
      { name: 'BAGGY DENIM JEAN', price: 5900 },
      { name: 'ESSENTIAL WHITE TEE', price: 1800 },
      { name: 'RUNNER SNEAKER', price: 8900, img: '/demo/shoes/shoe1.png' },
    ],
  },
  {
    name: 'CITY NIGHT', img: '/demo/pants/look2.png',
    items: [
      { name: 'BLACK CARGO PANT', price: 6800 },
      { name: 'OVERSIZED BLACK TEE', price: 2200 },
      { name: 'TRAIL BOOT', price: 14800, img: '/demo/shoes/shoe3.png' },
    ],
  },
  {
    name: 'OFF DUTY', img: '/demo/pants/look3.png',
    items: [
      { name: 'PLEATED WIDE TROUSER', price: 7500 },
      { name: 'CREAM KNIT SWEATER', price: 4900 },
      { name: 'LEATHER LOAFER', price: 12500, img: '/demo/shoes/shoe2.png' },
    ],
  },
  {
    name: 'WEEKEND', img: '/demo/pants/look4.png',
    items: [
      { name: 'BAGGY SWEATPANT', price: 3800 },
      { name: 'MATCHING HOODIE', price: 4200 },
      { name: 'MINIMAL WHITE', price: 6900, img: '/demo/shoes/shoe4.png' },
    ],
  },
];

export default function DemoRackPage() {
  // Category > Rail > Detail flow (user 2026-11-04)
  const category = 'clothing'; // rail is the clothing category page (user 2026-11-04)
  const [offset, setOffset] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  // View mode: rail (75%) -> single (55%) -> page (50%), smooth transition
  // (User 2026-11-04: card width 75% for showcase, 55% for single, 50/50 for product page)
  const [viewMode, setViewMode] = useState<'rail' | 'single' | 'page'>('rail');
  // Detail enter/exit animation phase (user 2026-11-04: smooth transition to detail)
  const [detailAnim, setDetailAnim] = useState<'enter' | 'idle' | 'exit'>('idle');
  // Cart + wishlist + checkout (user 2026-11-04: customer can purchase from detail page)
  const [cart, setCart] = useState<{ idx: number; size: string; qty: number }[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'done'>('cart');
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  // Spotlight glow color (merchant-selectable, user 2026-11-04)
  const [glowColor, setGlowColor] = useState('#ff6b35'); // default orange
  const [spotHovered, setSpotHovered] = useState<string | null>(null);
  const [spotSingle, setSpotSingle] = useState<{ type: 'shoe' | 'perf'; idx: number } | null>(null); // single product view (user 2026-11-04, like reference video)
  const [spotAnim, setSpotAnim] = useState<'enter' | 'idle' | 'exit'>('idle'); // zoom transition (user 2026-11-04)
  const spotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spotScrollY = useRef(0);
  const openSpot = (type: 'shoe' | 'perf', idx: number) => {
    if (spotTimer.current) clearTimeout(spotTimer.current);
    spotScrollY.current = window.scrollY;
    setSpotSingle({ type, idx });
    setSpotAnim('enter');
    spotTimer.current = setTimeout(() => setSpotAnim('idle'), 700);
  };
  const closeSpot = () => {
    if (spotTimer.current) clearTimeout(spotTimer.current);
    setSpotAnim('exit');
    spotTimer.current = setTimeout(() => {
      setSpotSingle(null); setSpotAnim('idle');
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, spotScrollY.current)));
    }, 600);
  };
  // PANTS "Shop the Look" (user 2026-11-04)
  const [pantSingle, setPantSingle] = useState<number | null>(null);
  const [pantAnim, setPantAnim] = useState<'enter' | 'idle' | 'exit'>('idle');
  const [pantOffset, setPantOffset] = useState(0); // horizontal scroll
  const pantTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pantScrollY = useRef(0);
  const openPant = (i: number) => {
    if (pantTimer.current) clearTimeout(pantTimer.current);
    pantScrollY.current = window.scrollY;
    setPantSingle(i);
    setPantAnim('enter');
    pantTimer.current = setTimeout(() => setPantAnim('idle'), 700);
  };
  const closePant = () => {
    if (pantTimer.current) clearTimeout(pantTimer.current);
    setPantAnim('exit');
    pantTimer.current = setTimeout(() => {
      setPantSingle(null); setPantAnim('idle');
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, pantScrollY.current)));
    }, 600);
  };
  // Detail selectors
  const [selSize, setSelSize] = useState('');
  const [selQty, setSelQty] = useState(1);
  // Gallery: photo carousel in main card (user 2026-11-04)
  const [galleryIdx, setGalleryIdx] = useState(0);
  // Suppress hover for 600ms after click (bug fix 2026-11-04: after click, products
  // slide and a different hanger can end up under the stationary mouse, causing a
  // "stuck" tilt. Ignore pointer-enter until the user actually moves the mouse.)
  const lastClickAt = useRef(0);
  const mouseMovedSinceClick = useRef(true);
  const target = useRef(0);
  const drag = useRef<{ x: number; off: number } | null>(null);
  const raf = useRef(0);

  // smooth follow
  useEffect(() => {
    const tick = () => {
      setOffset((prev) => {
        const d = target.current - prev;
        if (Math.abs(d) < 0.002) return target.current;
        return prev + d * 0.14;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const CAT_PRODUCTS = PRODUCTS.filter((p) => p.category === category);
  const n = CAT_PRODUCTS.length;

  // Wheel scrolling DISABLED per user 2026-11-04 ("স্ক্রোল অফ")
  // Each notch = 1 product logic kept but not bound.
  const onWheel = (_e: React.WheelEvent) => {
    // Disabled
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (detail !== null) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, off: target.current };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || detail !== null) return;
    const dx = e.clientX - drag.current.x;
    target.current = clamp(drag.current.off - dx * 0.006, 0, n - 1);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    target.current = clamp(Math.round(target.current), 0, n - 1);
  };

  // Click behavior (User 2026-11-04):
  // - Click back product -> moves directly to front (no detail yet)
  // - Second click (on front product) -> opens product detail page (smooth enter)
  const detailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openDetail = (i: number) => {
    if (detailTimer.current) clearTimeout(detailTimer.current);
    setDetail(i);
    setDetailAnim('enter');
    setViewMode('page');
    setSelSize(''); setSelQty(1); setGalleryIdx(0);
    detailTimer.current = setTimeout(() => setDetailAnim('idle'), 700);
  };

  const handleClick = (i: number) => {
    const frontIdx = Math.round(offset);
    if (detail !== null) {
      // Detail already open: clicking another product brings it to front
      if (i !== detail) {
        target.current = i;
        setDetail(i);
      }
      return;
    }
    if (i === frontIdx) {
      // Already front, detail not open -> open detail (second click) = product page (50/50)
      if (detailTimer.current) clearTimeout(detailTimer.current);
      setDetail(i);
      setDetailAnim('enter');
      setViewMode('page');
      setHovered(null); // clear hover so tilt doesn't stick after click
      setSelSize(''); setSelQty(1); setGalleryIdx(0); // reset selectors
      // settle to idle after enter animation
      detailTimer.current = setTimeout(() => setDetailAnim('idle'), 700);
    } else {
      // Back product -> bring to front only = single showcase (55%)
      // (rAF easing gives the smooth back-to-front slide)
      target.current = i;
      setViewMode('single');
      setHovered(null); // clear hover so tilt doesn't stick after click (bug fix 2026-11-04)
      lastClickAt.current = Date.now();
      mouseMovedSinceClick.current = false;
    }
  };

  // Back from detail -> smooth exit, then return to rail view (75%)
  const closeDetail = () => {
    if (detailTimer.current) clearTimeout(detailTimer.current);
    setDetailAnim('exit');
    detailTimer.current = setTimeout(() => {
      setDetail(null);
      setDetailAnim('idle');
      setViewMode('rail');
    }, 600);
  };

  const addToBag = (i: number, size: string, qty: number) => {
    setCart((c) => [...c, { idx: i, size, qty }]);
  };

  const toggleWishlist = (i: number) => {
    setWishlist((w) => w.includes(i) ? w.filter((x) => x !== i) : [...w, i]);
  };

  const featIdx = Math.round(offset);
  // Right panel shows hovered product's details; falls back to front product (user 2026-11-04)
  const feat = hovered !== null ? CAT_PRODUCTS[clamp(hovered, 0, n - 1)] : CAT_PRODUCTS[clamp(featIdx, 0, n - 1)];

  // Rail: thin dark bar from top-left to right-middle (matches reference photo).
  // Reference: rail from (18%, 0%) to (100%, 56%), ~29deg visual.
  // Hangers hang BELOW the rail; hooks go up over it.
  // railY(x): y = (x-35)*0.69  [from (35,0) top edge to (100,45) right edge — touches card edges 2026-11-04]
  const railY = (x: number) => (x - 35) * 0.69;
  const HX0 = 35, WOOD_BELOW_RAIL = 6; // wood 6% below rail (rail from top edge x=35)
  // Perspective spacing: wider gaps at front, narrower at back
  const hangerX = (dd: number) => {
    const t = Math.min(dd, 14) / 14;
    return HX0 + 53 * Math.pow(t, 0.85); // 35 -> 88
  };
  const hookPos = (dd: number) => {
    const x = hangerX(dd);
    return { x, y: railY(x) + WOOD_BELOW_RAIL };
  };
  const perspScale = (dd: number) => 0.8 / (1 + 0.12 * dd); // all bigger, gentle falloff

  const garmentStyle = (i: number): React.CSSProperties => {
    const d = i - offset;
    const dd = Math.max(0, d);
    const { x: hx, y: hy } = hookPos(dd);
    // fade out beyond the rail area instead of hiding
    let opacity = 1;
    if (d < 0) opacity = Math.max(0, 1 + d * 0.8);       // scrolled past front -> fade
    if (dd > 10) opacity = Math.max(0, 1 - (dd - 10) * 0.45); // past rail end -> fade
    // Hovered: stays at rail position, no z-jump (user 2026-11-04: "সামনে আসবেনা").
    const baseZ = 100 - Math.round(dd * 10);
    const zIndex = baseZ;
    return {
      position: 'absolute',
      left: `${hx}%`,
      top: `${hy}%`,
      width: 0,
      height: 0,
      zIndex,
      opacity,
      pointerEvents: opacity < 0.3 ? 'none' : 'auto',
      cursor: 'pointer',
    };
  };

  // Wrapper that rotates img + hook TOGETHER around the hanger point.
  // (User 2026-11-04: hook is part of the hanger, never detaches —
  // "বাকা হলে হ্যাংগারের সাথে ওটাও হবে". Angle reversed per user: -30deg,
  // reduced from -45deg so it stays within the card.)
  const tiltWrapperStyle = (i: number): React.CSSProperties => {
    const d = i - offset;
    const dd = Math.max(0, d);
    const isFront = dd === 0;
    const isHov = hovered === i && !isFront;
    const s = perspScale(dd) * (isHov ? 1.2 : 1);
    const transform = isHov
      ? `scale(${s}) rotate(-30deg)`
      : `scale(${s})`;
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      transform,
      transformOrigin: '0 0', // hanger point
      transition: 'transform .25s ease',
    };
  };

  const imgStyle = (i: number): React.CSSProperties => {
    return {
      position: 'absolute',
      left: -350,
      top: -10,
      width: 700,
      height: 1000,
      filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.15))',
      pointerEvents: 'none', // hover handled by hit zone only
    };
  };

  // Metal wire hook: J-shape, curve centered EXACTLY on rail point.
  // FIXED screen size/position — counter-scales against the wrapper's perspScale
  // so back hangers' hooks stay ON the rail (user 2026-11-04: back hooks looked off-rail).
  // The hook still ROTATES with the wrapper on hover (hook is part of hanger).
  const wireHookStyle = (s: number): React.CSSProperties => {
    const w = 44 / s, h = 56 / s;
    return {
      position: 'absolute',
      left: -10 / s, // SVG x=10 at container x=0 (rail center)
      top: -41 / s, // SVG y=4 (tip) at container y=-37 (rail); bottom at +10 (overlaps wood)
      width: w,
      height: h,
      pointerEvents: 'none',
      zIndex: 400,
    };
  };

  return (
    <div style={{ fontFamily: 'system-ui', background: '#f7f4ee', minHeight: '100vh' }}>
      {/* page transition keyframes with motion blur (user 2026-11-04) */}
      <style>{`
        @keyframes bb-page-in {
          0% { opacity: 0; transform: scale(0.94); filter: blur(10px); }
          55% { opacity: 1; filter: blur(4px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes bb-page-out {
          0% { opacity: 1; transform: scale(1); filter: blur(0); }
          45% { opacity: 1; filter: blur(4px); }
          100% { opacity: 0; transform: scale(0.94); filter: blur(10px); }
        }
      `}</style>
      {/* nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', fontSize: 12, letterSpacing: 3 }}>
        <span>ORZR</span>
        <div style={{ display: 'flex', gap: 28 }}>
          <span style={{ borderBottom: '1px solid #1c1a17' }}>CLOTHING</span>
          <span style={{ color: '#999' }}>ACCESSORY</span>
          <span style={{ color: '#999' }}>JOURNAL</span>
          <span style={{ color: '#999' }}>ABOUT</span>
        </div>
        <span style={{ color: '#999' }}>SEARCH&nbsp;&nbsp;MENU&nbsp;&nbsp;☰&nbsp;&nbsp;<span onClick={() => { setCartOpen(true); setCheckoutStep('cart'); }} style={{ cursor: 'pointer', color: '#1c1a17' }}>BAG{cart.length > 0 ? ` (${cart.length})` : ''}</span></span>
      </div>

      {spotSingle !== null ? (
        /* ---------- SPOTLIGHT SINGLE VIEW (like reference video: full-section takeover, smooth zoom + motion blur) ---------- */
        (() => {
          const zAnim =
            spotAnim === 'enter'
              ? 'bb-page-in 0.7s ease forwards'
              : spotAnim === 'exit'
                ? 'bb-page-out 0.6s ease forwards'
                : 'none';
          return (
            <div style={{ transformOrigin: 'center top', animation: zAnim }}>
              {spotSingle.type === 'shoe' ? (
          /* SHOE SINGLE — ORZR light + video layout: title left, big shoe on shelf, details right */
          (() => {
            const sp = SHOE_PRODUCTS[spotSingle.idx];
            return (
              <div style={{ background: '#f7f4ee', minHeight: '86vh', padding: '24px 48px 64px', position: 'relative' }}>
                <button onClick={closeSpot} style={{ background: 'none', border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer', marginBottom: 24, color: '#1c1a17' }}>
                  ← BACK TO SHOES ×
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'start', maxWidth: 1200, margin: '0 auto' }}>
                  {/* LEFT: big shoe on glowing shelf */}
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: 3, color: '#999', margin: '0 0 4px' }}>SHOES / SPOTLIGHT</p>
                    <h1 style={{ fontSize: 34, letterSpacing: 3, fontWeight: 700, margin: '0 0 32px', color: '#1c1a17' }}>{sp.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minHeight: 380 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sp.img} alt={sp.name} style={{ width: 520, height: 'auto', maxHeight: 380, objectFit: 'contain', objectPosition: 'bottom', display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: 520, height: 4, borderRadius: 2, background: 'rgba(160,150,135,0.35)', boxShadow: `0 10px 32px ${glowColor}, 0 0 60px ${glowColor}88` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: 520, height: 48, borderRadius: '50%', background: `radial-gradient(ellipse at center, ${glowColor}66 0%, transparent 70%)` }} />
                    </div>
                  </div>
                  {/* RIGHT: details panel (like video: price top, spec rows, pill button) */}
                  <div style={{ paddingTop: 64 }}>
                    <p style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#1c1a17' }}>৳{sp.price.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>{sp.desc}</p>
                    <div style={{ borderTop: '1px solid #e7dfd3', padding: '12px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12, letterSpacing: 1 }}>
                      <span style={{ color: '#999' }}>MATERIAL</span><span style={{ color: '#1c1a17' }}>{sp.material}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e7dfd3', padding: '12px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12, letterSpacing: 1 }}>
                      <span style={{ color: '#999' }}>COLOR</span><span style={{ color: '#1c1a17' }}>{sp.color}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e7dfd3', borderBottom: '1px solid #e7dfd3', padding: '12px 0', fontSize: 12, letterSpacing: 1 }}>
                      <p style={{ color: '#999', margin: '0 0 10px' }}>SIZE (EU)</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {sp.sizes.map((s) => (
                          <button key={s} onClick={() => setSelSize(s)} style={{ minWidth: 48, padding: '10px 0', border: selSize === s ? '2px solid #1c1a17' : '1px solid #ddd', borderRadius: 8, background: selSize === s ? '#1c1a17' : '#fff', color: selSize === s ? '#fff' : '#1c1a17', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => { if (!selSize) { alert('Please select a size'); return; } setCartOpen(true); setCheckoutStep('cart'); }} style={{ marginTop: 24, width: '100%', padding: '16px 0', borderRadius: 999, border: 'none', background: '#1c1a17', color: '#f7f4ee', fontSize: 13, letterSpacing: 2, fontWeight: 700, cursor: 'pointer' }}>
                      ADD TO BAG · ৳{sp.price.toLocaleString('en-IN')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* PERFUME SINGLE — dark BASALTE like video: left panel, right lit niche */
          (() => {
            const sp = PERF_PRODUCTS[spotSingle.idx];
            return (
              <div style={{ background: '#0c0b09', minHeight: '86vh', padding: '24px 48px 64px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, background: 'radial-gradient(ellipse 500px 400px at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 60%)' }} />
                <button onClick={closeSpot} style={{ background: 'none', border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer', marginBottom: 24, color: '#e8e4dc', position: 'relative' }}>
                  ← BACK TO PERFUMES ×
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48, alignItems: 'stretch', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
                  {/* LEFT: brand + name + details (like video) */}
                  <div style={{ paddingTop: 32 }}>
                    <p style={{ fontSize: 12, letterSpacing: 4, color: '#888', margin: '0 0 16px' }}>BASALTE</p>
                    <h1 style={{ fontSize: 44, fontWeight: 300, fontStyle: 'italic', color: '#e8e4dc', margin: '0 0 16px', letterSpacing: 1 }}>{sp.name.charAt(0) + sp.name.slice(1).toLowerCase()}</h1>
                    <p style={{ fontSize: 14, color: '#999', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 380 }}>{sp.desc}</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 0', fontSize: 12, letterSpacing: 1 }}>
                      <p style={{ color: '#666', margin: '0 0 6px' }}>NOTES</p>
                      <p style={{ color: '#e8e4dc', margin: 0 }}>{sp.notes}</p>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 0', fontSize: 12, letterSpacing: 1 }}>
                      <p style={{ color: '#666', margin: '0 0 6px' }}>SIZE</p>
                      <p style={{ color: '#e8e4dc', margin: 0 }}>100 ml · Eau de Parfum</p>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 700, color: '#e8e4dc', margin: '24px 0' }}>৳{sp.price.toLocaleString('en-IN')}</p>
                    <button onClick={() => { setCartOpen(true); setCheckoutStep('cart'); }} style={{ width: '100%', maxWidth: 340, padding: '16px 0', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: '#e8e4dc', color: '#0c0b09', fontSize: 13, letterSpacing: 2, fontWeight: 700, cursor: 'pointer' }}>
                      ADD TO BAG
                    </button>
                  </div>
                  {/* RIGHT: enlarged lit niche with bottle */}
                  <div style={{ position: 'relative', minHeight: 640, borderRadius: 4, overflow: 'hidden', background: '#0a0908' }}>
                    <div style={{ position: 'absolute', inset: '0 18%', background: 'url(/demo/perfumes/stone-bg.jpg) center/cover', filter: 'brightness(0.55)' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '8%', width: '10%', background: 'linear-gradient(90deg, #000 0%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, right: '8%', width: '10%', background: 'linear-gradient(-90deg, #000 0%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)', width: 36, height: 12, borderRadius: 6, background: '#fffdf5', boxShadow: '0 0 36px 14px rgba(255,244,220,0.9), 0 0 70px 24px rgba(255,244,220,0.4)' }} />
                    <div style={{ position: 'absolute', top: '4%', left: '22%', right: '22%', height: '70%', background: 'linear-gradient(180deg, rgba(255,240,210,0.55) 0%, rgba(255,240,210,0.2) 45%, transparent 100%)', clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0% 100%)', filter: 'blur(3px)' }} />
                    <div style={{ position: 'absolute', top: '12%', left: 0, right: 0, bottom: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sp.img} alt={sp.name} style={{ width: 220, height: 'auto', maxHeight: 420, objectFit: 'contain', objectPosition: 'bottom', display: 'block', filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.7)) brightness(1.35)' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: '8%', right: '8%', height: 140, background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 0.25, transform: 'scaleY(-1)', filter: 'blur(2px)', maskImage: 'linear-gradient(180deg, black 0%, transparent 70%)', WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 70%)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sp.img} alt="" style={{ width: 220, height: 'auto', maxHeight: 140, objectFit: 'contain', objectPosition: 'top', display: 'block' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
            </div>
          );
        })()
      ) : detail === null ? (
        /* ---------- CATEGORY PAGE: rail section + scroll-down spotlight sections ---------- */
        <div>
          {/* RAIL SECTION */}
          <div style={{ padding: '24px 32px 0' }}>
            <p style={{ fontSize: 11, letterSpacing: 3, color: '#999', marginBottom: 4 }}>CLOTHING</p>
            <h1 style={{ fontSize: 28, letterSpacing: 4, fontWeight: 400, margin: '0 0 16px' }}>THE RAIL</h1>
          </div>
        <div style={{ padding: '0 32px' }}>
        <div style={{ display: 'flex', height: '72vh', gap: 32 }}>
          {/* LEFT: card with rail (modern: transparent, subtle border) */}
          <div style={{
            width: viewMode === 'rail' ? '75%' : '55%',
            height: '100%',
            transition: 'width 0.5s ease',
          }}>
            <div style={{
              background: 'transparent', borderRadius: 20,
              border: '1px solid #e7dfd3',
              height: '100%', position: 'relative', overflow: 'hidden',
            }}>
              <div
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={(e) => { mouseMovedSinceClick.current = true; onPointerMove(e); }}
                onPointerUp={onPointerUp}
                onPointerLeave={() => { onPointerUp(); setHovered(null); }}
                style={{ position: 'relative', height: '100%', overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab', userSelect: 'none' }}
              >
                {/* rail: thin dark bar through hook positions, BEHIND hangers (SVG for exact alignment) */}
                {(() => {
                  const x1 = 35, y1 = railY(35), x2 = 100, y2 = railY(100);
                  return (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1c1a17" strokeWidth="0.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  );
                })()}
                {CAT_PRODUCTS.map((p, i) => {
                  const d = i - offset;
                  const dd = Math.max(0, d);
                  const fade = d < 0 ? Math.max(0, 1 + d * 0.8) : dd > 10 ? Math.max(0, 1 - (dd - 10) * 0.45) : 1;
                  const isHov = hovered === i && dd !== 0;
                  return (
                  <div
                    key={p.id}
                    style={garmentStyle(i)}
                    onClick={() => handleClick(i)}
                  >
                    {/* tilt wrapper: img + hook rotate TOGETHER (hook is part of hanger) */}
                    <div style={tiltWrapperStyle(i)}>
                      {/* wood hanger top aligned to rail point */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.name} draggable={false} style={imgStyle(i)}
                      />
                      {/* thick black J-hook over the rail (matches reference) — wide curve wraps OVER rail */}
                      <svg viewBox="0 0 44 56" style={{...wireHookStyle(perspScale(dd) * (isHov ? 1.2 : 1)), width: 44 / (perspScale(dd) * (isHov ? 1.2 : 1)), height: 56 / (perspScale(dd) * (isHov ? 1.2 : 1))}}>
                        <path d="M22 56 C22 36, 22 24, 22 18 C22 8, 14 2, 7 4 C1 6, 1 14, 8 16"
                              fill="none" stroke="#1c1a17" strokeWidth="7" strokeLinecap="round" />
                      </svg>
                    </div>
                    {/* Invisible hit zone ON TOP, small area around hanger (does NOT move during tilt) */}
                    <div
                      style={{
                        position: 'absolute', left: -60, top: -60, width: 120, height: 120,
                        opacity: 0, pointerEvents: fade > 0.3 ? 'auto' : 'none',
                        zIndex: 500,
                      }}
                      onPointerEnter={() => { if (mouseMovedSinceClick.current) setHovered(i); }}
                      onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                    />
                    {hovered === i && (
                      <div style={{ position: 'absolute', left: -100, top: -140, width: 200, background: 'rgba(247,244,238,0.95)', border: '1px solid #e5e0d8', padding: '12px 14px', pointerEvents: 'none', zIndex: 600 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 2, color: '#999' }}>{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</p>
                        <p style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{fmt(p)}</p>
                      </div>
                    )}
                  </div>
                  );
                })}
                <p style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', fontSize: 10, letterSpacing: 3, color: '#aaa', margin: 0 }}>
                  CLICK TO PEEK&nbsp;&nbsp;↔&nbsp;&nbsp;CLICK AGAIN TO FOLLOW
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: product info */}
          <div style={{
            width: viewMode === 'rail' ? '25%' : '45%',
            height: '100%', display: 'flex', alignItems: 'center',
            transition: 'width 0.5s ease',
          }}>
            <div style={{ maxWidth: 380 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: 2, color: '#999' }}>
                {String(featIdx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </p>
              <h2 style={{ margin: '0 0 14px', fontSize: 28, letterSpacing: 5, textTransform: 'uppercase', fontWeight: 400, lineHeight: 1.3 }}>{feat.name}</h2>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#777', lineHeight: 1.7 }}>{feat.description}</p>
              <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 1, color: '#555' }}>MATERIAL&nbsp;&nbsp;{feat.material}</p>
              <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 1, color: '#555' }}>COLOR&nbsp;&nbsp;{feat.color}</p>
              <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 1, color: '#555' }}>SIZE&nbsp;&nbsp;{feat.size}</p>
              <p style={{ margin: '12px 0 18px', fontSize: 22, fontWeight: 600 }}>{fmt(feat)}</p>
              <button onClick={() => { if (detailTimer.current) clearTimeout(detailTimer.current); setDetail(featIdx); setDetailAnim('enter'); setViewMode('page'); detailTimer.current = setTimeout(() => setDetailAnim('idle'), 700); }} style={{ background: 'none', border: 'none', borderBottom: '1px solid #1c1a17', padding: '0 0 3px', fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                VIEW DETAILS&nbsp;&nbsp;↗
              </button>
              <p style={{ margin: '24px 0 0', fontSize: 12, letterSpacing: 2, color: '#999' }}>
                <span style={{ cursor: 'pointer' }} onClick={() => { target.current = clamp(featIdx - 1, 0, n - 1); }}>←</span>
                &nbsp;&nbsp;&nbsp;{String(featIdx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}&nbsp;&nbsp;&nbsp;
                <span style={{ cursor: 'pointer' }} onClick={() => { target.current = clamp(featIdx + 1, 0, n - 1); }}>→</span>
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* ---------- SPOTLIGHT: SHOES (ORZR style — light, floating shelves + merchant glow) ---------- */}
        <div style={{ background: '#f7f4ee', padding: '64px 32px', marginTop: 48, borderTop: '1px solid #e7dfd3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, color: '#999', marginBottom: 4 }}>SPOTLIGHT</p>
              <h2 style={{ fontSize: 24, letterSpacing: 4, fontWeight: 400, margin: '0 0 8px', color: '#1c1a17' }}>SHOES</h2>
              <p style={{ fontSize: 13, color: '#777', margin: 0 }}>A different perspective.</p>
            </div>
            {/* Merchant glow color selector */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#999', letterSpacing: 1 }}>GLOW:</span>
              {['#ff6b35', '#ff2d78', '#00a8cc', '#8b5cf6', '#16a34a'].map((c) => (
                <div
                  key={c}
                  onClick={() => setGlowColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: glowColor === c ? '2px solid #1c1a17' : '2px solid #ddd',
                    boxShadow: glowColor === c ? `0 0 12px ${c}88` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {SHOE_PRODUCTS.map((sp, si) => {
              const key = `shoe-${si}`;
              const isHov = spotHovered === key;
              return (
                <div
                  key={si}
                  onMouseEnter={() => setSpotHovered(key)}
                  onMouseLeave={() => setSpotHovered(null)}
                  onClick={() => openSpot('shoe', si)}
                  style={{ cursor: 'pointer', position: 'relative', padding: '16px 8px 48px', background: 'transparent' }}
                >
                  {/* real shoe photo — sole stays fixed on shelf, scales 1.25x from bottom */}
                  <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sp.img} alt={sp.name} style={{ width: 260, height: 'auto', maxHeight: 200, objectFit: 'contain', objectPosition: 'bottom', display: 'block', marginBottom: -2, transform: isHov ? 'scale(1.25)' : 'scale(1)', transformOrigin: 'bottom center', transition: 'transform 0.4s ease' }} />
                  </div>
                  {/* hanging price tag — always visible */}
                  <div style={{
                    position: 'absolute', top: 16, right: 28,
                    transform: isHov ? 'rotate(10deg)' : 'rotate(-6deg)',
                    transition: 'transform 0.4s ease', transformOrigin: 'top center',
                  }}>
                    {/* string loop */}
                    <div style={{
                      width: 28, height: 36, border: '2px solid #1c1a17', borderRadius: '50%',
                      borderBottomColor: 'transparent', borderLeftColor: 'transparent',
                      transform: 'rotate(-30deg)', margin: '0 auto -8px', position: 'relative', zIndex: 1,
                    }} />
                    {/* tag */}
                    <div style={{
                      background: sp.tag === 'SALE' ? '#ff6b35' : sp.tag === 'DISC' ? '#dc2626' : '#fffdf8',
                      color: sp.tag === 'PRICE' ? '#1c1a17' : '#fff',
                      borderRadius: '8px 8px 8px 8px',
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)',
                      padding: '14px 12px 18px', minWidth: 64, textAlign: 'center',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
                      position: 'relative',
                    }}>
                      {/* hole */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', background: '#f7f4ee',
                        border: '2px solid #1c1a17', margin: '0 auto 6px',
                      }} />
                      <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.95, marginBottom: 3, fontWeight: 700 }}>
                        {sp.tag === 'SALE' ? 'SALE' : sp.tag === 'DISC' ? '' : 'PRICE'}
                      </div>
                      {sp.tag === 'DISC' && (
                        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, marginBottom: 3 }}>
                          {sp.disc}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 800 }}>
                        ৳{sp.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  {/* thin glass-like shelf, shoe-width */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: 0 }}>
                    <div style={{
                      width: 260, height: 3, borderRadius: 2,
                      background: 'rgba(160,150,135,0.35)',
                      boxShadow: isHov ? `0 8px 24px ${glowColor}, 0 0 40px ${glowColor}88` : '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'box-shadow 0.4s ease',
                    }} />
                  </div>
                  {/* glow pool — only on hover */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: 260, height: 32, borderRadius: '50%',
                      background: isHov ? `radial-gradient(ellipse at center, ${glowColor}88 0%, transparent 70%)` : 'transparent',
                      transition: 'background 0.4s ease',
                    }} />
                  </div>
                  {/* name floats up smoothly on hover */}
                  <div style={{
                    textAlign: 'center', marginTop: 12,
                    opacity: isHov ? 1 : 0,
                    transform: isHov ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}>
                    <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, color: '#1c1a17' }}>{sp.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- SPOTLIGHT: PERFUME (BASALTE style — dark stone niches) ---------- */}
        <div style={{ background: '#0c0b09', padding: '64px 32px 80px', position: 'relative', overflow: 'hidden' }}>
          {/* stone texture overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
            background: `
              radial-gradient(ellipse 400px 300px at 20% 30%, rgba(255,255,255,0.03) 0%, transparent 60%),
              radial-gradient(ellipse 500px 400px at 80% 70%, rgba(255,255,255,0.02) 0%, transparent 60%),
              radial-gradient(ellipse 300px 200px at 50% 50%, rgba(0,0,0,0.3) 0%, transparent 70%)
            `,
          }} />
          <p style={{ fontSize: 11, letterSpacing: 3, color: '#666', marginBottom: 4, position: 'relative' }}>SPOTLIGHT</p>
          <h2 style={{ fontSize: 24, letterSpacing: 4, fontWeight: 400, margin: '0 0 8px', color: '#e8e4dc', position: 'relative' }}>PERFUME</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, position: 'relative', marginTop: 32 }}>
            {PERF_PRODUCTS.map((sp, si) => {
              const key = `perf-${si}`;
              const isHov = spotHovered === key;
              return (
                <div
                  key={si}
                  onMouseEnter={() => setSpotHovered(key)}
                  onMouseLeave={() => setSpotHovered(null)}
                  onClick={() => openSpot('perf', si)}
                  style={{ cursor: 'pointer', position: 'relative', height: 720 }}
                >
                  {/* 3D niche — outer frame */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: '#0a0908',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    {/* back wall — stone texture */}
                    <div style={{
                      position: 'absolute', inset: '0 18% 0 18%',
                      background: `url(/demo/perfumes/stone-bg.jpg) center/cover`,
                      filter: 'brightness(0.55)',
                    }} />
                    {/* left wall — receding into darkness */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: '8%', width: '10%',
                      background: 'linear-gradient(90deg, #000 0%, transparent 100%)',
                    }} />
                    {/* right wall — receding into darkness */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, right: '8%', width: '10%',
                      background: 'linear-gradient(-90deg, #000 0%, transparent 100%)',
                    }} />
                    {/* top wall shadow */}
                    <div style={{
                      position: 'absolute', top: 0, left: '8%', right: '8%', height: '12%',
                      background: 'linear-gradient(180deg, #000 0%, transparent 100%)',
                    }} />
                    {/* ambient side glow — soft spill on walls for realism */}
                    <div style={{
                      position: 'absolute', top: '5%', left: '10%', right: '10%', height: '50%',
                      background: isHov
                        ? 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,240,210,0.18) 0%, transparent 70%)'
                        : 'transparent',
                      transition: 'opacity 0.5s ease',
                      opacity: isHov ? 1 : 0,
                      filter: 'blur(8px)',
                      pointerEvents: 'none',
                    }} />
                    {/* wall wash — light spilling on side walls */}
                    <div style={{
                      position: 'absolute', top: '8%', bottom: '30%', left: '12%', width: '15%',
                      background: isHov
                        ? 'linear-gradient(90deg, rgba(255,240,210,0.12) 0%, transparent 100%)'
                        : 'transparent',
                      transition: 'opacity 0.5s ease',
                      opacity: isHov ? 1 : 0,
                      filter: 'blur(6px)',
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', top: '8%', bottom: '30%', right: '12%', width: '15%',
                      background: isHov
                        ? 'linear-gradient(-90deg, rgba(255,240,210,0.12) 0%, transparent 100%)'
                        : 'transparent',
                      transition: 'opacity 0.5s ease',
                      opacity: isHov ? 1 : 0,
                      filter: 'blur(6px)',
                      pointerEvents: 'none',
                    }} />
                    {/* recessed spotlight fixture */}
                    <div style={{
                      position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)',
                      width: 32, height: 10, borderRadius: 5,
                      background: isHov ? '#fffdf5' : '#2a2a2a',
                      boxShadow: isHov ? '0 0 32px 12px rgba(255,244,220,0.9), 0 0 60px 20px rgba(255,244,220,0.4)' : 'none',
                      transition: 'all 0.5s ease',
                    }} />
                    {/* natural light cone — soft, from fixture */}
                    <div style={{
                      position: 'absolute', top: '4%', left: '25%', right: '25%', height: '65%',
                      background: isHov
                        ? 'linear-gradient(180deg, rgba(255,240,210,0.55) 0%, rgba(255,240,210,0.25) 40%, rgba(255,240,210,0.08) 70%, transparent 100%)'
                        : 'linear-gradient(180deg, rgba(255,240,210,0.12) 0%, transparent 60%)',
                      clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0% 100%)',
                      transition: 'opacity 0.5s ease',
                      filter: 'blur(3px)',
                    }} />
                    {/* bottle — smaller, deep in niche */}
                    <div style={{ position: 'absolute', top: '15%', left: 0, right: 0, bottom: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'visible' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sp.img} alt={sp.name} style={{ width: 130, height: 'auto', maxHeight: 280, objectFit: 'contain', objectPosition: 'bottom', display: 'block', transform: isHov ? 'scale(1.15)' : 'scale(1)', transformOrigin: 'bottom center', transition: 'transform 0.5s ease', filter: `drop-shadow(0 12px 20px rgba(0,0,0,0.7)) brightness(${isHov ? 1.35 : 0.95})` }} />
                    </div>
                    {/* reflective floor */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: '8%', right: '8%', height: 120,
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }} />
                    {/* bottle reflection */}
                    <div style={{
                      position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center',
                      opacity: 0.25, transform: 'scaleY(-1)', filter: 'blur(2px)',
                      maskImage: 'linear-gradient(180deg, black 0%, transparent 70%)',
                      WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 70%)',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sp.img} alt="" style={{ width: 130, height: 'auto', maxHeight: 100, objectFit: 'contain', objectPosition: 'top', display: 'block' }} />
                    </div>
                  </div>
                  {/* hanging price tag — dark styled */}
                  <div style={{
                    position: 'absolute', top: '6%', right: '4%',
                    transform: isHov ? 'rotate(10deg)' : 'rotate(-6deg)',
                    transition: 'transform 0.4s ease', transformOrigin: 'top center',
                    zIndex: 5,
                  }}>
                    <div style={{
                      width: 24, height: 32, border: '2px solid #e8e4dc', borderRadius: '50%',
                      borderBottomColor: 'transparent', borderLeftColor: 'transparent',
                      transform: 'rotate(-30deg)', margin: '0 auto -7px', position: 'relative', zIndex: 1,
                      opacity: 0.8,
                    }} />
                    <div style={{
                      background: sp.tag === 'SALE' ? '#ff6b35' : sp.tag === 'DISC' ? '#dc2626' : '#1c1a17',
                      color: '#fff',
                      border: sp.tag === 'PRICE' ? '1px solid rgba(255,255,255,0.2)' : 'none',
                      borderRadius: 8,
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)',
                      padding: '12px 10px 16px', minWidth: 58, textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      position: 'relative',
                    }}>
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%', background: '#0c0b09',
                        border: '2px solid #e8e4dc', margin: '0 auto 5px', opacity: 0.8,
                      }} />
                      <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.95, marginBottom: 2, fontWeight: 700 }}>
                        {sp.tag === 'SALE' ? 'SALE' : sp.tag === 'DISC' ? '' : 'PRICE'}
                      </div>
                      {sp.tag === 'DISC' && (
                        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, marginBottom: 2 }}>
                          {sp.disc}
                        </div>
                      )}
                      <div style={{ fontSize: 11, fontWeight: 800 }}>
                        ৳{sp.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  {/* name — elegant, appears on hover */}
                  <div style={{
                    position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center',
                    opacity: isHov ? 1 : 0,
                    transform: isHov ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}>
                    <p style={{ margin: 0, fontSize: 13, letterSpacing: 3, color: '#e8e4dc', fontWeight: 300 }}>{sp.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* title bottom-left like BASALTE */}
          <p style={{ fontSize: 28, fontWeight: 300, letterSpacing: 2, color: '#e8e4dc', margin: '48px 0 0', position: 'relative', fontStyle: 'italic' }}>
            The night collection
          </p>
        </div>

        {/* ---------- PANTS: SHOP THE LOOK (from Nike reference video, user 2026-11-04) ---------- */}
        {pantSingle === null ? (
          <div style={{ background: '#f7f4ee', padding: '64px 0 80px', overflow: 'hidden' }}>
            <div style={{ padding: '0 32px', marginBottom: 32 }}>
              <p style={{ fontSize: 11, letterSpacing: 3, color: '#999', marginBottom: 4 }}>PANTS</p>
              <h2 style={{ fontSize: 24, letterSpacing: 2, fontWeight: 400, margin: 0, color: '#1c1a17' }}>Shop the Look.</h2>
            </div>
            {/* horizontal filmstrip — drag/scroll */}
            <div
              onWheel={(e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; setPantOffset((o) => Math.max(0, Math.min(PANT_LOOKS.length - 1, o + (e.deltaY > 0 ? 0.4 : -0.4)))); }}
              style={{ display: 'flex', gap: 24, padding: '0 32px', transform: `translateX(${-pantOffset * 320}px)`, transition: 'transform 0.5s ease', cursor: 'grab' }}
            >
              {PANT_LOOKS.map((lk, li) => (
                <div key={li} onClick={() => openPant(li)} style={{ flexShrink: 0, width: 296, cursor: 'pointer' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lk.img} alt={lk.name} style={{ width: 296, height: 420, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#e8e4dc' }} />
                  <p style={{ margin: '12px 0 0', fontSize: 12, letterSpacing: 2, color: '#1c1a17' }}>{lk.name}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>{lk.items.length} items · from ৳{Math.min(...lk.items.map((i) => i.price)).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2, color: '#aaa', marginTop: 24 }}>← SCROLL / DRAG →</p>
          </div>
        ) : (
          /* PANTS SINGLE — zoom takeover like video: label left, big model center, items right */
          (() => {
            const lk = PANT_LOOKS[pantSingle];
            const zAnim =
              pantAnim === 'enter'
                ? 'bb-page-in 0.7s ease forwards'
                : pantAnim === 'exit'
                  ? 'bb-page-out 0.6s ease forwards'
                  : 'none';
            return (
              <div style={{ background: '#f7f4ee', minHeight: '86vh', padding: '24px 48px 64px', transformOrigin: 'center top', animation: zAnim }}>
                <button onClick={closePant} style={{ background: 'none', border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer', marginBottom: 24, color: '#1c1a17' }}>
                  ← BACK TO LOOKS ×
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 48, alignItems: 'start', maxWidth: 1280, margin: '0 auto' }}>
                  {/* LEFT: look label */}
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ fontSize: 12, letterSpacing: 3, color: '#999', margin: 0 }}>{lk.name}</p>
                    <p style={{ fontSize: 13, color: '#666', marginTop: 12, lineHeight: 1.6 }}>Complete the look —<br />every piece, one click.</p>
                  </div>
                  {/* CENTER: big model */}
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lk.img} alt={lk.name} style={{ width: '100%', height: '68vh', objectFit: 'cover', borderRadius: 12, display: 'block', background: '#e8e4dc' }} />
                  </div>
                  {/* RIGHT: items panel (like video) */}
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ fontSize: 11, letterSpacing: 3, color: '#999', margin: '0 0 16px' }}>SHOP THE LOOK</p>
                    {lk.items.map((it, ii) => (
                      <div key={ii} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: ii === 0 ? '1px solid #e7dfd3' : 'none', borderBottom: '1px solid #e7dfd3' }}>
                        {it.img ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={it.img} alt={it.name} style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#fff', display: 'block' }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: '#e8e4dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', letterSpacing: 1 }}>ORZR</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, letterSpacing: 1, color: '#1c1a17' }}>{it.name}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#1c1a17' }}>৳{it.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setCartOpen(true); setCheckoutStep('cart'); }} style={{ marginTop: 20, width: '100%', padding: '16px 0', borderRadius: 999, border: 'none', background: '#1c1a17', color: '#f7f4ee', fontSize: 13, letterSpacing: 2, fontWeight: 700, cursor: 'pointer' }}>
                      SHOP THE LOOK
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}
        </div>
      ) : (
        /* ---------- DETAIL VIEW (smooth enter/exit) ---------- */
        (() => {
          const p = CAT_PRODUCTS[detail];
          const zAnim =
            detailAnim === 'enter'
              ? 'bb-page-in 0.7s ease forwards'
              : detailAnim === 'exit'
                ? 'bb-page-out 0.6s ease forwards'
                : 'none';
          return (
            <div style={{ padding: '8px 32px 40px', transformOrigin: 'center top', animation: zAnim }}>
              <button onClick={closeDetail} style={{ background: 'none', border: 'none', fontSize: 11, letterSpacing: 2, cursor: 'pointer', marginBottom: 16 }}>
                ← BACK TO COLLECTION ×
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
                {/* LEFT 50%: photo gallery carousel (main card) */}
                {(() => {
                  // 5 photos per product (user 2026-11-04: 4-5 photos)
                  const photos = [
                    { src: p.imageUrl, label: 'Front' },
                    { src: p.imageUrl, label: 'Side' },
                    { src: p.imageUrl, label: 'Angle' },
                    { src: p.onBodyImageUrl, label: 'On Body' },
                    { src: p.imageUrl, label: 'Back' },
                  ];
                  const gi = galleryIdx % photos.length;
                  return (
                    <div>
                      <div style={{ position: 'relative', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photos[gi].src} alt={`${p.name} - ${photos[gi].label}`} style={{ width: '100%', height: '58vh', objectFit: 'contain', display: 'block' }} />
                        {/* left/right arrows */}
                        <button onClick={() => setGalleryIdx((g) => (g - 1 + photos.length) % photos.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: '1px solid #ddd', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontSize: 18 }}>‹</button>
                        <button onClick={() => setGalleryIdx((g) => (g + 1) % photos.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: '1px solid #ddd', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontSize: 18 }}>›</button>
                        {/* counter */}
                        <div style={{ position: 'absolute', left: 16, bottom: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '8px 18px', fontSize: 14, fontWeight: 600 }}>
                          {gi + 1} | {photos.length}
                        </div>
                      </div>
                      {/* thumbnails with color variations */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        {photos.map((ph, idx) => (
                          <div key={idx} onClick={() => setGalleryIdx(idx)} style={{ cursor: 'pointer', border: gi === idx ? '2px solid #1c1a17' : '2px solid transparent', borderRadius: 8, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ph.src} alt={ph.label} style={{ width: 72, height: 90, objectFit: 'cover', display: 'block' }} />
                          </div>
                        ))}
                        {/* color variation thumbnails */}
                        {['Beige', 'Black'].map((c) => (
                          <div key={c} title={c} style={{ cursor: 'pointer', border: '2px solid transparent', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photos[0].src} alt={c} style={{ width: 72, height: 90, objectFit: 'cover', display: 'block', filter: c === 'Black' ? 'brightness(0.4)' : 'none' }} />
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, textAlign: 'center', padding: '2px 0' }}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {/* RIGHT 50%: detailed description only (no photos) */}
                <div>
                  <p style={{ fontSize: 11, letterSpacing: 2, color: '#888' }}>{String(detail + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</p>
                  <h2 style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 400 }}>{p.name}</h2>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{p.description}</p>
                  <p style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>MATERIAL&nbsp;&nbsp;{p.material}</p>
                  {/* COLOR selector */}
                  <p style={{ fontSize: 11, letterSpacing: 2, color: '#888', margin: '0 0 8px' }}>COLOR — {p.color}</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[p.color, 'Black', 'White'].filter((c, idx, arr) => arr.indexOf(c) === idx).map((c) => (
                      <div key={c} title={c} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #1c1a17', background: c.toLowerCase().includes('beige') ? '#d4c5a9' : c.toLowerCase().includes('black') ? '#1c1a17' : '#f5f5f5', cursor: 'pointer' }} />
                    ))}
                  </div>
                  {/* SIZE selector */}
                  <p style={{ fontSize: 11, letterSpacing: 2, color: '#888', margin: '0 0 8px' }}>SIZE</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {['S', 'M', 'L', 'XL'].map((s) => (
                      <button key={s} onClick={() => setSelSize(s)} style={{ minWidth: 44, padding: '10px 0', border: selSize === s ? '2px solid #1c1a17' : '1px solid #ddd', background: selSize === s ? '#1c1a17' : '#fff', color: selSize === s ? '#fff' : '#1c1a17', cursor: 'pointer', fontSize: 13 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {/* QUANTITY selector */}
                  <p style={{ fontSize: 11, letterSpacing: 2, color: '#888', margin: '0 0 8px' }}>QUANTITY</p>
                  <div style={{ display: 'flex', gap: 0, marginBottom: 20, alignItems: 'center' }}>
                    <button onClick={() => setSelQty((q) => Math.max(1, q - 1))} style={{ width: 40, height: 40, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 18 }}>−</button>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{selQty}</span>
                    <button onClick={() => setSelQty((q) => Math.min(9, q + 1))} style={{ width: 40, height: 40, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 18 }}>+</button>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 600 }}>{fmt(p)}</p>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                    <button onClick={() => { if (!selSize) { alert('Please select a size'); return; } addToBag(detail, selSize, selQty); setCartOpen(true); setCheckoutStep('cart'); }} style={{ background: '#1c1a17', color: '#f7f4ee', border: 'none', padding: '14px 36px', fontSize: 12, letterSpacing: 3, cursor: 'pointer' }}>ADD TO BAG</button>
                    <button onClick={() => toggleWishlist(detail)} style={{ background: '#fff', color: '#1c1a17', border: '1px solid #1c1a17', padding: '14px 20px', fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>
                      {wishlist.includes(detail) ? '♥ WISHLISTED' : '♡ WISHLIST'}
                    </button>
                  </div>
                  {/* DETAILED DESCRIPTION (text only) */}
                  <div style={{ borderTop: '1px solid #e7dfd3', paddingTop: 20 }}>
                    <p style={{ fontSize: 11, letterSpacing: 2, color: '#888', margin: '0 0 12px' }}>DETAILS</p>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: '0 0 12px' }}>
                      {p.description} Crafted with attention to detail, this piece combines comfort
                      with timeless style. The {p.material.toLowerCase()} fabric ensures durability
                      while maintaining a soft hand-feel.
                    </p>
                    <p style={{ fontSize: 12, color: '#777', lineHeight: 1.8, margin: 0 }}>
                      • Material: {p.material}<br />
                      • Color: {p.color}<br />
                      • Fit: Regular fit<br />
                      • Care: Machine wash cold, hang dry<br />
                      • Made for everyday wear
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
      {/* ---------- CART DRAWER + CHECKOUT ---------- */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, maxWidth: '90vw', background: '#f7f4ee', padding: 28, overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, letterSpacing: 3 }}>YOUR BAG ({cart.length})</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            {checkoutStep === 'done' ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ fontSize: 40, margin: '0 0 16px' }}>✓</p>
                <h3 style={{ fontSize: 16, letterSpacing: 2 }}>ORDER PLACED</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>ধন্যবাদ{orderName ? `, ${orderName}` : ''}! আপনার অর্ডার পৌঁছে যাবে।</p>
                <button onClick={() => { setCartOpen(false); setCart([]); setCheckoutStep('cart'); }} style={{ marginTop: 16, background: '#1c1a17', color: '#f7f4ee', border: 'none', padding: '12px 28px', fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>CONTINUE SHOPPING</button>
              </div>
            ) : checkoutStep === 'form' ? (
              <div>
                <p style={{ fontSize: 12, letterSpacing: 2, color: '#888', marginBottom: 16 }}>DELIVERY DETAILS</p>
                <input value={orderName} onChange={(e) => setOrderName(e.target.value)} placeholder="নাম" style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                <input value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} placeholder="মোবাইল নম্বর" style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                <textarea value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} placeholder="ডেলিভারি ঠিকানা" rows={3} style={{ width: '100%', padding: 12, marginBottom: 16, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
                <button onClick={() => setCheckoutStep('done')} disabled={!orderName || !orderPhone || !orderAddress} style={{ width: '100%', background: !orderName || !orderPhone || !orderAddress ? '#ccc' : '#1c1a17', color: '#f7f4ee', border: 'none', padding: '14px', fontSize: 12, letterSpacing: 2, cursor: 'pointer', marginBottom: 12 }}>PLACE ORDER · {fmt({ price: cart.reduce((s, it) => s + CAT_PRODUCTS[it.idx].price * it.qty, 0) } as any)}</button>
                <button onClick={() => setCheckoutStep('cart')} style={{ width: '100%', background: 'none', border: '1px solid #ccc', padding: '12px', fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>← BACK TO BAG</button>
              </div>
            ) : (
              <div>
                {cart.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#888', textAlign: 'center', paddingTop: 40 }}>Your bag is empty.</p>
                ) : (
                  <>
                    {cart.map((item, idx) => {
                      const cp = CAT_PRODUCTS[item.idx];
                      return (
                        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cp.imageUrl} alt={cp.name} style={{ width: 64, height: 80, objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 12, letterSpacing: 1 }}>{cp.name}</p>
                            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#888' }}>Size: {item.size} × {item.qty}</p>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{fmt({ price: cp.price * item.qty } as any)}</p>
                          </div>
                          <button onClick={() => setCart((c) => c.filter((_, j) => j !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>×</button>
                        </div>
                      );
                    })}
                    <div style={{ borderTop: '1px solid #ddd', paddingTop: 16, marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, letterSpacing: 1 }}>TOTAL</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{fmt({ price: cart.reduce((s, it) => s + CAT_PRODUCTS[it.idx].price * it.qty, 0) } as any)}</span>
                      </div>
                      <button onClick={() => setCheckoutStep('form')} style={{ width: '100%', background: '#1c1a17', color: '#f7f4ee', border: 'none', padding: '14px', fontSize: 12, letterSpacing: 2, cursor: 'pointer' }}>CHECKOUT →</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
