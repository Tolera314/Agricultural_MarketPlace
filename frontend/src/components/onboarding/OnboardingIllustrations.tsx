import React from 'react';

/**
 * Rich, vibrant SVG illustrations for AgriMarket onboarding flows,
 * matching the exact character and aesthetic in the design references.
 */

// 1. Farmer Character Illustration (Straw hat, green collared shirt, wheat stalk, circular backdrop)
export const FarmerIllustration: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft circular background */}
    <circle cx="48" cy="48" r="44" fill="#E8F5E9" />
    <circle cx="48" cy="48" r="40" fill="#C8E6C9" opacity="0.5" />

    {/* Sun / Warm glow behind head */}
    <circle cx="48" cy="38" r="26" fill="#FFF9C4" />

    {/* Farmer Shirt & Body */}
    <path
      d="M26 84C26 71 36 62 48 62C60 62 70 71 70 84H26Z"
      fill="#2E7D32"
    />
    <path
      d="M34 84C34 74 41 66 48 66C55 66 62 74 62 84H34Z"
      fill="#388E3C"
    />
    {/* Overall suspenders / straps */}
    <path d="M37 66L40 84H45L42 66H37Z" fill="#1B5E20" />
    <path d="M59 66L56 84H51L54 66H59Z" fill="#1B5E20" />
    <circle cx="41" cy="74" r="1.5" fill="#FFD54F" />
    <circle cx="55" cy="74" r="1.5" fill="#FFD54F" />

    {/* Neck */}
    <rect x="44" y="52" width="8" height="12" rx="3" fill="#FFCC80" />

    {/* Face */}
    <circle cx="48" cy="42" r="14" fill="#FFE0B2" />
    {/* Cheeks */}
    <circle cx="40" cy="45" r="2.5" fill="#FFAB91" opacity="0.6" />
    <circle cx="56" cy="45" r="2.5" fill="#FFAB91" opacity="0.6" />
    {/* Eyes */}
    <circle cx="43" cy="40" r="1.8" fill="#3E2723" />
    <circle cx="53" cy="40" r="1.8" fill="#3E2723" />
    {/* Smile */}
    <path
      d="M44 46C44 46 46 49 48 49C50 49 52 46 52 46"
      stroke="#5D4037"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Straw Hat Brim */}
    <ellipse cx="48" cy="33" rx="26" ry="6.5" fill="#FDD835" />
    <ellipse cx="48" cy="33" rx="23" ry="5" fill="#FFEE58" />
    {/* Hat Crown */}
    <path
      d="M33 33C33 22 40 16 48 16C56 16 63 22 63 33H33Z"
      fill="#FDD835"
    />
    {/* Hat ribbon */}
    <path
      d="M33 31C37 29 59 29 63 31V33C59 31 37 31 33 33V31Z"
      fill="#2E7D32"
    />

    {/* Wheat Stalk in mouth / hand */}
    <path
      d="M52 48Q60 48 66 43"
      stroke="#F57F17"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="62" cy="44" r="1.8" fill="#FBC02D" />
    <circle cx="65" cy="42" r="1.8" fill="#FBC02D" />
    <circle cx="67" cy="40" r="1.8" fill="#FBC02D" />
  </svg>
);

