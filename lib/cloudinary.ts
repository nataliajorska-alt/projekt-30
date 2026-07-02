// Transformacje Cloudinary doklejane do URL-a (…/image/upload/<transformacja>/…).
// URL spoza Cloudinary (brak segmentu '/image/upload/') przechodzi bez zmian.

/** Kwadratowa miniaturka do siatek zdjęć — crop fill, auto-jakość, auto-format. */
export function cloudinaryThumb(url: string, size = 480): string {
  return url.replace('/image/upload/', `/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`)
}
