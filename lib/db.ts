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
  name: string
  probability: number
  quantity: number
  is_active: boolean
  created_at?: string
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

export interface AdminStats {
  totalPrizes: number
  totalParticipants: number
  totalWinners: number
  finalWinners: number
  pendingWinners: number
  totalQuantity: number
}

export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("Initializing database tables...")

    // Users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Prizes with single "name" column
    await sql`
      CREATE TABLE IF NOT EXISTS prizes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        probability DECIMAL(5,2) NOT NULL DEFAULT 12.50,
        quantity INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Winners
    await sql`
      CREATE TABLE IF NOT EXISTS winners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        prize_id INTEGER REFERENCES prizes(id),
        is_final_winner BOOLEAN DEFAULT false,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Backward-compat: ensure "name" exists; migrate from old columns if present; drop old columns
    try {
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS name VARCHAR(200)`
      // Attempt to backfill from old bilingual columns if they exist
      try {
        await sql`
          UPDATE prizes
          SET name = COALESCE(NULLIF(name, ''), NULLIF(name_en, ''), NULLIF(name_ar, ''))
          WHERE name IS NULL OR name = ''
        `
      } catch {
        // ignore if old columns don't exist
      }
      await sql`UPDATE prizes SET name = 'Unnamed Prize' WHERE name IS NULL OR name = ''`
      // Drop old columns if they exist
      try {
        await sql`ALTER TABLE prizes DROP COLUMN IF EXISTS name_ar`
      } catch {}
      try {
        await sql`ALTER TABLE prizes DROP COLUMN IF EXISTS name_en`
      } catch {}
      try {
        await sql`ALTER TABLE prizes DROP COLUMN IF EXISTS color`
      } catch {}
    } catch {}

    // Seed prizes if empty
    console.log("Checking if prizes need to be seeded...")
    await seedPrizes()


    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_winners_user_id ON winners(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_winners_prize_id ON winners(prize_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`
    await sql`CREATE INDEX IF NOT EXISTS idx_prizes_quantity ON prizes(quantity)`
    await sql`CREATE INDEX IF NOT EXISTS idx_prizes_is_active ON prizes(is_active)`

    console.log("Database initialization completed successfully")
    return true
  } catch (error) {
    console.error("Database initialization failed:", error)
    return false
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1 as test`
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
    const result = await sql`SELECT * FROM users WHERE phone = ${phone} LIMIT 1`
    console.log("User search result:", result)
    return result[0] as User || null
  } catch (error) {
    console.error("Error getting user by phone:", error)
    throw new Error("Échec de la recherche de l'utilisateur")
  }
}

export async function createUser(phone: string, firstName: string, lastName: string): Promise<User> {
  try {
    console.log("Creating user with:", { phone, firstName, lastName })
    const existingUser = await getUserByPhone(phone)
    if (existingUser) {
      throw new Error("Le numéro de téléphone est déjà utilisé")
    }
    const result = await sql`
      INSERT INTO users (phone, first_name, last_name)
      VALUES (${phone}, ${firstName}, ${lastName})
      RETURNING *
    `
    console.log("User created successfully:", result[0])
    return result[0] as User
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        throw new Error("Le numéro de téléphone est déjà utilisé")
      }
      if (error.message.includes("Le numéro de téléphone est déjà utilisé")) {
        throw error
      }
    }
    throw new Error("Échec de la création de l'utilisateur dans la base de données")
  }
}

export async function getActivePrizes(): Promise<Prize[]> {
  try {
    console.log("Fetching active prizes...")
    const result = await sql`SELECT * FROM prizes WHERE is_active = true ORDER BY probability DESC`
    console.log("Active prizes fetched:", result.length)
    return result as Prize[]
  } catch (error) {
    console.error("Error getting active prizes:", error)
    throw new Error("Échec de la récupération des prix")
  }
}

export async function getAllPrizes(): Promise<Prize[]> {
  try {
    console.log("Fetching all prizes...")
    const result = await sql`SELECT * FROM prizes`
    console.log("All prizes fetched:", result.length)
    console.log(
      "Prize details:",
      result.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, is_active: p.is_active })),
    )
    
    // Also check total count and active count
    const totalCount = await sql`SELECT COUNT(*) as count FROM prizes`
    const activeCount = await sql`SELECT COUNT(*) as count FROM prizes WHERE is_active = true`
    console.log(`Total prizes in DB: ${totalCount[0].count}, Active prizes: ${activeCount[0].count}`)
    
    return result as Prize[]
  } catch (error) {
    console.error("Error getting all prizes:", error)
    throw new Error("Échec de la récupération des prix")
  }
}

export async function createPrize(
  name: string,
  probability: number,
  quantity: number,
  is_active = true,
): Promise<Prize> {
  try {
    console.log("Creating prize with:", { name, probability, quantity, is_active })
    const result = await sql`
      INSERT INTO prizes (name, probability, quantity, is_active)
      VALUES (${name}, ${probability}, ${quantity}, ${is_active})
      RETURNING *
    `
    console.log("Prize created successfully:", result[0])
    return result[0] as Prize
  } catch (error) {
    console.error("Error creating prize:", error)
    throw new Error("Échec de la création du prix")
  }
}

export async function updatePrize(id: number, updates: Partial<Prize>): Promise<Prize> {
  try {
    console.log("Updating prize:", id, "with updates:", updates)

    // Check if we have any updates
    if (Object.keys(updates).length === 0) {
      console.log("No updates to apply")
      throw new Error("Aucune mise à jour à appliquer")
    }

    // Build the update query dynamically based on what's provided
    let result: any[] = []

    if (updates.name !== undefined) {
      console.log("Will update name to:", updates.name)
      result = await sql`
        UPDATE prizes 
        SET name = ${updates.name}
        WHERE id = ${id} 
        RETURNING *
      `
    }

    if (updates.probability !== undefined) {
      console.log("Will update probability to:", updates.probability)
      result = await sql`
        UPDATE prizes 
        SET probability = ${updates.probability}
        WHERE id = ${id} 
        RETURNING *
      `
    }

    if (updates.quantity !== undefined) {
      console.log("Will update quantity to:", updates.quantity)
      result = await sql`
        UPDATE prizes 
        SET quantity = ${updates.quantity}
        WHERE id = ${id} 
        RETURNING *
      `
    }

    if (updates.is_active !== undefined) {
      console.log("Will update is_active to:", updates.is_active)
      result = await sql`
        UPDATE prizes 
        SET is_active = ${updates.is_active}
        WHERE id = ${id} 
        RETURNING *
      `
    }

    if (result.length === 0) {
      console.log("No prize found with ID:", id)
      throw new Error("Prix introuvable")
    }

    console.log("Prize updated successfully:", result[0])
    return result[0] as Prize
  } catch (error) {
    console.error("Error updating prize:", error)
    throw new Error("Échec de la mise à jour du prix")
  }
}

export async function deletePrize(id: number): Promise<void> {
  try {
    console.log("Deleting prize:", id)

    const winners = await sql`SELECT COUNT(*) as count FROM winners WHERE prize_id = ${id}`
    if (Number.parseInt(winners[0].count) > 0) {
      throw new Error("Impossible de supprimer un prix qui a des gagnants")
    }

    await sql`DELETE FROM prizes WHERE id = ${id}`
    console.log("Prize deleted successfully")
  } catch (error) {
    console.error("Error deleting prize:", error)
    if (error instanceof Error && error.message.includes("Impossible de supprimer un prix qui a des gagnants")) {
      throw error
    }
    throw new Error("Échec de la suppression du prix")
  }
}

export async function addWinner(userId: number, prizeId: number): Promise<Winner> {
  try {
    console.log("Adding winner to draw list:", { userId, prizeId })

    // Check if prize exists and is active (but don't check quantity)
    const prizeResult = await sql`
      SELECT * FROM prizes
      WHERE id = ${prizeId} AND is_active = true
    `
    if (prizeResult.length === 0) {
      throw new Error("Prix non disponible")
    }

    // Add user to winners table (enters draw list) - NO quantity reduction
    const result = await sql`
      INSERT INTO winners (user_id, prize_id)
      VALUES (${userId}, ${prizeId})
      RETURNING *
    `
    console.log("Winner added to draw list successfully:", result[0])
    return result[0] as Winner
  } catch (error) {
    console.error("Error adding winner to draw list:", error)
    if (error instanceof Error && error.message.includes("Prix non disponible")) {
      throw error
    }
    throw new Error("Échec de l'enregistrement dans la liste de tirage")
  }
}

export async function getWinnersByPrize(prizeId: number): Promise<Winner[]> {
  try {
    console.log("Fetching winners for prize:", prizeId)
    const result = await sql`
      SELECT w.*, u.first_name, u.last_name, u.phone, p.name
      FROM winners w
      JOIN users u ON w.user_id = u.id
      JOIN prizes p ON w.prize_id = p.id
      WHERE w.prize_id = ${prizeId}
      ORDER BY w.won_at DESC
    `
    console.log("Winners fetched:", result.length)
    return result as Winner[]
  } catch (error) {
    console.error("Error getting winners by prize:", error)
    throw new Error("Échec de la récupération des gagnants")
  }
}

export async function setFinalWinner(winnerId: number): Promise<void> {
  try {
    console.log("Setting final winner:", winnerId)
    
    // First, get the winner and prize information
    const winnerResult = await sql`
      SELECT w.*, p.quantity, p.name
      FROM winners w
      JOIN prizes p ON w.prize_id = p.id
      WHERE w.id = ${winnerId}
    `
    
    if (winnerResult.length === 0) {
      throw new Error("Gagnant introuvable")
    }
    
    const winner = winnerResult[0]
    
    // Check if this winner is already a final winner
    if (winner.is_final_winner) {
      throw new Error("Ce gagnant est déjà un gagnant final")
    }
    
    // Count how many final winners already exist for this prize
    const finalWinnersCount = await sql`
      SELECT COUNT(*) as count
      FROM winners
      WHERE prize_id = ${winner.prize_id} AND is_final_winner = true
    `
    
    const currentFinalWinners = Number.parseInt(finalWinnersCount[0].count) || 0
    
    // Check if we can still have more final winners based on prize quantity
    if (currentFinalWinners >= winner.quantity) {
      throw new Error(`Impossible d'ajouter plus de gagnants finaux. La limite maximale est de ${winner.quantity} gagnants`)
    }
    
    // Set the winner as final winner AND reduce prize quantity
    await sql`
      UPDATE winners SET is_final_winner = true WHERE id = ${winnerId}
    `
    
    // Reduce prize quantity when admin makes final draw
    const prizeUpdateResult = await sql`
      UPDATE prizes
      SET quantity = quantity - 1
      WHERE id = ${winner.prize_id} AND quantity > 0
      RETURNING quantity
    `
    
    if (prizeUpdateResult.length === 0) {
      throw new Error("Impossible de réduire la quantité du prix")
    }
    
    console.log("Final winner set successfully and prize quantity reduced")
    console.log("Remaining prize quantity:", prizeUpdateResult[0].quantity)
  } catch (error) {
    console.error("Error setting final winner:", error)
    throw new Error("Échec de la désignation du gagnant final")
  }
}

