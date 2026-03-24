export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_URL: string;
  ASSET_VERSION: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

export interface Link {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  domain: string | null;
  category: string | null;
  tags: string | null;
  stars: number;
  note: string | null;
  summary: string | null;
  status: string | null;
  read: number;
  private: number;
  saved_at: string;
}

export interface Category {
  name: string;
  sort_order: number;
}

export interface Collection {
  id: string;
  recipient: string | null;
  message: string | null;
  link_ids: string;
  created_at: string;
}

export interface GearItem {
  id: string;
  name: string;
  badge: string | null;
  image_url?: string | null;
  icon?: string | null;
  artwork_url?: string | null;
  apple_url?: string | null;
  author?: string | null;
  url: string | null;
  description: string | null;
  sort_order: number;
}

export interface SiteContent {
  id: string;
  content: string | null;
  updated_at: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
}

export interface Session {
  token: string;
  admin_id: number;
  expires_at: string;
}
