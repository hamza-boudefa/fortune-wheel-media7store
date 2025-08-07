import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ArJcd28BKPSm@ep-little-forest-a214x4xs-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const sql = neon(databaseUrl)

export async function GET(request: NextRequest, { params }: { params: { prizeId: string } }) {
  try {
    console.log("=== Get Winners by Prize API Called ===")
    const prizeId = Number.parseInt(params.prizeId)

    if (isNaN(prizeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف الجائزة غير صالح",
        },
        { status: 400 },
      )
    }

    console.log("Fetching winners for prize ID:", prizeId)

    // Updated query to properly join tables and get all user data
    const winners = await sql`
      SELECT 
        w.id,
        w.user_id,
        w.prize_id,
        w.is_final_winner,
        w.won_at,
        u.first_name,
        u.last_name,
        u.phone,
        p.name_ar,
        p.name_en
      FROM winners w
      INNER JOIN users u ON w.user_id = u.id
      INNER JOIN prizes p ON w.prize_id = p.id
      WHERE w.prize_id = ${prizeId}
      ORDER BY w.won_at DESC
    `

    console.log(`Found ${winners.length} winners for prize ${prizeId}`)
    console.log("Sample winner data:", winners[0])

    return NextResponse.json({
      success: true,
      winners: winners,
    })
  } catch (error) {
    console.error("=== Get Winners by Prize Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الفائزين",
        winners: [],
      },
      { status: 500 },
    )
  }
}
