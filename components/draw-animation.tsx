import React, { useEffect, useRef, useState } from 'react'
import { Crown, Sparkles, Trophy } from 'lucide-react'

interface DrawAnimationProps {
  isOpen: boolean
  onComplete: () => void
  winnerName: string
}

export function DrawAnimation({ isOpen, onComplete, winnerName }: DrawAnimationProps) {
  const [showWinner, setShowWinner] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Play the cheers audio file
  const playVictorySound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.7
        audioRef.current.play().catch(console.error)
      }
    } catch (error) {
      console.log('Audio not supported or blocked by browser')
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Animation sequence
      const timer1 = setTimeout(() => setShowSparkles(true), 500)
      const timer2 = setTimeout(() => {
        setShowWinner(true)
        playVictorySound() // Play victory sound when winner is revealed
      }, 1500)
      const timer3 = setTimeout(() => {
        onComplete()
        setShowWinner(false)
        setShowSparkles(false)
      }, 6000) // Extended to 6 seconds to allow audio to play completely

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isOpen, onComplete])

  if (!isOpen) return null

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/cheers.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 px-8 py-12 text-white relative overflow-hidden">
            <button
              onClick={onComplete}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative z-10 text-center">
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 animate-bounce">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">🎉 Tirage au Sort!</h2>
              <p className="text-white/90 text-lg">Sélection du gagnant final...</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Sparkles animation */}
            {showSparkles && (
              <div className="flex justify-center space-x-2 mb-6">
                {[...Array(8)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="w-8 h-8 text-yellow-500 animate-pulse"
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Winner announcement */}
            {showWinner && (
              <div className="text-center space-y-6 animate-in fade-in-0 duration-500">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                  <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-900 mb-3">🎊 Félicitations!</h3>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-800 animate-pulse">
                      {winnerName}
                    </p>
                    <p className="text-green-700 font-medium">est le nouveau gagnant final!</p>
                  </div>
                </div>
                
                {/* Confetti effect */}
                <div className="flex justify-center space-x-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                      style={{ 
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Loading animation when not showing winner yet */}
            {!showWinner && (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-orange-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-gray-700 text-xl font-semibold">Tirage en cours...</p>
                <p className="text-gray-500">Veuillez patienter</p>
              </div>
            )}

            {/* Action button */}
            {showWinner && (
              <button
                onClick={onComplete}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Parfait! 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 