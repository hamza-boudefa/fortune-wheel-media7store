import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== Get Admin Stats API Called ===")

    await testConnection()

    const { getAdminStats } = await import("@/lib/db")
    const stats = await getAdminStats()

    console.log("Admin stats fetched successfully")
    return NextResponse.json({
      success: true,
      stats: stats,
    })
  } catch (error) {
    console.error("=== Get Admin Stats Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الإحصائيات",
        stats: {
          totalPrizes: 0,
          totalParticipants: 0,
          totalWinners: 0,
          finalWinners: 0,
          pendingWinners: 0,
          totalQuantity: 0,
        },
      },
      { status: 500 },
    )
  }
}
