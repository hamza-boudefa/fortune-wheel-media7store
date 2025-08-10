import { type NextRequest, NextResponse } from "next/server"
import { getWinnersByPrize } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { prizeId: string } }
) {
  try {
    console.log("=== Get Winners by Prize API Called ===")
    console.log("Prize ID:", params.prizeId)

    const prizeId = Number.parseInt(params.prizeId)
    if (isNaN(prizeId) || prizeId <= 0) {
      return NextResponse.json({ success: false, error: "ID de prix invalide" }, { status: 400 })
    }

    console.log("Fetching winners for prize ID:", prizeId)
    const winners = await getWinnersByPrize(prizeId)

    console.log("Winners fetched successfully:", winners.length)
    return NextResponse.json({
      success: true,
      winners: winners,
    })
  } catch (error) {
    console.error("=== Get Winners by Prize Error ===")
    console.error("Error:", error)

    return NextResponse.json({ success: false, error: "Erreur lors de la récupération des gagnants", winners: [] }, { status: 500 })
  }
}
