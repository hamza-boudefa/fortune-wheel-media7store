-- Add index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_prize_id ON winners(prize_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update prizes with better colors and probabilities
UPDATE prizes SET 
  color = '#FF1744',
  probability = 5.00
WHERE name_ar = 'تليفون ذكي';

UPDATE prizes SET 
  color = '#E91E63',
  probability = 3.00
WHERE name_ar = 'كمبيوتر محمول';

UPDATE prizes SET 
  color = '#9C27B0',
  probability = 15.00
WHERE name_ar = 'سماعات بلوتوث';

UPDATE prizes SET 
  color = '#673AB7',
  probability = 20.00
WHERE name_ar = 'شاحن لاسلكي';

UPDATE prizes SET 
  color = '#3F51B5',
  probability = 25.00
WHERE name_ar = 'كوفر تليفون';

UPDATE prizes SET 
  color = '#2196F3',
  probability = 20.00
WHERE name_ar = 'بطاقة شحن 10د';

UPDATE prizes SET 
  color = '#00BCD4',
  probability = 12.00
WHERE name_ar = 'بطاقة شحن 5د';
