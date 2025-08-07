-- Clear existing prizes and insert new Media 7 Store prizes
DELETE FROM prizes;

-- Insert new prizes with "3awed" (spin again) options
INSERT INTO prizes (name_ar, name_en, color, probability, is_active) VALUES
('تليفون محمول', 'Téléphone portable', '#DC2626', 8.00, true),
('ساعة ذكية', 'Montre connectée', '#FFFFFF', 8.00, true),
('3awed !', '3awed !', '#EF4444', 20.00, true),
('كمبيوتر محمول', 'Pc Portable', '#FFFFFF', 5.00, true),
('شريحة + 25 جيجا مجاني', 'Puce + 25GB Gratuit', '#DC2626', 10.00, true),
('3awed !', '3awed !', '#FFFFFF', 20.00, true),
('تابلت', 'Tablette', '#EF4444', 8.00, true),
('بون شراء 100 دينار', 'Bon d''achat 100 dinars', '#FFFFFF', 6.00, true),
('3awed !', '3awed !', '#DC2626', 10.00, true),
('بون شراء 50 دينار', 'Bon d''achat 50 dinars', '#FFFFFF', 5.00, true);
