export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const USERNAME_REQUIREMENTS =
  "Username must be 3-20 characters and can only contain lowercase letters, numbers, and underscores.";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}
