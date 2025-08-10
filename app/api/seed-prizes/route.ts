import { type NextRequest, NextResponse } from "next/server"
import { seedPrizes } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Seed Prizes API Called ===")
    
    await seedPrizes()
    
    console.log("Prizes seeded successfully")
    return NextResponse.json({
      success: true,
      message: "Prix initialisés avec succès",
    })
  } catch (error) {
    console.error("=== Seed Prizes Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'initialisation des prix",
      },
      { status: 500 },
    )
  }
} 