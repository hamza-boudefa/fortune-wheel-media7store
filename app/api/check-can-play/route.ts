import { type NextRequest, NextResponse } from "next/server"
import { canUserPlayToday } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({
        success: false,
        error: "ID d'utilisateur invalide"
      }, { status: 400 })
    }

    const playStatus = await canUserPlayToday(Number(userId))
    
    return NextResponse.json({
      success: true,
      ...playStatus
    })
  } catch (error) {
    console.error("Error checking if user can play:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la vérification"
    }, { status: 500 })
  }
}