export async function getUserPlayCount(userId: number): Promise<number> {
  try {
    console.log("Getting play count for user:", userId)
    const result = await sql`SELECT COUNT(*) as count FROM winners WHERE user_id = ${userId}`
    const count = Number.parseInt(result[0].count) || 0
    console.log("User play count:", count)
    return count
  } catch (error) {
    console.error("Error getting user play count:", error)
    return 0
  }
}

export async function canUserPlayToday(userId: number): Promise<{ canPlay: boolean; message: string; nextPlayTime?: string }> {
  try {
    // Get user's last win date
    const result = await sql`
      SELECT won_at FROM winners 
      WHERE user_id = ${userId} 
      ORDER BY won_at DESC 
      LIMIT 1
    `
    
    if (result.length === 0) {
      // User never won before, can play
      return {
        canPlay: true,
        message: "Vous pouvez jouer aujourd'hui !"
      }
    }
    
    const lastWinDate = new Date(result[0].won_at)
    const today = new Date()
    
    // Check if last win was today
    const isLastWinToday = lastWinDate.toDateString() === today.toDateString()
    
    if (isLastWinToday) {
      // User won today, cannot play until tomorrow 8 AM
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      
      return {
        canPlay: false,
        message: "Vous avez déjà joué aujourd'hui. Revenez demain à 8h00 pour une nouvelle chance !",
        nextPlayTime: tomorrow.toISOString()
      }
    } else {
      // User can play today
      return {
        canPlay: true,
        message: "Vous pouvez jouer aujourd'hui !"
      }
    }
  } catch (error) {
    console.error("Error checking if user can play today:", error)
    return {
      canPlay: false,
      message: "Erreur lors de la vérification. Veuillez réessayer."
    }
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    console.log("Fetching admin statistics...")

    const prizesResult = await sql`SELECT COUNT(*) as count FROM prizes WHERE is_active = true`
    const quantityResult = await sql`SELECT COALESCE(SUM(quantity), 0) as total FROM prizes WHERE is_active = true`
    const participantsResult = await sql`SELECT COUNT(DISTINCT user_id) as count FROM winners`
    const winnersResult = await sql`SELECT COUNT(*) as count FROM winners`
    const finalWinnersResult = await sql`SELECT COUNT(*) as count FROM winners WHERE is_final_winner = true`

    const stats: AdminStats = {
      totalPrizes: Number.parseInt(prizesResult[0].count) || 0,
      totalQuantity: Number.parseInt(quantityResult[0].total) || 0,
      totalParticipants: Number.parseInt(participantsResult[0].count) || 0,
      totalWinners: Number.parseInt(winnersResult[0].count) || 0,
      finalWinners: Number.parseInt(finalWinnersResult[0].count) || 0,
      pendingWinners: 0,
    }
    stats.pendingWinners = stats.totalWinners - stats.finalWinners

    console.log("Admin stats fetched:", stats)
    return stats
  } catch (error) {
    console.error("Error getting admin stats:", error)
    throw new Error("Échec de la récupération des statistiques")
  }
}

