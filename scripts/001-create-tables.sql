-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prizes table
CREATE TABLE IF NOT EXISTS prizes (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    color VARCHAR(7) NOT NULL,
    probability DECIMAL(5,2) NOT NULL DEFAULT 12.50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create winners table
CREATE TABLE IF NOT EXISTS winners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    prize_id INTEGER REFERENCES prizes(id),
    is_final_winner BOOLEAN DEFAULT false,
    won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default prizes in Tunisian dialect
INSERT INTO prizes (name_ar, name_en, color, probability) VALUES
('تليفون ذكي', 'Smartphone', '#FF0000', 5.00),
('كمبيوتر محمول', 'Laptop', '#FF6B6B', 3.00),
('سماعات بلوتوث', 'Bluetooth Headphones', '#FF9999', 15.00),
('شاحن لاسلكي', 'Wireless Charger', '#FFB3B3', 20.00),
('كوفر تليفون', 'Phone Case', '#FFCCCC', 25.00),
('بطاقة شحن 10د', '10DT Credit', '#FF4444', 20.00),
('بطاقة شحن 5د', '5DT Credit', '#FF7777', 12.00)
ON CONFLICT DO NOTHING;
