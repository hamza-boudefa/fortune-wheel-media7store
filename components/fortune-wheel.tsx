"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Trophy, Star, RotateCcw } from 'lucide-react'
import type { Prize } from "@/lib/db"

interface FortuneWheelProps {
userId: number
onWin: (prize: Prize) => void
}

interface ConfettiPiece {
id: number
x: number
y: number
vx: number
vy: number
rotation: number
rotationSpeed: number
color: string
shape: "circle" | "square" | "triangle" | "star"
size: number
opacity: number
}

interface Firework {
id: number
x: number
y: number
particles: Array<{
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
}>
}

export default function FortuneWheel({ userId, onWin }: FortuneWheelProps) {
const [isSpinning, setIsSpinning] = useState(false)
const [rotation, setRotation] = useState(0)
const [showCelebration, setShowCelebration] = useState(false)
const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
const [fireworks, setFireworks] = useState<Firework[]>([])
const [wonPrize, setWonPrize] = useState<string>("")
const [screenShake, setScreenShake] = useState(false)
const [prizes, setPrizes] = useState<Prize[]>([]) // Actual prizes from DB
const [displaySegments, setDisplaySegments] = useState<Prize[]>([]) // Combined for display and spin logic
const [playCount, setPlayCount] = useState(0)
const [showSpinAgain, setShowSpinAgain] = useState(false)
const [spinAgainMessage, setSpinAgainMessage] = useState("")

// How long to show the "spin again" message before auto re-spin (in ms)
const SPIN_AGAIN_DELAY_MS = 1200

const canvasRef = useRef<HTMLCanvasElement>(null)
const celebrationRef = useRef<HTMLCanvasElement>(null)
const animationRef = useRef<number>()

// Audio refs
const spinSoundRef = useRef<HTMLAudioElement | null>(null)

const segmentAngle = displaySegments.length > 0 ? 360 / displaySegments.length : 0

// Define the static "3awed !" segment
const spinAgainSegment: Prize = {
  id: -1, // Unique ID for non-DB segment
  name_ar: '3awed !',
  name_en: '3awed !',
  color: '#DC2626', // Will be overridden by alternating logic, but good default
  probability: 0, // Not used for selection, but required by type
  is_active: true,
};

useEffect(() => {
  fetchPrizes()
  fetchPlayCount()
  initializeAudio()
}, [])

useEffect(() => {
  if (prizes.length > 0) {
    // Construct displaySegments based on the user's requested pattern
    // Pattern: Prize, Prize, 3awed, Prize, Prize, 3awed, Prize, Prize, 3awed, Prize
    const newDisplaySegments: Prize[] = [];
    const actualPrizes = [...prizes]; // Copy to mutate

    // Ensure we have at least 7 actual prizes to fill the pattern
    if (actualPrizes.length >= 7) {
      newDisplaySegments.push(actualPrizes[0]); // Téléphone portable
      newDisplaySegments.push(actualPrizes[1]); // Montre connectée
      newDisplaySegments.push(spinAgainSegment); // 3awed !
      newDisplaySegments.push(actualPrizes[2]); // Pc Portable
      newDisplaySegments.push(actualPrizes[3]); // Puce + 25GB Gratuit
      newDisplaySegments.push(spinAgainSegment); // 3awed !
      newDisplaySegments.push(actualPrizes[4]); // Tablette
      newDisplaySegments.push(actualPrizes[5]); // Bon d'achat 100 dinars
      newDisplaySegments.push(spinAgainSegment); // 3awed !
      newDisplaySegments.push(actualPrizes[6]); // Bon d'achat 50 dinars
    } else {
      // Fallback if not enough prizes are fetched, just use what's available and fill with spin again
      newDisplaySegments.push(...actualPrizes);
      while (newDisplaySegments.length < 10) { // Ensure at least 10 segments for the wheel
        newDisplaySegments.push(spinAgainSegment);
      }
    }
    setDisplaySegments(newDisplaySegments);
  }
}, [prizes]); // Re-run when prizes are fetched

useEffect(() => {
  if (displaySegments.length > 0) {
    drawWheel()
  }
}, [displaySegments, rotation]) // Redraw wheel when displaySegments or rotation changes

useEffect(() => {
  if (showCelebration || showSpinAgain) {
    createConfetti()
    createFireworks()
    animateEffects()
  } else {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
}, [showCelebration, showSpinAgain])

const fetchPrizes = async () => {
  try {
    const response = await fetch("/api/prizes")
    const data = await response.json()
    setPrizes(data.prizes || [])
  } catch (error) {
    console.error("Error fetching prizes:", error)
  }
}

const fetchPlayCount = async () => {
  try {
    const response = await fetch(`/api/user-stats/${userId}`)
    const data = await response.json()
    setPlayCount(data.playCount || 0)
  } catch (error) {
    console.error("Error fetching play count:", error)
  }
}

const initializeAudio = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const createSpinSound = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 3)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3)
      oscillator.type = "sawtooth"
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 3)
      return { oscillator, gainNode }
    }

    spinSoundRef.current = { play: createSpinSound } as any
  } catch (error) {
    console.log("Audio not supported:", error)
  }
}

