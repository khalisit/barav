import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.baravquiz.com/api';
    const origin = new URL(baseUrl).origin;
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
    return `${origin}/media/${cleanPath}`;
  } catch (e) {
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
    return `https://api.baravquiz.com/media/${cleanPath}`;
  }
}
