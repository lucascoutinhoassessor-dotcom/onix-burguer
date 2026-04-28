-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para ordenação
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Inserir categorias padrão
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Hambúrgueres', 'hamburgueres', 1),
  ('Acompanhamentos', 'acompanhamentos', 2),
  ('Bebidas', 'bebidas', 3),
  ('Sobremesas', 'sobremesas', 4)
ON CONFLICT (slug) DO NOTHING;

-- Adicionar coluna category_id na tabela menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Criar índice para category_id
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Migrar dados existentes: mapear categoria string para category_id
UPDATE menu_items 
SET category_id = (
  SELECT id FROM categories 
  WHERE categories.slug = menu_items.category
)
WHERE category_id IS NULL;
