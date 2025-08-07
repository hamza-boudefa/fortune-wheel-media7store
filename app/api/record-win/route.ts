import { type NextRequest, NextResponse } from "next/server"
import { addWinner } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Record Win API Called ===")

    const body = await request.json()
    const { userId, prizeId } = body

    console.log("Recording win:", { userId, prizeId })

    if (!userId || !prizeId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف المستخدم والجائزة مطلوبان",
        },
        { status: 400 },
      )
    }

    const winner = await addWinner(Number(userId), Number(prizeId))

    console.log("Win recorded successfully:", winner)
    return NextResponse.json({
      success: true,
      winner: winner,
    })
  } catch (error) {
    console.error("=== Record Win Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "خطأ في تسجيل الفوز",
      },
      { status: 500 },
    )
  }
}
