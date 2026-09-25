import React, { useState, useEffect, useMemo } from 'react';

/**
 * Component hiển thị Avatar người dùng:
 * - Tự động nạp avatar Google với thuộc tính `referrerPolicy="no-referrer"` để chống lỗi 403 Forbidden từ Google CDN.
 * - Tự động bắt lỗi tải ảnh (onError) để chuyển sang avatar chữ cái đầu (initials) trên nền gradient ngọc bích sang trọng, không bao giờ hiển thị icon ảnh vỡ khó coi.
 * 
 * @param {{ user: { name?: string, email?: string, picture?: string }, size?: 'sm' | 'lg', className?: string }} props
 */
export default function UserAvatar({
  user,
  size = 'sm',
  className = '',
}) {
  const [hasError, setHasError] = useState(false);

  // Khi URL ảnh thay đổi thì reset trạng thái lỗi
  useEffect(() => {
    setHasError(false);
  }, [user?.picture]);

  // Lấy chữ cái đầu tiên của Tên (hoặc Email) làm avatar chữ
  const initial = useMemo(() => {
    const rawName = (user?.name || '').trim();
    if (rawName) {
      return rawName.charAt(0).toUpperCase();
    }
    const rawEmail = (user?.email || '').trim();
    if (rawEmail) {
      return rawEmail.charAt(0).toUpperCase();
    }
    return 'U';
  }, [user?.name, user?.email]);

  const isLarge = size === 'lg';
  const sizeClasses = isLarge
    ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 text-base sm:text-lg'
    : 'w-8 h-8 rounded-xl border text-xs';

  if (user?.picture && !hasError) {
    return (
      <img
        src={user.picture}
        alt={user.name || 'User Avatar'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${sizeClasses} border-emerald-500/40 object-cover shadow-2xs shrink-0 select-none transition-all ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} border-emerald-500/40 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-2xs shrink-0 select-none transition-all ${className}`}
      title={user?.name || user?.email || 'Người dùng'}
    >
      {initial}
    </div>
  );
}
