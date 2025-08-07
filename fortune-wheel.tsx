"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const segments = [
  { text: "BUY", color: "#22c55e", textColor: "#ffffff" },
  { text: "SELL", color: "#ef4444", textColor: "#ffffff" },
  { text: "HOLD", color: "#3b82f6", textColor: "#ffffff" },
  { text: "RESEARCH", color: "#8b5cf6", textColor: "#ffffff" },
  { text: "DIVERSIFY", color: "#f59e0b", textColor: "#ffffff" },
  { text: "WAIT", color: "#6b7280", textColor: "#ffffff" },
  { text: "INVEST MORE", color: "#10b981", textColor: "#ffffff" },
  { text: "TAKE PROFIT", color: "#f97316", textColor: "#ffffff" },
]

export default function FortuneWheel() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)

  const spinWheel = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // Generate random rotation (multiple full rotations + random angle)
    const minSpins = 5
    const maxSpins = 10
    const spins = Math.random() * (maxSpins - minSpins) + minSpins
    const finalAngle = Math.random() * 360
    const totalRotation = rotation + spins * 360 + finalAngle

    setRotation(totalRotation)

    // Calculate which segment we landed on
    const segmentAngle = 360 / segments.length
    const normalizedAngle = (360 - (totalRotation % 360)) % 360
    const segmentIndex = Math.floor(normalizedAngle / segmentAngle)
    const selectedSegment = segments[segmentIndex]

    // Show result after animation completes
    setTimeout(() => {
      setResult(selectedSegment.text)
      setIsSpinning(false)
    }, 3000)
  }

  const resetWheel = () => {
    setRotation(0)
    setResult(null)
    setIsSpinning(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">🎰 Ultima Market Fortune Wheel</CardTitle>
          <p className="text-white/80">Spin the wheel to get your market guidance!</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          {/* Wheel Container */}
          <div className="relative">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400"></div>
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="relative w-80 h-80 rounded-full border-8 border-yellow-400 shadow-2xl overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 3s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
              }}
            >
              {segments.map((segment, index) => {
                const angle = (360 / segments.length) * index
                const nextAngle = (360 / segments.length) * (index + 1)

                return (
                  <div
                    key={index}
                    className="absolute w-full h-full"
                    style={{
                      background: `conic-gradient(from ${angle}deg, ${segment.color} 0deg, ${segment.color} ${360 / segments.length}deg, transparent ${360 / segments.length}deg)`,
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${50 + 50 * Math.sin((angle * Math.PI) / 180)}%, ${50 + 50 * Math.cos((nextAngle * Math.PI) / 180)}% ${50 + 50 * Math.sin((nextAngle * Math.PI) / 180)}%)`,
                    }}
                  >
                    <div
                      className="absolute text-sm font-bold flex items-center justify-center"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) rotate(${angle + 360 / segments.length / 2}deg) translateY(-60px)`,
                        color: segment.textColor,
                        width: "100px",
                        textAlign: "center",
                      }}
                    >
                      {segment.text}
                    </div>
                  </div>
                )
              })}

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <div className="text-2xl">🎯</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              onClick={spinWheel}
              disabled={isSpinning}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold px-8 py-3 text-lg"
            >
              {isSpinning ? "Spinning..." : "🎲 SPIN THE WHEEL"}
            </Button>
            <Button
              onClick={resetWheel}
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Reset
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-white">🎉 Result:</div>
              <Badge className="text-2xl px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold">
                {result}
              </Badge>
              <div className="text-white/80 text-lg">The market fortune has spoken! 📈</div>
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-md">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }}></div>
                <span className="text-white/80 text-sm">{segment.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
