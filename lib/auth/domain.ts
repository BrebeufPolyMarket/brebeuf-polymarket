const DEFAULT_ALLOWED_EMAIL_DOMAIN = "tcdsb.ca";

export function getAllowedEmailDomain() {
  return (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? process.env.ALLOWED_EMAIL_DOMAIN ?? DEFAULT_ALLOWED_EMAIL_DOMAIN)
    .trim()
    .toLowerCase();
}

export function isAllowedSchoolEmail(email: string | null | undefined) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allowed = getAllowedEmailDomain();
  return normalized.endsWith(`@${allowed}`);
}