// 2. Delivery Worker Illustration (Electric scooter courier with helmet, box, speed trail)
export const DeliveryWorkerIllustration: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft circular background */}
    <circle cx="48" cy="48" r="44" fill="#E0F2F1" />
    <circle cx="48" cy="48" r="40" fill="#B2DFDB" opacity="0.5" />

    {/* Speed lines */}
    <path d="M12 50H22M16 56H26M10 62H20" stroke="#80CBC4" strokeWidth="2.5" strokeLinecap="round" />

    {/* Scooter Back Wheel */}
    <circle cx="28" cy="70" r="9" fill="#37474F" />
    <circle cx="28" cy="70" r="4.5" fill="#CFD8DC" />

    {/* Scooter Front Wheel */}
    <circle cx="70" cy="70" r="9" fill="#37474F" />
    <circle cx="70" cy="70" r="4.5" fill="#CFD8DC" />

    {/* Scooter Body / Deck */}
    <path
      d="M28 68H66L62 58H38L28 68Z"
      fill="#00897B"
    />
    {/* Front Fork & Steering Column */}
    <path
      d="M66 68L56 36H52"
      stroke="#00695C"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Handlebar */}
    <circle cx="51" cy="36" r="3" fill="#263238" />

    {/* Delivery Cargo Box on Back */}
    <rect x="22" y="44" width="16" height="16" rx="3" fill="#FFB300" />
    <path d="M22 50H38" stroke="#FFA000" strokeWidth="1.5" />
    <circle cx="30" cy="52" r="2.5" fill="#FFF8E1" />

    {/* Worker Body */}
    <path
      d="M38 58C38 48 44 42 50 42C54 42 58 46 58 56L48 64H38V58Z"
      fill="#00796B"
    />
    {/* Arms */}
    <path
      d="M48 48L54 38"
      stroke="#004D40"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Head & Green Helmet */}
    <circle cx="48" cy="30" r="9" fill="#FFE0B2" />
    <path
      d="M40 30C40 23 44 19 50 19C56 19 60 23 60 30H40Z"
      fill="#00897B"
    />
    {/* Helmet Visor */}
    <path
      d="M50 25H59C60 25 61 27 60 29L58 31H50V25Z"
      fill="#263238"
    />
  </svg>
);

// 3. Customer / Buyer Illustration (Woven wicker basket overflowing with fresh harvest produce)
export const BuyerIllustration: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 72,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft circular background */}
    <circle cx="48" cy="48" r="44" fill="#FFF3E0" />
    <circle cx="48" cy="48" r="40" fill="#FFE0B2" opacity="0.5" />

    {/* Leaves & Veggies behind basket */}
    {/* Leafy Greens */}
    <path
      d="M32 38C28 26 36 20 44 26C48 20 58 24 56 34C64 30 70 38 64 46H30C30 42 31 40 32 38Z"
      fill="#43A047"
    />
    <path
      d="M36 34C34 26 40 22 45 27C49 22 56 25 54 33"
      fill="#66BB6A"
    />

    {/* Ripe Red Tomato */}
    <circle cx="38" cy="42" r="10" fill="#E53935" />
    <circle cx="36" cy="39" r="8" fill="#EF5350" />
    {/* Tomato Calyx / Leaf */}
    <path
      d="M38 31L36 34M38 31L40 34M38 31V28"
      stroke="#2E7D32"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Carrot poking out */}
    <path
      d="M62 26L52 46L58 48L66 28L62 26Z"
      fill="#FB8C00"
    />
    {/* Carrot fronds */}
    <path
      d="M64 26L68 18M64 26L72 23M64 26L66 16"
      stroke="#43A047"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Golden Corn / Maize */}
    <ellipse cx="50" cy="38" rx="7" ry="11" fill="#FDD835" transform="rotate(15 50 38)" />
    <circle cx="50" cy="35" r="1.5" fill="#F57F17" />
    <circle cx="52" cy="39" r="1.5" fill="#F57F17" />

    {/* Woven Harvest Basket */}
    <path
      d="M22 46H74L68 76C68 78 66 80 63 80H33C30 80 28 78 28 76L22 46Z"
      fill="#A16207"
    />
    <path
      d="M25 48H71L66 74C66 75.5 64.5 77 62 77H34C31.5 77 30 75.5 30 74L25 48Z"
      fill="#B45309"
    />
    {/* Basket Rim */}
    <rect x="20" y="44" width="56" height="6" rx="3" fill="#78350F" />

    {/* Woven Crosshatch texture */}
    <path
      d="M32 50L40 76M42 50L50 76M52 50L60 76M62 50L66 76"
      stroke="#78350F"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M64 50L56 76M54 50L46 76M44 50L36 76M34 50L30 76"
      stroke="#78350F"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// 4. Radiant Success Badge (Envelope with green checkmark and bursting rays)
export const RadiantSuccessBadge: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 80,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Bursting Radiant Rays */}
    <line x1="50" y1="6" x2="50" y2="14" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="86" x2="50" y2="94" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
    <line x1="6" y1="50" x2="14" y2="50" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
    <line x1="86" y1="50" x2="94" y2="50" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
    <line x1="19" y1="19" x2="25" y2="25" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="75" y1="75" x2="81" y2="81" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="19" y1="81" x2="25" y2="75" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="75" y1="25" x2="81" y2="19" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />

    {/* Outer soft glow ring */}
    <circle cx="50" cy="50" r="32" fill="#E8F5E9" />
    <circle cx="50" cy="50" r="28" fill="#10B981" />

    {/* White Checkmark / Shield badge */}
    <path
      d="M40 50.5L46.5 57L60 43.5"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 5. Buyer Direct Access Illustration: Large vibrant green shopping basket with fresh harvest
