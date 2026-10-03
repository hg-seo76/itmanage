export function maskIP(ip?: string, privacyMode = true): string {
  if (!ip) return 'N/A';
  if (!privacyMode) return ip;
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
  }
  return '***.***.***.***';
}

export function maskCredential(cred?: string, privacyMode = true): string {
  if (!cred) return '미설정';
  if (!privacyMode) return cred;
  return '••••••••';
}
