"use client"

import { useState } from "react"
import UserForms from "@/components/user-forms"
import FortuneWheel from "@/components/fortune-wheel"
import { Trophy, Sparkles, RotateCcw } from "lucide-react"
import type { Prize } from "@/lib/db"

export default function HomePage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [hasWon, setHasWon] = useState(false)
  const [wonPrize, setWonPrize] = useState<Prize | null>(null)

  const handleUserReady = (id: number) => {
    setUserId(id)
  }

  const handleWin = (prize: Prize) => {
    setWonPrize(prize)
    setHasWon(true)
  }

  const resetGame = () => {
    setUserId(null)
    setHasWon(false)
    setWonPrize(null)
  }

  if (hasWon && wonPrize) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4 relative overflow-hidden"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Simple background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
        </div>

        <div className="text-center space-y-8 relative z-10">
          {/* Celebration animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative">
              <Trophy className="w-24 h-24 text-white mx-auto animate-bounce" />
              <div className="absolute inset-0 w-24 h-24 mx-auto">
                <Sparkles className="absolute top-0 left-0 w-6 h-6 text-white animate-ping" />
                <Sparkles className="absolute top-0 right-0 w-5 h-5 text-white animate-ping animation-delay-200" />
                <Sparkles className="absolute bottom-0 left-0 w-5 h-5 text-white animate-ping animation-delay-400" />
                <Sparkles className="absolute bottom-0 right-0 w-4 h-4 text-white animate-ping animation-delay-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <h1 className="text-5xl font-bold text-red-600 mb-6">Félicitations!</h1>

            <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-200">
              <p className="text-xl text-red-800 font-medium mb-3">Vous avez gagné:</p>
              <div className="text-3xl font-bold text-red-600 bg-white rounded-lg py-3 px-4">{wonPrize.name_en}</div>
            </div>

            <div className="space-y-3 text-red-700">
              <p className="text-lg font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" />
                Vous êtes inscrit au tirage final
                <Sparkles className="w-5 h-5 text-red-600" />
              </p>
              <p className="text-base">Vous serez contacté en cas de gain final</p>
            </div>

            <button
              onClick={resetGame}
              className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              Nouvelle partie
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!userId) {
    return <UserForms onUserReady={handleUserReady} />
  }

  return <FortuneWheel userId={userId} onWin={handleWin} />
}
