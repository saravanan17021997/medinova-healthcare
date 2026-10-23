import { useState, type ImgHTMLAttributes } from 'react';
import type { ImageAsset } from '@/types';
import { ILLUSTRATION } from '@/data/img';
import { cx } from '@/lib/format';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  image: ImageAsset;
  /** sizes attribute for the responsive srcset. */
  sizes?: string;
  /** Above-the-fold images load eagerly with high priority; everything else is lazy. */
  priority?: boolean;
  /** Decorative images get empty alt text so screen readers skip them. */
  decorative?: boolean;
};

const smallVariant = (src: string) => src.replace(/\.webp$/, '-sm.webp');

/**
 * The one image component used across the site: intrinsic width/height to
 * prevent layout shift, responsive srcset for raster images, lazy loading
 * below the fold, and a graceful fallback if a file fails to load.
 */
export function Img({ image, sizes = '100vw', priority = false, decorative = false, className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const raster = image.src.endsWith('.webp') && image.smallWidth;

  if (failed) {
    return (
      <span
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : image.alt}
        className={cx('flex items-center justify-center bg-mist-200 text-slate', className)}
        data-image-fallback={image.src}
      >
        <img src={ILLUSTRATION.error} alt="" className="h-1/2 max-h-40 w-auto opacity-80" />
      </span>
    );
  }

  return (
    <img
      src={image.src}
      srcSet={raster ? `${smallVariant(image.src)} ${image.smallWidth}w, ${image.src} ${image.width}w` : undefined}
      sizes={raster ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={decorative ? '' : image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // @ts-expect-error fetchpriority is valid HTML but not yet in React's types
      fetchpriority={priority ? 'high' : undefined}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
