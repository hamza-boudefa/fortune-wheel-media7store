import { NextResponse } from "next/server"
import { getActivePrizes, testConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== Get Prizes API Called ===")

    // Test database connection and initialize tables
    console.log("Testing database connection and initializing tables...")
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("Database connection or initialization failed")
      return NextResponse.json(
        {
          success: false,
          error: "خطأ في الاتصال بقاعدة البيانات أو إنشاء الجداول",
          prizes: [],
        },
        { status: 500 },
      )
    }
    console.log("Database connection and initialization successful")

    const prizes = await getActivePrizes()
    console.log("Returning prizes:", prizes.length)

    return NextResponse.json({
      success: true,
      prizes: prizes,
    })
  } catch (error) {
    console.error("=== Get Prizes Error ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace")

    let errorMessage = "خطأ في جلب الجوائز"
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      errorMessage = "خطأ في إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى."
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        prizes: [],
      },
      { status: 500 },
    )
  }
}
