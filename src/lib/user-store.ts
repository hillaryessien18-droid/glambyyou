// In-memory user store
// In production, replace with a database
export const userStore = new Map<string, { name: string; email: string; password: string }>();
