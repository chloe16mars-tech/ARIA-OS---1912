-- Migration: Add Admin Tables and Role
-- Description: Creates ads, legal_content, and app_config tables, and adds is_admin to profiles.

-- 1. Add is_admin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    badge_key TEXT NOT NULL,
    title_key TEXT NOT NULL,
    description_key TEXT NOT NULL,
    link_url TEXT DEFAULT '#',
    is_active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() 
);

-- 3. Create legal_content table
CREATE TABLE IF NOT EXISTS public.legal_content (
    id TEXT PRIMARY KEY,
    title_key TEXT NOT NULL,
    content_html TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Policies for ads
CREATE POLICY "Ads are viewable by everyone" ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY "Ads are manageable by admins" ON public.ads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Policies for legal_content
CREATE POLICY "Legal content is viewable by everyone" ON public.legal_content FOR SELECT USING (true);
CREATE POLICY "Legal content is manageable by admins" ON public.legal_content FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Policies for app_config
CREATE POLICY "App config is viewable by everyone" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "App config is manageable by admins" ON public.app_config FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Seed initial data for legal content if empty (kept as comments or omitted to prefer local translations)
-- INSERT INTO public.legal_content (id, title_key, content_html)
-- VALUES 
-- ('cgu', 'legal.tabs.cgu', '<h1>Conditions Générales d''Utilisation</h1><p>Contenu par défaut...</p>'),
-- ('privacy', 'legal.tabs.privacy', '<h1>Politique de Confidentialité</h1><p>Contenu par défaut...</p>'),
-- ('mentions', 'legal.tabs.mentions', '<h1>Mentions Légales</h1><p>Contenu par défaut...</p>')
-- ON CONFLICT (id) DO NOTHING;

-- Seed initial data for app_config (languages and popup)
INSERT INTO public.app_config (key, value)
VALUES 
('languages', '{"fr": true, "en": true, "zh": false, "ar": false, "es": false, "pt": false}'),
('special_popup', '{"enabled": false, "title": "Offre Spéciale", "text": "Découvrez nos nouvelles fonctionnalités !", "image_url": "", "button_text": "En savoir plus", "button_link": "#", "bg_color": "#7c3aed", "overlay_opacity": 0.8}')
ON CONFLICT (key) DO NOTHING;