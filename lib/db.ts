import { neon } from "@neondatabase/serverless"

// Use environment variable or fallback for development
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ArJcd28BKPSm@ep-little-forest-a214x4xs-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(databaseUrl)

export interface User {
  id: number
  phone: string
  first_name: string
  last_name: string
  created_at: string
}

export interface Prize {
  id: number
  name_ar: string
  name_en: string
  color: string
  probability: number
  is_active: boolean
}

export interface Winner {
  id: number
  user_id: number
  prize_id: number
  is_final_winner: boolean
  won_at: string
  user?: User
  prize?: Prize
}

export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("Initializing database tables...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          phone VARCHAR(20) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create prizes table
    await sql`
      CREATE TABLE IF NOT EXISTS prizes (
          id SERIAL PRIMARY KEY,
          name_ar VARCHAR(200) NOT NULL,
          name_en VARCHAR(200) NOT NULL,
          color VARCHAR(7) NOT NULL,
          probability DECIMAL(5,2) NOT NULL DEFAULT 12.50,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create winners table
    await sql`
      CREATE TABLE IF NOT EXISTS winners (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          prize_id INTEGER REFERENCES prizes(id),
          is_final_winner BOOLEAN DEFAULT false,
          won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if prizes exist, if not insert default ones
    const existingPrizes = await sql`SELECT COUNT(*) as count FROM prizes`
    const prizeCount = Number.parseInt(existingPrizes[0].count)

    if (prizeCount === 0) {
      console.log("Inserting default prizes...")
      await sql`
        INSERT INTO prizes (name_ar, name_en, color, probability) VALUES
        ('تليفون ذكي', 'Smartphone', '#FF1744', 5.00),
        ('كمبيوتر محمول', 'Laptop', '#E91E63', 3.00),
        ('سماعات بلوتوث', 'Bluetooth Headphones', '#9C27B0', 15.00),
        ('شاحن لاسلكي', 'Wireless Charger', '#673AB7', 20.00),
        ('كوفر تليفون', 'Phone Case', '#3F51B5', 25.00),
        ('بطاقة شحن 10د', '10DT Credit', '#2196F3', 20.00),
        ('بطاقة شحن 5د', '5DT Credit', '#00BCD4', 12.00)
      `
    }

    // Add indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_winners_prize_id ON winners(prize_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`

    console.log("Database initialization completed successfully")
    return true
  } catch (error) {
    console.error("Database initialization failed:", error)
    return false
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    // First test basic connection
    const result = await sql`SELECT 1 as test`
    console.log("Database connection test successful:", result)

    // Then initialize tables
    const initialized = await initializeDatabase()
    return initialized
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    console.log("Searching for user with phone:", phone)
    const result = await sql`
      SELECT * FROM users WHERE phone = ${phone} LIMIT 1
    `
    console.log("User search result:", result)
    return result[0] || null
  } catch (error) {
    console.error("Error getting user by phone:", error)
    throw new Error("فشل في البحث عن المستخدم")
  }
}

export async function createUser(phone: string, firstName: string, lastName: string): Promise<User> {
  try {
    console.log("Creating user with:", { phone, firstName, lastName })

    // First check if user already exists
    const existingUser = await getUserByPhone(phone)
    if (existingUser) {
      throw new Error("رقم الهاتف مستخدم بالفعل")
    }

    const result = await sql`
      INSERT INTO users (phone, first_name, last_name)
      VALUES (${phone}, ${firstName}, ${lastName})
      RETURNING *
    `

    console.log("User created successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("Database error creating user:", error)

    // Check if it's a unique constraint violation
    if (error instanceof Error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        throw new Error("رقم الهاتف مستخدم بالفعل")
      }
      if (error.message.includes("رقم الهاتف مستخدم بالفعل")) {
        throw error
      }
    }

    throw new Error("فشل في إنشاء المستخدم في قاعدة البيانات")
  }
}

export async function getActivePrizes(): Promise<Prize[]> {
  try {
    console.log("Fetching active prizes...")
    const result = await sql`
      SELECT * FROM prizes WHERE is_active = true ORDER BY probability DESC
    `
    console.log("Active prizes fetched:", result.length)
    return result
  } catch (error) {
    console.error("Error getting active prizes:", error)
    throw new Error("فشل في جلب الجوائز")
  }
}

export async function addWinner(userId: number, prizeId: number): Promise<Winner> {
  try {
    console.log("Adding winner:", { userId, prizeId })
    const result = await sql`
      INSERT INTO winners (user_id, prize_id)
      VALUES (${userId}, ${prizeId})
      RETURNING *
    `
    console.log("Winner added successfully:", result[0])
    return result[0]
  } catch (error) {
    console.error("Error adding winner:", error)
    throw new Error("فشل في تسجيل الفوز")
  }
}

export async function getWinnersByPrize(prizeId: number): Promise<Winner[]> {
  try {
    console.log("Fetching winners for prize:", prizeId)
    const result = await sql`
      SELECT w.*, u.first_name, u.last_name, u.phone, p.name_ar, p.name_en
      FROM winners w
      JOIN users u ON w.user_id = u.id
      JOIN prizes p ON w.prize_id = p.id
      WHERE w.prize_id = ${prizeId} AND w.is_final_winner = false
      ORDER BY w.won_at DESC
    `
    console.log("Winners fetched:", result.length)
    return result
  } catch (error) {
    console.error("Error getting winners by prize:", error)
    throw new Error("فشل في جلب الفائزين")
  }
}

export async function setFinalWinner(winnerId: number): Promise<void> {
  try {
    console.log("Setting final winner:", winnerId)
    await sql`
      UPDATE winners SET is_final_winner = true WHERE id = ${winnerId}
    `
    console.log("Final winner set successfully")
  } catch (error) {
    console.error("Error setting final winner:", error)
    throw new Error("فشل في تحديد الفائز النهائي")
  }
}

export async function getUserPlayCount(userId: number): Promise<number> {
  try {
    console.log("Getting play count for user:", userId)
    const result = await sql`
      SELECT COUNT(*) as count FROM winners WHERE user_id = ${userId}
    `
    const count = Number.parseInt(result[0].count) || 0
    console.log("User play count:", count)
    return count
  } catch (error) {
    console.error("Error getting user play count:", error)
    return 0
  }
}
