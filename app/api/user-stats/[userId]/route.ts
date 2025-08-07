import { type NextRequest, NextResponse } from "next/server"
import { getUserPlayCount } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = Number.parseInt(params.userId)

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف المستخدم غير صالح",
        },
        { status: 400 },
      )
    }

    const playCount = await getUserPlayCount(userId)

    return NextResponse.json({
      playCount: playCount,
    })
  } catch (error) {
    console.error("Error getting user stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب إحصائيات المستخدم",
      },
      { status: 500 },
    )
  }
}
