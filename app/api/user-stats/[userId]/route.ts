import { type NextRequest, NextResponse } from "next/server"
import { getUserPlayCount } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log("=== Get User Stats API Called ===")
    console.log("User ID:", params.userId)

    const userId = Number.parseInt(params.userId)
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({
        success: false,
        error: "ID d'utilisateur invalide",
      }, { status: 400 })
    }

    console.log("Getting play count for user ID:", userId)
    const playCount = await getUserPlayCount(userId)

    console.log("User stats fetched successfully. Play count:", playCount)
    return NextResponse.json({
      success: true,
      stats: {
        playCount: playCount,
      },
    })
  } catch (error) {
    console.error("=== Get User Stats Error ===")
    console.error("Error:", error)

    return NextResponse.json({
      success: false,
      error: "Erreur lors de la récupération des statistiques de l'utilisateur",
    }, { status: 500 })
  }
}
