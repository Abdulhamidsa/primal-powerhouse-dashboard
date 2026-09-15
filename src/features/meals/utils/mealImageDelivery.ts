export type MealImageVariant = 'thumbnail' | 'card' | 'detail';

export type MealImageDelivery = {
  src: string;
  unoptimized: boolean;
};

const CLOUDINARY_TRANSFORMS: Record<MealImageVariant, string> = {
  thumbnail: 'f_auto,q_auto,w_240,h_240,c_fill',
  card: 'f_auto,q_auto,w_700,h_460,c_fill',
  detail: 'f_auto,q_auto,w_1200,c_limit',
};

function isCloudinaryDeliveryUrl(url: URL): boolean {
  return url.hostname === 'res.cloudinary.com' && url.pathname.includes('/upload/');
}

function removeExistingTransformation(pathAfterUpload: string): string {
  const segments = pathAfterUpload.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment || firstSegment.startsWith('v')) {
    return pathAfterUpload;
  }

  const looksLikeTransformation = firstSegment.split(',').some(part => /^[a-z]+_/.test(part));
  if (!looksLikeTransformation) {
    return pathAfterUpload;
  }

  return segments.slice(1).join('/');
}

export function getMealImageDelivery(src: string, variant: MealImageVariant = 'card'): MealImageDelivery {
  const trimmedSrc = src.trim();
  if (!trimmedSrc) return { src: trimmedSrc, unoptimized: false };

  try {
    const url = new URL(trimmedSrc);
    if (!isCloudinaryDeliveryUrl(url)) {
      return { src: trimmedSrc, unoptimized: false };
    }

    const [prefix, pathAfterUpload] = url.pathname.split('/upload/');
    if (!pathAfterUpload) {
      return { src: trimmedSrc, unoptimized: false };
    }

    const normalizedPath = removeExistingTransformation(pathAfterUpload);
    url.pathname = `${prefix}/upload/${CLOUDINARY_TRANSFORMS[variant]}/${normalizedPath}`;

    return { src: url.toString(), unoptimized: true };
  } catch {
    return { src: trimmedSrc, unoptimized: false };
  }
}
