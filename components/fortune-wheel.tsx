"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Star, RotateCcw } from "lucide-react"
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
  const [prizes, setPrizes] = useState<Prize[]>([]) // Available prizes from DB (quantity > 0)
  const [displaySegments, setDisplaySegments] = useState<Prize[]>([]) // Combined for display and spin logic
  const [playCount, setPlayCount] = useState(0)
  const [showSpinAgain, setShowSpinAgain] = useState(false)
  const [spinAgainMessage, setSpinAgainMessage] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const celebrationRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  const segmentAngle = displaySegments.length > 0 ? 360 / displaySegments.length : 0

  // Static "3awed !" segment
  const spinAgainSegment: Prize = {
    id: -1,
    name: "3awed !",
    probability: 0,
    quantity: 999,
    is_active: true,
  }

  useEffect(() => {
    fetchAvailablePrizes()
    fetchPlayCount()
    initializeAudio()
  }, [userId])

  useEffect(() => {
    if (prizes.length > 0) {
      const newDisplaySegments: Prize[] = []
      const availablePrizes = [...prizes]
      const maxSpinAgain = 3 // Maximum 3 spin-again segments

      // Calculate strategic positions for spin-again segments
      // Position 1: Top (around 12 o'clock)
      // Position 2: Bottom left (around 8 o'clock) 
      // Position 3: Bottom right (around 4 o'clock)
      const spinAgainPositions = [0, Math.floor(availablePrizes.length * 0.67), Math.floor(availablePrizes.length * 0.33)]

      // Add prizes and spin-again segments at strategic positions
      availablePrizes.forEach((prize, index) => {
        newDisplaySegments.push(prize)
        
        // Add spin-again segment at strategic positions
        if (spinAgainPositions.includes(index) && newDisplaySegments.filter(s => s.name === "3awed !").length < maxSpinAgain) {
          newDisplaySegments.push(spinAgainSegment)
        }
      })

      // Ensure we have at least 8 segments for a good wheel appearance
      while (newDisplaySegments.length < 8) {
        newDisplaySegments.push(spinAgainSegment)
      }

      const spinAgainCount = newDisplaySegments.filter(s => s.name === "3awed !").length
      console.log("Created display segments:", newDisplaySegments.length, "Total prizes:", availablePrizes.length, "Spin-again segments:", spinAgainCount)
      console.log("Spin-again positions:", spinAgainPositions)
      setDisplaySegments(newDisplaySegments)
    }
  }, [prizes])

  useEffect(() => {
    if (displaySegments.length > 0) {
      drawWheel()
    }
  }, [displaySegments, rotation])

  useEffect(() => {
    if (showCelebration || showSpinAgain) {
      createConfetti()
      createFireworks()
      animateEffects()
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [showCelebration, showSpinAgain])

  const fetchAvailablePrizes = async () => {
    try {
      const response = await fetch("/api/prizes")
      const data = await response.json()
      const availablePrizes = data.prizes || []
      console.log("=== Frontend Prize Fetch ===")
      console.log("API Response:", data)
      console.log("Prizes array length:", availablePrizes.length)
      console.log("All prizes:", availablePrizes)
      setPrizes(availablePrizes)
    } catch (error) {
      console.error("Error fetching available prizes:", error)
    }
  }

  const fetchPlayCount = async () => {
    try {
      const response = await fetch(`/api/user-stats/${userId}`)
      const data = await response.json()
      console.log("Fetching play count for user", userId, "Response:", data)
      const playCountValue = data.stats?.playCount || 0
      console.log("Setting play count to:", playCountValue)
      setPlayCount(playCountValue)
    } catch (error) {
      console.error("Error fetching play count:", error)
    }
  }

  const initializeAudio = () => {
    try {
      console.log("Audio system initialized")
    } catch (error) {
      console.log("Audio not supported:", error)
    }
  }

  const playSpinSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const duration = 4
      const createMechanicalWheelSound = () => {
        // whoosh
        const bufferSize = audioContext.sampleRate * 0.8
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
        const noiseData = noiseBuffer.getChannelData(0)
        let lastOut = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          noiseData[i] = (lastOut + 0.05 * white) / 1.05
          lastOut = noiseData[i]
          noiseData[i] *= 2.5
        }
        const whooshSource = audioContext.createBufferSource()
        const whooshGain = audioContext.createGain()
        const whooshFilter = audioContext.createBiquadFilter()
        whooshSource.buffer = noiseBuffer
        whooshSource.connect(whooshFilter)
        whooshFilter.connect(whooshGain)
        whooshGain.connect(audioContext.destination)
        whooshFilter.type = "highpass"
        whooshFilter.frequency.setValueAtTime(800, audioContext.currentTime)
        whooshFilter.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.8)
        whooshFilter.Q.setValueAtTime(1.5, audioContext.currentTime)
        whooshGain.gain.setValueAtTime(0.15, audioContext.currentTime)
        whooshGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8)
        whooshSource.start()
        whooshSource.stop(audioContext.currentTime + 0.8)

        // ticks
        const totalTicks = 45
        let tickInterval = 0.06
        let currentTime = 0.3
        for (let i = 0; i < totalTicks; i++) {
          const tickOsc1 = audioContext.createOscillator()
          const tickOsc2 = audioContext.createOscillator()
          const tickGain = audioContext.createGain()
          const tickFilter = audioContext.createBiquadFilter()
          const tickGainMaster = audioContext.createGain()
          tickOsc1.connect(tickGain)
          tickOsc2.connect(tickGain)
          tickGain.connect(tickFilter)
          tickFilter.connect(tickGainMaster)
          tickGainMaster.connect(audioContext.destination)
          tickOsc1.frequency.setValueAtTime(2400, audioContext.currentTime + currentTime)
          tickOsc1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + currentTime + 0.03)
          tickOsc2.frequency.setValueAtTime(1800, audioContext.currentTime + currentTime)
          tickOsc2.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + currentTime + 0.03)
          tickFilter.type = "bandpass"
          tickFilter.frequency.setValueAtTime(1200, audioContext.currentTime + currentTime)
          tickFilter.Q.setValueAtTime(8, audioContext.currentTime + currentTime)
          const baseVolume = 0.12 * (1 - (i / totalTicks) * 0.3)
          tickGainMaster.gain.setValueAtTime(baseVolume, audioContext.currentTime + currentTime)
          tickGainMaster.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + currentTime + 0.04)
          tickOsc1.type = "square"
          tickOsc2.type = "square"
          tickOsc1.start(audioContext.currentTime + currentTime)
          tickOsc1.stop(audioContext.currentTime + currentTime + 0.04)
          tickOsc2.start(audioContext.currentTime + currentTime)
          tickOsc2.stop(audioContext.currentTime + currentTime + 0.04)
          tickInterval *= 1.08
          currentTime += tickInterval
          if (currentTime >= duration - 0.4) break
        }

        // ambiance
        const ambBufferSize = audioContext.sampleRate * duration
        const ambianceBuffer = audioContext.createBuffer(1, ambBufferSize, audioContext.sampleRate)
        const ambianceData = ambianceBuffer.getChannelData(0)
        for (let i = 0; i < ambBufferSize; i++) {
          const time = i / audioContext.sampleRate
          const hum1 = Math.sin(2 * Math.PI * 60 * time) * 0.3
          const hum2 = Math.sin(2 * Math.PI * 120 * time) * 0.2
          const hum3 = Math.sin(2 * Math.PI * 180 * time) * 0.1
          const variation = Math.sin(2 * Math.PI * 0.5 * time) * 0.1
          ambianceData[i] = (hum1 + hum2 + hum3 + variation) * 0.4
        }
        const ambianceSource = audioContext.createBufferSource()
        const ambianceGain = audioContext.createGain()
        const ambianceFilter = audioContext.createBiquadFilter()
        ambianceSource.buffer = ambianceBuffer
        ambianceSource.connect(ambianceFilter)
        ambianceFilter.connect(ambianceGain)
        ambianceGain.connect(audioContext.destination)
        ambianceFilter.type = "lowpass"
        ambianceFilter.frequency.setValueAtTime(200, audioContext.currentTime)
        ambianceFilter.Q.setValueAtTime(1, audioContext.currentTime)
        ambianceGain.gain.setValueAtTime(0.03, audioContext.currentTime)
        ambianceGain.gain.setValueAtTime(0.03, audioContext.currentTime + duration * 0.8)
        ambianceGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        ambianceSource.start()
        ambianceSource.stop(audioContext.currentTime + duration)

        // final click
        setTimeout(
          () => {
            const finalClickOsc1 = audioContext.createOscillator()
            const finalClickOsc2 = audioContext.createOscillator()
            const finalClickGain = audioContext.createGain()
            const finalClickFilter = audioContext.createBiquadFilter()
            finalClickOsc1.connect(finalClickGain)
            finalClickOsc2.connect(finalClickGain)
            finalClickGain.connect(finalClickFilter)
            finalClickFilter.connect(audioContext.destination)
            finalClickOsc1.frequency.setValueAtTime(800, audioContext.currentTime)
            finalClickOsc1.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15)
            finalClickOsc2.frequency.setValueAtTime(1200, audioContext.currentTime)
            finalClickOsc2.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15)
            finalClickFilter.type = "lowpass"
            finalClickFilter.frequency.setValueAtTime(1000, audioContext.currentTime)
            finalClickFilter.Q.setValueAtTime(2, audioContext.currentTime)
            finalClickGain.gain.setValueAtTime(0.08, audioContext.currentTime)
            finalClickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)
            finalClickOsc1.type = "triangle"
            finalClickOsc2.type = "triangle"
            finalClickOsc1.start()
            finalClickOsc1.stop(audioContext.currentTime + 0.15)
            finalClickOsc2.start()
            finalClickOsc2.stop(audioContext.currentTime + 0.15)
          },
          (duration - 0.3) * 1000,
        )
      }
      createMechanicalWheelSound()
    } catch (error) {
      console.log("Could not play spin sound:", error)
    }
  }

  const playWinSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playNote = (frequency: number, startTime: number, duration: number, volume = 0.15) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()
        oscillator.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime)
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(3000, audioContext.currentTime + startTime)
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration)
        oscillator.type = "sine"
        oscillator.start(audioContext.currentTime + startTime)
        oscillator.stop(audioContext.currentTime + startTime + duration)
      }
      playNote(523, 0, 0.3, 0.12)
      playNote(659, 0.15, 0.3, 0.12)
      playNote(784, 0.3, 0.3, 0.12)
      playNote(1047, 0.45, 0.5, 0.15)
      playNote(415, 0.45, 0.5, 0.08)
      playNote(622, 0.45, 0.5, 0.08)
      setTimeout(() => {
        const bellOsc = audioContext.createOscillator()
        const bellGain = audioContext.createGain()
        bellOsc.connect(bellGain)
        bellGain.connect(audioContext.destination)
        bellOsc.frequency.setValueAtTime(1568, audioContext.currentTime)
        bellGain.gain.setValueAtTime(0.1, audioContext.currentTime)
        bellGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1)
        bellOsc.type = "sine"
        bellOsc.start()
        bellOsc.stop(audioContext.currentTime + 1)
      }, 600)
    } catch (error) {
      console.log("Could not play win sound:", error)
    }
  }

  const playSpinAgainSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator() as any
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
      playNote(440, 0, 0.15)
      playNote(523, 0.15, 0.15)
      playNote(659, 0.3, 0.2)
    } catch (error) {
      console.log("Could not play spin again sound:", error)
    }
  }

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()
      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(2000, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)
      oscillator.type = "square"
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (error) {
      console.log("Could not play click sound:", error)
    }
  }

  const createConfetti = () => {
    const pieces: ConfettiPiece[] = []
    const colors = ["#DC2626", "#EF4444", "#F87171", "#FFFFFF", "#FCA5A5", "#FECACA"]
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
      const firework: Firework = { id: i, x: Math.random() * 400, y: Math.random() * 200 + 100, particles: [] }
      for (let j = 0; j < 20; j++) {
        const angle = (j / 20) * Math.PI * 2
        const speed = Math.random() * 3 + 2
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.5 ? "#DC2626" : "#FFFFFF",
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

    setConfetti((prev) => {
      const updated = prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          vx: p.vx * 0.99,
          rotation: p.rotation + p.rotationSpeed,
          opacity: p.y > 350 ? Math.max(0, p.opacity - 0.03) : p.opacity,
        }))
        .filter((p) => p.y < 500 && p.opacity > 0)

      updated.forEach((piece) => {
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
      return updated
    })

    setFireworks((prevFireworks) => {
      const updated = prevFireworks
        .map((f) => ({
          ...f,
          particles: f.particles
            .map((pt) => ({ ...pt, x: pt.x + pt.vx, y: pt.y + pt.vy, vy: pt.vy + 0.1, life: pt.life - 1 }))
            .filter((pt) => pt.life > 0),
        }))
        .filter((f) => f.particles.length > 0)

      updated.forEach((f) => {
        f.particles.forEach((pt) => {
          ctx.save()
          ctx.globalAlpha = pt.life / pt.maxLife
          ctx.fillStyle = pt.color
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        })
      })
      return updated
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

    // Shadow disc
    ctx.save()
    ctx.shadowColor = "rgba(220, 38, 38, 0.3)"
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 10
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.restore()

    // Segments (alternating red/white)
    displaySegments.forEach((segment, index) => {
      const startAngle = (index * segmentAngle - 90) * (Math.PI / 180)
      const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180)

      const isRedSegment = index % 2 === 0

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      if (isRedSegment) {
        gradient.addColorStop(0, "#EF4444")
        gradient.addColorStop(0.7, "#DC2626")
        gradient.addColorStop(1, "#B91C1C")
      } else {
        gradient.addColorStop(0, "#FFFFFF")
        gradient.addColorStop(0.7, "#F9FAFB")
        gradient.addColorStop(1, "#F3F4F6")
      }

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.strokeStyle = "#DC2626"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Label with text wrapping
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + (endAngle - startAngle) / 2)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = isRedSegment ? "#FFFFFF" : "#DC2626"
      
      const isSpinAgain = segment.name === "3awed !"
      const fontSize = isSpinAgain ? 16 : segment.name.length > 15 ? 11 : 14
      ctx.font = `${isSpinAgain ? "bold" : "500"} ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`
      
      // Calculate text wrapping
      const maxWidth = radius * 0.6 // Maximum width for text
      const words = segment.name.split(' ')
      const lines: string[] = []
      let currentLine = ''
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + ' ' + words[i] : words[i]
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine)
          currentLine = words[i]
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) {
        lines.push(currentLine)
      }
      
      // If text is still too long, break it by characters
      if (lines.length === 1 && ctx.measureText(lines[0]).width > maxWidth) {
        const text = lines[0]
        lines.length = 0
        let currentLine = ''
        
        for (let i = 0; i < text.length; i++) {
          const testLine = currentLine + text[i]
          const metrics = ctx.measureText(testLine)
          
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine)
            currentLine = text[i]
          } else {
            currentLine = testLine
          }
        }
        if (currentLine) {
          lines.push(currentLine)
        }
      }
      
      // Draw wrapped text
      const lineHeight = fontSize * 1.2
      const totalHeight = lines.length * lineHeight
      const startY = -(totalHeight / 2) + (lineHeight / 2)
      
      const textRadius = segment.name.length > 15 ? radius * 0.65 : radius * 0.75
      
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight)
        ctx.fillText(line, textRadius, y)
      })
      
      ctx.restore()
    })

    // Center hub
    const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35)
    hubGradient.addColorStop(0, "#FFFFFF")
    hubGradient.addColorStop(0.7, "#F9FAFB")
    hubGradient.addColorStop(1, "#DC2626")
    ctx.beginPath()
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI)
    ctx.fillStyle = hubGradient
    ctx.fill()
    ctx.strokeStyle = "#DC2626"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = "#DC2626"
    ctx.font = "bold 10px 'Inter', system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("MEDIA 7", centerX, centerY - 4)
    ctx.fillText("STORE", centerX, centerY + 8)
  }

  const spinWheel = async () => {
    if (isSpinning || displaySegments.length === 0) return
    playClickSound()
    setIsSpinning(true)
    setShowCelebration(false)
    setShowSpinAgain(false)
    setScreenShake(false)
    playSpinSound()

    const minSpins = 5
    const maxSpins = 10
    const spins = Math.random() * (maxSpins - minSpins) + minSpins
    const finalAngle = Math.random() * 360
    const totalRotation = rotation + spins * 360 + finalAngle
    setRotation(totalRotation)

    const normalizedAngle = (360 - (totalRotation % 360)) % 360
    const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % displaySegments.length
    const selectedSegment = displaySegments[segmentIndex]
    setWonPrize(selectedSegment.name)

    setTimeout(async () => {
      const isSpinAgain = selectedSegment.name === "3awed !"
      if (isSpinAgain) {
        playSpinAgainSound()
        setShowSpinAgain(true)
        setSpinAgainMessage("🎯 Essayez encore !")
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 600)
        setIsSpinning(false)
      } else {
        playWinSound()
        setShowCelebration(true)
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 1000)
        setTimeout(() => setShowCelebration(false), 5000)
        try {
          const response = await fetch("/api/record-win", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, prizeId: selectedSegment.id }),
          })
          if (response.ok) {
            await fetchPlayCount() // Refresh play count from database
            onWin(selectedSegment)
          } else {
            const errorData = await response.json()
            console.error("Error recording win:", errorData.error)
            if (errorData.error?.includes("non disponible")) {
              alert("Désolé, ce prix n'est plus disponible. Veuillez réessayer.")
            }
          }
        } catch (error) {
          console.error("Error recording win:", error)
        } finally {
          setIsSpinning(false)
        }
      }
    }, 4000)
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
            <span className="text-red-600 font-medium">Tirages gagnés: {playCount}</span>
            <Star className="w-4 h-4 text-red-600" />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-8 p-8">
          <Card className="w-full max-w-lg mx-auto bg-white border border-red-200 shadow-xl">
            <CardContent className="p-6">
              <div className="relative w-96 h-96 mx-auto mb-6">
                <canvas
                  ref={celebrationRef}
                  width={400}
                  height={400}
                  className="absolute inset-0 pointer-events-none z-30"
                  style={{ left: "-2px", top: "-2px" }}
                />

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

                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-15">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600 drop-shadow-sm"></div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <Button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className={`w-20 h-20 rounded-full font-semibold text-base shadow-lg transition-all duration-300 ${
                      isSpinning
                        ? "bg-gray-400 text-white cursor-not-allowed scale-95"
                        : (showCelebration || showSpinAgain)
                          ? "bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95 animate-pulse"
                          : "bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95"
                    }`}
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
                    <>🎉 Félicitations! Vous êtes inscrit au tirage pour: {wonPrize}! 🎉</>
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
