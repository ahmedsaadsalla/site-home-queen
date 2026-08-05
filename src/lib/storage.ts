/**
 * Camada de armazenamento de arquivos.
 * Hoje: public/uploads (disco local).
 * Futuro: Cloudinary/S3 — trocar apenas este módulo.
 */
export const LOCAL_UPLOAD_PREFIX = "/uploads";

export function toPublicUploadPath(filename: string) {
  const clean = filename.replace(/^\/+/, "");
  return `${LOCAL_UPLOAD_PREFIX}/${clean}`;
}

export function isLocalUploadUrl(url: string) {
  return url.startsWith(LOCAL_UPLOAD_PREFIX + "/") || url.startsWith("/uploads/");
}

/** Resolve URL absoluta para exibição (CDN futuro) */
export function resolveMediaUrl(pathOrUrl: string, siteUrl?: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(
    /\/$/,
    "",
  );
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return base ? `${base}${path}` : path;
}
