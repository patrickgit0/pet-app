-- Vira Lar — cidade piloto passa a ser Franca/SP (migration 16)
-- Só muda o valor padrão das feiras novas; feiras já cadastradas continuam com a cidade que tinham.
alter table public.ngo_events alter column city set default 'Franca';