export async function getAvailablePrizes(): Promise<Prize[]> {
  try {
    console.log("Fetching all active prizes for wheel...")
    const result = await sql`
      SELECT * FROM prizes
      WHERE is_active = true
      ORDER BY probability DESC
    `
    console.log("Active prizes fetched:", result.length)
    return result as Prize[]  
  } catch (error) {
    console.error("Error getting active prizes:", error)
    throw new Error("Échec de la récupération des prix actifs")
  }
}

export async function getFinalWinnersCount(prizeId: number): Promise<number> {
  try {
    console.log("Getting final winners count for prize:", prizeId)
    const result = await sql`
      SELECT COUNT(*) as count
      FROM winners
      WHERE prize_id = ${prizeId} AND is_final_winner = true
    `
    const count = Number.parseInt(result[0].count) || 0
    console.log("Final winners count:", count)
    return count
  } catch (error) {
    console.error("Error getting final winners count:", error)
    return 0
  }
}

export async function seedPrizes(): Promise<void> {
  try {
    console.log("=== Seeding Prizes ===")
    
    // Check if prizes table exists and count existing prizes
    const existingPrizes = await sql`SELECT COUNT(*) as count FROM prizes`
    const prizeCount = Number.parseInt(existingPrizes[0].count)
    console.log("Current prize count:", prizeCount)
    
    if (prizeCount === 0) {
      console.log("No prizes found, seeding default prizes...")
      
      const result = await sql`
        INSERT INTO prizes (name, probability, quantity, is_active) VALUES
        ('Téléphone portable', 8.00, 1, true),
        ('Support de voiture pour téléphone', 8.00, 1, true),
        ('Pc Portable', 5.00, 1, true),
        ('Puce + 10GB Gratuit', 10.00, 1, true),
        ('Tablette', 8.00, 1, true),
        ('Imprimante Canon', 5.00, 1, true),
        ('Power Bank', 5.00, 1, true)
        RETURNING id, name
      `
      
      console.log("Successfully seeded prizes:", result.length)
      result.forEach((prize, index) => {
        console.log(`  ${index + 1}. ${prize.name} (ID: ${prize.id})`)
      })
    } else {
      console.log("Prizes already exist, skipping seed")
    }
  } catch (error) {
    console.error("Error seeding prizes:", error)
    throw new Error("Échec de l'initialisation des prix par défaut")
  }
}
