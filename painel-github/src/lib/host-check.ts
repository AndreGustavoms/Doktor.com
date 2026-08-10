/*
 * Extraído de src/middleware.ts para ser testável sem o runtime Edge do
 * Next. Ver docs/SECURITY.md — ameaça A3 (DNS rebinding).
 */
export function isAllowedHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  return (
    /^127\.0\.0\.1(:\d+)?$/.test(hostHeader) ||
    /^localhost(:\d+)?$/.test(hostHeader) ||
    /^\[::1\](:\d+)?$/.test(hostHeader)
  );
}
