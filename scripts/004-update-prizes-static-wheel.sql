-- Clear existing prizes
DELETE FROM prizes;

-- Insert only the actual, winnable prizes for Media 7 Store
INSERT INTO prizes (name_ar, name_en, color, probability, is_active) VALUES
('تليفون محمول', 'Téléphone portable', '#DC2626', 8.00, true),
('ساعة ذكية', 'Montre connectée', '#FFFFFF', 8.00, true),
('كمبيوتر محمول', 'Pc Portable', '#DC2626', 5.00, true),
('شريحة + 25 جيجا مجاني', 'Puce + 25GB Gratuit', '#FFFFFF', 10.00, true),
('تابلت', 'Tablette', '#DC2626', 8.00, true),
('بون شراء 100 دينار', 'Bon d''achat 100 dinars', '#FFFFFF', 6.00, true),
('بون شراء 50 دينار', 'Bon d''achat 50 dinars', '#DC2626', 5.00, true);
