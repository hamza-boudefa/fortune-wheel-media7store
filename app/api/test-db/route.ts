import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    console.log("=== Database Test API Called ===")

    // Test connection and initialize using our helper function
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection or initialization failed",
          details: "Could not establish connection to database or create tables",
        },
        { status: 500 },
      )
    }

    // Test tables exist
    const databaseUrl =
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_ArJcd28BKPSm@ep-little-forest-a214x4xs-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    const sql = neon(databaseUrl)

    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'prizes', 'winners')
      ORDER BY table_name
    `

    console.log("Tables found:", tablesResult)

    // Test if we have data in prizes table
    const prizesCount = await sql`SELECT COUNT(*) as count FROM prizes WHERE is_active = true`
    console.log("Active prizes count:", prizesCount[0].count)

    // Test users table
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`
    console.log("Users count:", usersCount[0].count)

    return NextResponse.json({
      success: true,
      message: "Database connection, tables, and data verified successfully",
      tables: tablesResult,
      activePrizes: Number.parseInt(prizesCount[0].count),
      totalUsers: Number.parseInt(usersCount[0].count),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Database Test Error ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
