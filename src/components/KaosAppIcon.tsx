import React from 'react';

interface KaosAppIconProps {
  size?: number | string;
  className?: string;
  withGlow?: boolean;
  alt?: string;
}

export const KaosAppIcon: React.FC<KaosAppIconProps> = ({
  size = 40,
  className = '',
  withGlow = true,
  alt = 'KAOS App Icon',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 bg-gradient-to-tr from-kaos-pink to-kaos-purple rounded-2xl blur-lg opacity-40 -z-10 pointer-events-none scale-110"
          aria-hidden="true"
        />
      )}
      <img
        src="/app-icon.png"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/app-icon.svg';
        }}
        alt={alt}
        className="w-full h-full object-contain rounded-2xl drop-shadow-md"
        loading="eager"
      />
    </div>
  );
};

export default KaosAppIcon;
