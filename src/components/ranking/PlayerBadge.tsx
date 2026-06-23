import React from 'react';
import { getPlayerInitials } from '../../utils/playerAvatar';

interface PlayerBadgeProps {
  name: string;
  avatarDataUrl?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export const PlayerBadge: React.FC<PlayerBadgeProps> = ({
  name,
  avatarDataUrl,
  subtitle,
  compact = false,
  className = '',
}) => {
  const avatarSizeClass = compact ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-[#e2d1b4] bg-white/88 px-3 py-2 text-[#4a3a28] shadow-sm ${className}`}>
      {avatarDataUrl ? (
        <img
          src={avatarDataUrl}
          alt={name}
          className={`${avatarSizeClass} rounded-xl border border-[#d9c5a6] object-cover`}
          draggable={false}
        />
      ) : (
        <div className={`${avatarSizeClass} flex items-center justify-center rounded-xl border border-[#d9c5a6] bg-[#f3e3c8] font-black text-[#7b5f3d]`}>
          {getPlayerInitials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className={`truncate font-black ${compact ? 'text-sm' : 'text-base'}`}>{name}</p>
        {subtitle && <p className="truncate text-xs font-semibold text-[#7a654b]">{subtitle}</p>}
      </div>
    </div>
  );
};
