export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Jood E-Commerce',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
} as const;
