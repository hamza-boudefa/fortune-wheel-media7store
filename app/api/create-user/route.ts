import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByPhone, testConnection } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Create User API Called ===")

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

    const { phone, firstName, lastName } = body
    console.log("Request data:", { phone, firstName, lastName })

    // Validate required fields
    if (!phone || !firstName || !lastName) {
      console.log("Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "جميع الحقول مطلوبة",
        },
        { status: 400 },
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\d{8}$/
    if (!phoneRegex.test(phone.trim())) {
      console.log("Invalid phone format:", phone)
      return NextResponse.json(
        {
          success: false,
          error: "رقم الهاتف يجب أن يكون 8 أرقام",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    console.log("Checking if user exists...")
    const existingUser = await getUserByPhone(phone)
    if (existingUser) {
      console.log("User already exists")
      return NextResponse.json(
        {
          success: false,
          error: "المستخدم موجود بالفعل",
        },
        { status: 400 },
      )
    }

    // Create new user
    console.log("Creating new user...")
    const user = await createUser(phone.trim(), firstName.trim(), lastName.trim())

    console.log("User created successfully:", user.id)
    return NextResponse.json({
      success: true,
      user: user,
    })
  } catch (error) {
    console.error("=== Create User Error ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace")

    // Handle specific error types
    let errorMessage = "خطأ غير معروف في الخادم"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("رقم الهاتف مستخدم بالفعل")) {
        errorMessage = error.message
        statusCode = 400
      } else if (error.message.includes("فشل في البحث عن المستخدم")) {
        errorMessage = "خطأ في قاعدة البيانات"
        statusCode = 500
      } else if (error.message.includes("فشل في إنشاء المستخدم")) {
        errorMessage = error.message
        statusCode = 500
      } else if (error.message.includes("relation") && error.message.includes("does not exist")) {
        errorMessage = "خطأ في إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى."
        statusCode = 500
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    )
  }
}
