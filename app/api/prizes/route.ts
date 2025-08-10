export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { getAllPrizes, createPrize } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Get All Prizes API Called ===")

    const prizes = await getAllPrizes()

    console.log("Prizes fetched successfully:", prizes.length)
    return NextResponse.json({
      success: true,
      prizes: prizes,
    })
  } catch (error) {
    console.error("=== Get All Prizes Error ===")
    console.error("Error:", error)

    return NextResponse.json(
      { success: false, error: "Échec de la récupération des prix", prizes: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Create Prize API Called ===")
    const body = await request.json()
    console.log("Create prize request body:", body)

    const { name, probability, quantity, is_active } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Nom requis" }, { status: 400 })
    }

    // Validate probability
    const parsedProbability = Number(probability)
    if (isNaN(parsedProbability) || parsedProbability < 0 || parsedProbability > 100) {
      return NextResponse.json({ success: false, error: "Valeur de probabilité invalide" }, { status: 400 })
    }

    // Validate quantity
    const parsedQuantity = Number(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return NextResponse.json({ success: false, error: "Valeur de quantité invalide" }, { status: 400 })
    }

    const newPrize = await createPrize(
      name.trim(),
      parsedProbability,
      parsedQuantity,
      is_active !== undefined ? Boolean(is_active) : true,
    )

    console.log("Prize created successfully:", newPrize)
    return NextResponse.json({
      success: true,
      prize: newPrize,
    })
  } catch (error) {
    console.error("=== Create Prize Error ===")
    console.error("Error:", error)

    return NextResponse.json({ success: false, error: "Échec de la création du prix" }, { status: 500 })
  }
}