const playSpinSound = () => {
  try {
    if (spinSoundRef.current?.play) {
      spinSoundRef.current.play()
    }
  } catch (error) {
    console.log("Could not play spin sound:", error)
  }
}

const playWinSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration)
      oscillator.type = "sine"
      oscillator.start(audioContext.currentTime + startTime)
      oscillator.stop(audioContext.currentTime + startTime + duration)
    }

    // Play victory melody
    playNote(523, 0, 0.2) // C
    playNote(659, 0.2, 0.2) // E
    playNote(784, 0.4, 0.2) // G
    playNote(1047, 0.6, 0.4) // C (higher)
  } catch (error) {
    console.log("Could not play win sound:", error)
  }
}

const playSpinAgainSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Play a different sound for spin again
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration)
      oscillator.type = "sine"
      oscillator.start(audioContext.currentTime + startTime)
      oscillator.stop(audioContext.currentTime + startTime + duration)
    }

    // Play encouraging melody for spin again
    playNote(440, 0, 0.15) // A
    playNote(523, 0.15, 0.15) // C
    playNote(659, 0.3, 0.2) // E
  } catch (error) {
    console.log("Could not play spin again sound:", error)
  }
}

const playClickSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    oscillator.type = "square"
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    console.log("Could not play click sound:", error)
  }
}

const createConfetti = () => {
  const pieces: ConfettiPiece[] = []
  const colors = [
    "#DC2626", // Red-600
    "#EF4444", // Red-500
    "#F87171", // Red-400
    "#FFFFFF", // White
    "#FCA5A5", // Red-300
    "#FECACA", // Red-200
  ]
  const shapes: ("circle" | "square" | "triangle" | "star")[] = ["circle", "square", "triangle", "star"]

  for (let i = 0; i < 150; i++) {
    pieces.push({
      id: i,
      x: Math.random() * 400,
      y: -10,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 10 + 6,
      opacity: 1,
    })
  }
  setConfetti(pieces)
}

const createFireworks = () => {
  const newFireworks: Firework[] = []
  for (let i = 0; i < 5; i++) {
    const firework: Firework = {
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 200 + 100,
      particles: [],
    }

    for (let j = 0; j < 20; j++) {
      const angle = (j / 20) * Math.PI * 2
      const speed = Math.random() * 3 + 2
      firework.particles.push({
        x: firework.x,
        y: firework.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? "#DC2626" : "#FFFFFF", // Red or White
        life: 60,
        maxLife: 60,
      })
    }
    newFireworks.push(firework)
  }
  setFireworks(newFireworks)
}

const animateEffects = () => {
  const canvas = celebrationRef.current
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Animate confetti
  setConfetti((prevConfetti) => {
    const updatedConfetti = prevConfetti
      .map((piece) => ({
        ...piece,
        x: piece.x + piece.vx,
        y: piece.y + piece.vy,
        vy: piece.vy + 0.15, // gravity
        vx: piece.vx * 0.99, // air resistance
        rotation: piece.rotation + piece.rotationSpeed,
        opacity: piece.y > 350 ? Math.max(0, piece.opacity - 0.03) : piece.opacity,
      }))
      .filter((piece) => piece.y < 500 && piece.opacity > 0)

    // Draw confetti pieces
    updatedConfetti.forEach((piece) => {
      ctx.save()
      ctx.globalAlpha = piece.opacity
      ctx.translate(piece.x, piece.y)
      ctx.rotate((piece.rotation * Math.PI) / 180)
      ctx.fillStyle = piece.color

      switch (piece.shape) {
        case "circle":
          ctx.beginPath()
          ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case "square":
          ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)
          break
        case "triangle":
          ctx.beginPath()
          ctx.moveTo(0, -piece.size / 2)
          ctx.lineTo(-piece.size / 2, piece.size / 2)
          ctx.lineTo(piece.size / 2, piece.size / 2)
          ctx.closePath()
          ctx.fill()
          break
        case "star":
          drawStar(ctx, 0, 0, 5, piece.size / 2, piece.size / 4)
          ctx.fill()
          break
      }
      ctx.restore()
    })

    return updatedConfetti
  })

  // Animate fireworks
  setFireworks((prevFireworks) => {
    const updatedFireworks = prevFireworks
      .map((firework) => ({
        ...firework,
        particles: firework.particles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // gravity
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0),
      }))
      .filter((firework) => firework.particles.length > 0)

    // Draw fireworks
    updatedFireworks.forEach((firework) => {
      firework.particles.forEach((particle) => {
        ctx.save()
        ctx.globalAlpha = particle.life / particle.maxLife
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    })

    return updatedFireworks
  })

  if (showCelebration || showSpinAgain) {
    animationRef.current = requestAnimationFrame(animateEffects)
  }
}

