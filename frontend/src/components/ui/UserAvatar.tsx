'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_MAP = {
  xs: { dim: 24, class: 'w-6 h-6 text-[10px]' },
  sm: { dim: 32, class: 'w-8 h-8 text-xs' },
  md: { dim: 40, class: 'w-10 h-10 text-sm' },
  lg: { dim: 48, class: 'w-12 h-12 text-base' },
  xl: { dim: 80, class: 'w-20 h-20 text-2xl' },
};

/**
 * Extracts 1-2 uppercase initials from a person's full name.
 * e.g., "Tesfaye Fayisa" -> "TF", "Selamawit" -> "S", null -> "U"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Deterministic color palette for avatar fallback badges based on user name
 */
const AVATAR_GRADIENTS = [
  'from-emerald-600 to-teal-800 text-emerald-50',
  'from-teal-600 to-emerald-900 text-teal-50',
  'from-green-600 to-emerald-800 text-green-50',
  'from-emerald-700 to-teal-900 text-white',
  'from-teal-700 to-green-900 text-emerald-100',
];

function getGradientForName(name?: string | null): string {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * UserAvatar Component
 * Displays user profile image if available; otherwise renders a dynamic initials badge.
 */
export function UserAvatar({
  src,
  name,
  size = 'sm',
  className = '',
  alt,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const initials = getInitials(name);
  const gradient = getGradientForName(name);

  // Consider avatar valid only if it's an actual user URL and hasn't failed loading
  const hasValidImage = Boolean(src && typeof src === 'string' && src.trim().length > 0 && !imageError);

  if (hasValidImage && src) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-emerald-500/20 shadow-xs ${sizeConfig.class} ${className}`}
      >
        <Image
          src={src}
          alt={alt || name || 'User avatar'}
          width={sizeConfig.dim}
          height={sizeConfig.dim}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-label={name || 'User'}
      className={`rounded-full shrink-0 flex items-center justify-center font-black select-none tracking-wider bg-gradient-to-br ${gradient} border border-emerald-400/30 shadow-xs ${sizeConfig.class} ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
}

