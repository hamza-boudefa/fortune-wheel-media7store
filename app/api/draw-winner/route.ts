import { type NextRequest, NextResponse } from "next/server"
import { setFinalWinner } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Draw Winner API Called ===")
    const body = await request.json()
    const { winnerId } = body

    if (!winnerId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du gagnant requis",
        },
        { status: 400 },
      )
    }

    await setFinalWinner(Number(winnerId))

    console.log(`Winner ${winnerId} successfully marked as final.`)
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("=== Draw Winner Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors du tirage au sort",
      },
      { status: 500 },
    )
  }
}
