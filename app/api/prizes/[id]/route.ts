export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { updatePrize, deletePrize } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== Update Prize API Called ===")
    console.log("Prize ID:", params.id)

    const id = Number.parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ success: false, error: "ID de prix invalide" }, { status: 400 })
    }

    const body = await request.json()
    console.log("Update request body:", body)

    // Validate required fields
    if (body.probability !== undefined) {
      const probability = Number(body.probability)
      if (isNaN(probability) || probability < 0 || probability > 100) {
        return NextResponse.json({ success: false, error: "Valeur de probabilité invalide" }, { status: 400 })
      }
    }

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity)
      if (isNaN(quantity) || quantity < 0) {
        return NextResponse.json({ success: false, error: "Valeur de quantité invalide" }, { status: 400 })
      }
    }

    const updatedPrize = await updatePrize(id, {
      name: body.name,
      probability: body.probability,
      quantity: body.quantity,
      is_active: body.is_active,
    })

    console.log("Prize updated successfully:", updatedPrize)
    return NextResponse.json({
      success: true,
      prize: updatedPrize,
    })
  } catch (error) {
    console.error("=== Update Prize Error ===")
    console.error("Error:", error)

    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour du prix" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== Delete Prize API Called ===")
    console.log("Prize ID:", params.id)

    const id = Number.parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ success: false, error: "ID de prix invalide" }, { status: 400 })
    }

    await deletePrize(id)

    console.log("Prize deleted successfully")
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("=== Delete Prize Error ===")
    console.error("Error:", error)

    return NextResponse.json({ success: false, error: "Erreur lors de la suppression du prix" }, { status: 500 })
  }
}