const drawStar = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
) => {
  let rot = (Math.PI / 2) * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
}

const drawWheel = () => {
  const canvas = canvasRef.current
  if (!canvas || displaySegments.length === 0) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 10

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw shadow
  ctx.save()
  ctx.shadowColor = "rgba(220, 38, 38, 0.3)" // Red shadow
  ctx.shadowBlur = 20
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 10
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.restore()

  // Draw segments
  displaySegments.forEach((segment, index) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180)
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180)

    // Alternate between red and white segments for elegance
    const isRedSegment = index % 2 === 0
    const segmentColor = isRedSegment ? "#DC2626" : "#FFFFFF";

    // Create subtle gradient for 3D effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    if (isRedSegment) {
      gradient.addColorStop(0, "#EF4444") // Lighter red center
      gradient.addColorStop(0.7, "#DC2626") // Main red
      gradient.addColorStop(1, "#B91C1C") // Darker red edge
    } else {
      gradient.addColorStop(0, "#FFFFFF") // White center
      gradient.addColorStop(0.7, "#F9FAFB") // Slightly gray
      gradient.addColorStop(1, "#F3F4F6") // Light gray edge
    }

    // Draw segment
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw segment border
    ctx.strokeStyle = "#DC2626" // Red border for all segments
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Draw text
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(startAngle + (endAngle - startAngle) / 2)
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    
    ctx.fillStyle = isRedSegment ? "#FFFFFF" : "#DC2626" // White text on red, red text on white

    // Elegant font with special styling for "3awed"
    const isSpinAgain = segment.name_en === "3awed !"
    const fontSize = isSpinAgain ? 16 : (segment.name_en.length > 15 ? 11 : 14)
    ctx.font = `${isSpinAgain ? 'bold' : '500'} ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`

    // Position text
    const textRadius = segment.name_en.length > 15 ? radius * 0.65 : radius * 0.75
    ctx.fillText(segment.name_en, textRadius, 0)
    ctx.restore()
  })

  // Draw center hub
  const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35)
  hubGradient.addColorStop(0, "#FFFFFF")
  hubGradient.addColorStop(0.7, "#F9FAFB")
  hubGradient.addColorStop(1, "#DC2626") // Red edge

  ctx.beginPath()
  ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI)
  ctx.fillStyle = hubGradient
  ctx.fill()
  ctx.strokeStyle = "#DC2626" // Red border
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw center logo/text
  ctx.fillStyle = "#DC2626"
  ctx.font = "bold 10px 'Inter', system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("MEDIA 7", centerX, centerY - 4)
  ctx.fillText("STORE", centerX, centerY + 8)
}

const spinWheel = async () => {
  if (isSpinning || displaySegments.length === 0) return

  // Play click sound
  playClickSound()

  setIsSpinning(true)
  setShowCelebration(false)
  setShowSpinAgain(false)
  setScreenShake(false)

  // Play spinning sound
  playSpinSound()

  // Generate random rotation (multiple full rotations + random angle)
  const minSpins = 5
  const maxSpins = 10
  const spins = Math.random() * (maxSpins - minSpins) + minSpins
  const finalAngle = Math.random() * 360
  const totalRotation = rotation + spins * 360 + finalAngle

  setRotation(totalRotation)

  // Calculate which segment we landed on based on the final rotation
  // The pointer is at the top (12 o'clock), so we need to account for that
  const normalizedAngle = (360 - (totalRotation % 360)) % 360
  const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % displaySegments.length
  const selectedSegment = displaySegments[segmentIndex]

  setWonPrize(selectedSegment.name_en)

  setTimeout(async () => {
    const isSpinAgain = selectedSegment.name_en === "3awed !"

    if (isSpinAgain) {
      // Play a distinct sound and show message, but don't auto-spin
      playSpinAgainSound()
      setShowSpinAgain(true)
      setSpinAgainMessage("🎯 Essayez encore !")
      setScreenShake(true)

      // Stop screen shake after a short time
      setTimeout(() => setScreenShake(false), 600)

      // Allow user to spin again manually
      setIsSpinning(false)
    } else {
      // Real prize won - show celebration and record win
      playWinSound()
      setShowCelebration(true)
      setScreenShake(true)

      // Stop screen shake after 1 second
      setTimeout(() => setScreenShake(false), 1000)
      // Stop celebration after 5 seconds
      setTimeout(() => setShowCelebration(false), 5000)

      // Record the win (only for real prizes, not "3awed")
      try {
        await fetch("/api/record-win", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            prizeId: selectedSegment.id, // Use the actual prize ID
          }),
        })
        setPlayCount((prev) => prev + 1)
        onWin(selectedSegment) // Pass the actual prize object
      } catch (error) {
        console.error("Error recording win:", error)
      } finally {
        setIsSpinning(false)
      }
    }
  }, 4000) // This is the total animation duration
}