export const BuyerSuccessBasket: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 110,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Ambient shadow */}
    <ellipse cx="60" cy="108" rx="42" ry="7" fill="#000000" fillOpacity="0.08" />

    {/* Basket Handle */}
    <path
      d="M34 68C34 38 86 38 86 68"
      stroke="#047857"
      strokeWidth="5"
      strokeLinecap="round"
    />

    {/* Fresh produce poking out */}
    {/* Ripe tomato */}
    <circle cx="48" cy="54" r="13" fill="#DC2626" />
    <circle cx="46" cy="51" r="10" fill="#EF4444" />
    <path d="M48 40L46 44M48 40L50 44" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

    {/* Fresh Carrot */}
    <path d="M78 36L66 60L73 62L82 38L78 36Z" fill="#F97316" />
    <path d="M80 36L86 26M80 36L90 31" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

    {/* Green Lettuce Leaves */}
    <path
      d="M56 46C52 32 68 28 72 40C78 34 88 42 80 52H52C52 48 54 46 56 46Z"
      fill="#10B981"
    />

    {/* Modern Perforated Supermarket Basket Body */}
    <path
      d="M24 64H96L88 100C88 102 85 104 82 104H38C35 104 32 102 32 100L24 64Z"
      fill="#059669"
    />
    <path
      d="M27 66H93L86 98C86 99.5 83.5 101 81 101H39C36.5 101 34 99.5 34 98L27 66Z"
      fill="#10B981"
    />
    {/* Top Basket Lip */}
    <rect x="20" y="62" width="80" height="7" rx="3.5" fill="#047857" />

    {/* Perforations / Basket Slots */}
    <rect x="36" y="74" width="6" height="12" rx="3" fill="#047857" />
    <rect x="47" y="74" width="6" height="12" rx="3" fill="#047857" />
    <rect x="58" y="74" width="6" height="12" rx="3" fill="#047857" />
    <rect x="69" y="74" width="6" height="12" rx="3" fill="#047857" />
    <rect x="78" y="74" width="6" height="12" rx="3" fill="#047857" />

    <rect x="42" y="88" width="6" height="8" rx="3" fill="#047857" />
    <rect x="53" y="88" width="6" height="8" rx="3" fill="#047857" />
    <rect x="64" y="88" width="6" height="8" rx="3" fill="#047857" />
    <rect x="73" y="88" width="6" height="8" rx="3" fill="#047857" />
  </svg>
);

// 6. Lush Foliage / Botanical Border (Decorative leaves shown along bottom of cards in the design)
export const DecorativeBotanicalFoliage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-full h-12 overflow-hidden pointer-events-none select-none ${className}`}>
    <svg
      viewBox="0 0 800 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      {/* Cluster of lush layered leaves */}
      {/* Background layer: mint/soft emerald */}
      <path
        d="M20 60C30 35 60 25 80 60C95 30 130 20 150 60C170 32 205 24 230 60C260 28 300 22 330 60C360 30 400 24 430 60C460 26 500 20 530 60C560 30 600 26 630 60C660 28 700 22 730 60C750 32 780 34 800 60H0V60H20Z"
        fill="#A7F3D0"
        fillOpacity="0.45"
      />
      {/* Mid layer: vibrant green */}
      <path
        d="M0 60C15 42 45 36 65 60C80 40 115 32 135 60C155 38 190 32 210 60C240 36 280 30 310 60C340 38 380 32 410 60C440 34 480 28 510 60C540 38 580 34 610 60C640 36 680 30 710 60C735 40 765 42 790 60H0Z"
        fill="#34D399"
        fillOpacity="0.6"
      />
      {/* Foreground crisp leaves */}
      <path
        d="M10 60C25 48 50 44 70 60C90 46 120 40 140 60C165 44 195 40 220 60C250 42 285 38 315 60C345 44 380 40 410 60C445 40 480 36 515 60C550 44 585 42 615 60C645 42 680 38 715 60C740 46 770 48 795 60H10Z"
        fill="#059669"
        fillOpacity="0.35"
      />
    </svg>
  </div>
);
