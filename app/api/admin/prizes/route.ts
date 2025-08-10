export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getAllPrizes, testConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("[GET /api/admin/prizes] Starting...")

    const ok = await testConnection()
    if (!ok) {
      console.log("[GET /api/admin/prizes] Database connection failed")
      return NextResponse.json(
        { success: false, error: "خطأ في الاتصال بقاعدة البيانات أو إنشاء الجداول", prizes: [] },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    const prizes = await getAllPrizes()
    console.log("[GET /api/admin/prizes] Returning", prizes.length, "total prizes")
    console.log(
      "[GET /api/admin/prizes] Prize quantities:",
      prizes.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity })),
    )

    return NextResponse.json(
      { success: true, prizes },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[GET /api/admin/prizes] Error:", error)
    return NextResponse.json(
      { success: false, error: "خطأ في جلب جميع الجوائز", prizes: [] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
