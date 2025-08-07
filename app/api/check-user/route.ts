import { type NextRequest, NextResponse } from "next/server"
import { getUserByPhone, testConnection } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Check User API Called ===")

    // Test database connection and initialize tables
    console.log("Testing database connection and initializing tables...")
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("Database connection or initialization failed")
      return NextResponse.json(
        {
          success: false,
          error: "خطأ في الاتصال بقاعدة البيانات أو إنشاء الجداول",
        },
        { status: 500 },
      )
    }
    console.log("Database connection and initialization successful")

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "خطأ في تحليل البيانات المرسلة",
        },
        { status: 400 },
      )
    }

    const { phone } = body
    console.log("Checking phone:", phone)

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الهاتف مطلوب",
        },
        { status: 400 },
      )
    }

    // Validate phone number format
    const phoneRegex = /^\d{8}$/
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الهاتف يجب أن يكون 8 أرقام",
        },
        { status: 400 },
      )
    }

    const user = await getUserByPhone(phone.trim())
    console.log("User found:", !!user)

    return NextResponse.json({
      exists: !!user,
      user: user,
    })
  } catch (error) {
    console.error("=== Check User Error ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace")

    let errorMessage = "خطأ في التحقق من المستخدم"
    if (error instanceof Error && error.message.includes("relation") && error.message.includes("does not exist")) {
      errorMessage = "خطأ في إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى."
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
