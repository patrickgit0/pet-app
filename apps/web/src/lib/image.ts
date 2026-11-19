/**
 * Reduz a foto no navegador antes do envio: no máximo `max` px no lado maior, WebP (ou JPEG se o navegador
 * não gerar WebP). Fotos de celular de 4–8 MB viram ~200–400 KB. Se algo falhar (ex.: HEIC que o navegador
 * não decodifica), devolve o arquivo original.
 */
export async function compressImage(file: File, max = 1600, quality = 0.82): Promise<File> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
    const out = blob && blob.type === 'image/webp' ? blob
      : await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!out || out.size >= file.size) return file; // já era pequena
    const ext = out.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([out], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: out.type });
  } catch {
    return file;
  }
}

/** Extensão a partir do tipo do arquivo (depois de comprimir o nome pode mudar). */
export function extOf(file: File): string {
  return file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : file.type === 'image/heic' ? 'heic' : 'jpg';
}