if (displaySegments.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
      <div className="text-center text-white">
        <Sparkles className="w-16 h-16 mx-auto mb-4 animate-spin" />
        <p className="text-2xl font-medium font-['Inter']">Chargement des prix...</p>
      </div>
    </div>
  )
}

return (
  <div
    className={`min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4 relative overflow-hidden ${screenShake ? "animate-bounce" : ""}`}
    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
  >
    {/* Simple background elements */}
    <div className="absolute inset-0">
      <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/5 rounded-full animate-pulse"></div>
    </div>

    <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl relative overflow-hidden">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-white to-red-50 border-b border-red-100">
        <div className="flex justify-center items-center gap-3 mb-4">
          <img src="/media7-logo.png" alt="Media 7 Store" className="h-12 w-auto" />
        </div>
        <CardTitle
          className="text-4xl font-bold text-red-600"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Roue de la Fortune
        </CardTitle>
        <p className="text-red-700 text-lg font-medium">Tournez la roue et gagnez des prix fantastiques!</p>
        <div className="flex justify-center items-center gap-2 mt-4">
          <Star className="w-4 h-4 text-red-600" />
          <span className="text-red-600 font-medium">Parties jouées: {playCount}</span>
          <Star className="w-4 h-4 text-red-600" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center space-y-8 p-8">
        <Card className="w-full max-w-lg mx-auto bg-white border border-red-200 shadow-xl">
          <CardContent className="p-6">
            <div className="relative w-96 h-96 mx-auto mb-6">
              {/* Celebration Canvas */}
              <canvas
                ref={celebrationRef}
                width={400}
                height={400}
                className="absolute inset-0 pointer-events-none z-30"
                style={{ left: "-2px", top: "-2px" }}
              />

              {/* Celebration Effects */}
              {(showCelebration || showSpinAgain) && (
                <div className="absolute inset-0 pointer-events-none z-25">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-ping"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1 + Math.random()}s`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: (Math.random() > 0.5 ? "#DC2626" : "#FFFFFF"),
                          boxShadow: `0 0 8px ${(Math.random() > 0.5 ? "#DC2626" : "#FFFFFF")}`,
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Glow Effect for Winning */}
              {showCelebration && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-red-600 opacity-20 animate-pulse z-20"></div>
              )}

              {/* Glow Effect for Spin Again */}
              {showSpinAgain && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-red-600 opacity-20 animate-pulse z-20"></div>
              )}

              <canvas
                ref={canvasRef}
                width={384}
                height={384}
                className="absolute inset-0 z-10"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 4s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
                }}
              />

              {/* Simple Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-15">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600 drop-shadow-sm"></div>
              </div>

              {/* Elegant Spin Button */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <Button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className={`
                    w-20 h-20 rounded-full font-semibold text-base shadow-lg transition-all duration-300
                    ${
                      isSpinning
                        ? "bg-gray-400 text-white cursor-not-allowed scale-95"
                        : (showCelebration || showSpinAgain)
                          ? "bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95 animate-pulse"
                          : "bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95"
                    }
                  `}
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                >
                  {isSpinning ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mb-1"></div>
                      <span className="text-xs">Rotation</span>
                    </div>
                  ) : showCelebration ? (
                    <span className="text-lg">🎉</span>
                  ) : showSpinAgain ? (
                    <div className="flex flex-col items-center">
                      <RotateCcw className="w-5 h-5 mb-1" />
                      <span className="text-xs">Encore!</span>
                    </div>
                  ) : (
                    <span>Tourner</span>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isSpinning
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : (showCelebration || showSpinAgain)
                      ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {isSpinning ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent mr-2"></div>
                    Rotation en cours...
                  </>
                ) : showCelebration ? (
                  <>🎉 Félicitations! Vous avez gagné: {wonPrize}! 🎉</>
                ) : showSpinAgain ? (
                  <>🎯 {spinAgainMessage} Cliquez pour tourner à nouveau!</>
                ) : (
                  "Prêt à tourner!"
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
)
}
