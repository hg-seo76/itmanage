export function maskIP(ip?: string, _privacyMode = true): string {
  if (!ip) return 'N/A';
  return ip;
}

export function maskCredential(cred?: string, privacyMode = true): string {
  if (!cred) return '미설정';
  if (!privacyMode) return cred;
  return '••••••••';
}
