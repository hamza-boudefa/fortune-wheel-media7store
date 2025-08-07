import { NextResponse } from "next/server"

export async function GET() {
  try {
    const diagnostics = {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
        NODE_ENV: process.env.NODE_ENV || "Not set",
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      diagnostics,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
