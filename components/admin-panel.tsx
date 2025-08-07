"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Gift, Crown, Phone, User, Calendar, Award, Target, TrendingUp, Zap, Star, X, Sparkles } from 'lucide-react'
import type { Prize, Winner } from "@/lib/db"

interface DisplayWinner extends Winner {
  first_name?: string
  last_name?: string
  phone?: string
  name_ar?: string
  name_en?: string
}

interface WinnerPopupProps {
  isOpen: boolean
  winner: DisplayWinner | null
  onClose: () => void
}

function WinnerPopup({ isOpen, winner, onClose }: WinnerPopupProps) {
  if (!isOpen || !winner) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-8 right-6 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10 text-center">
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">🎉 Félicitations!</h2>
            <p className="text-green-100">Le gagnant final a été sélectionné</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Winner Info */}
          <div className="text-center space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Gagnant Final</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-800">
                  {winner.first_name} {winner.last_name}
                </p>
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Phone className="w-4 h-4" />
                  <span className="font-mono">{winner.phone}</span>
                </div>
              </div>
            </div>

            {/* Celebration Elements */}
            <div className="flex justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="w-6 h-6 text-yellow-500 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Parfait!
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ErrorPopupProps {
  isOpen: boolean
  message: string
  onClose: () => void
}

function ErrorPopup({ isOpen, message, onClose }: ErrorPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Information</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center leading-relaxed">{message}</p>
          <Button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl"
          >
            Compris
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [winners, setWinners] = useState<DisplayWinner[]>([])
  const [loading, setLoading] = useState(false)
  const [prizesLoading, setPrizesLoading] = useState(true)
  const [drawingWinner, setDrawingWinner] = useState(false)
  
  // Popup states
  const [winnerPopup, setWinnerPopup] = useState<{ isOpen: boolean; winner: DisplayWinner | null }>({
    isOpen: false,
    winner: null
  })
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ""
  })
  
  // Ref for scrolling to winners section
  const winnersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPrizes()
  }, [])

  const fetchPrizes = async () => {
    setPrizesLoading(true)
    try {
      const response = await fetch("/api/prizes")
      const data = await response.json()
      setPrizes(data.prizes || [])
    } catch (error) {
      console.error("Error fetching prizes:", error)
      setPrizes([])
    } finally {
      setPrizesLoading(false)
    }
  }

  const fetchWinners = async (prizeId: number) => {
    setLoading(true)
    setWinners([])
    try {
      const response = await fetch(`/api/winners/${prizeId}`)
      const data = await response.json()
      console.log("Winners data received:", data.winners)
      setWinners(data.winners || [])
    } catch (error) {
      console.error("Error fetching winners:", error)
      setWinners([])
    } finally {
      setLoading(false)
    }
  }

  const handlePrizeSelect = async (prize: Prize) => {
    setSelectedPrize(prize)
    await fetchWinners(prize.id)
    
    // Smooth scroll to winners section with better timing
    setTimeout(() => {
      winnersRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }, 100)
  }

  const showError = (message: string) => {
    setErrorPopup({ isOpen: true, message })
  }

  const showWinnerPopup = (winner: DisplayWinner) => {
    setWinnerPopup({ isOpen: true, winner })
  }

  const drawWinner = async (prizeId: number) => {
    if (winners.length === 0) {
      showError("Aucun gagnant disponible pour le tirage.")
      return
    }

    // Check if there's already a final winner for this prize
    const existingFinalWinner = winners.find(w => w.is_final_winner)
    if (existingFinalWinner) {
      showError(`Il y a déjà un gagnant final pour ce prix :\n${existingFinalWinner.first_name} ${existingFinalWinner.last_name}\nTéléphone : ${existingFinalWinner.phone}`)
      return
    }

    const eligibleWinners = winners.filter((w) => !w.is_final_winner)
    if (eligibleWinners.length === 0) {
      showError("Aucun participant éligible pour le tirage.")
      return
    }

    setDrawingWinner(true)

    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      const randomIndex = Math.floor(Math.random() * eligibleWinners.length)
      const selectedWinner = eligibleWinners[randomIndex]

      if (!selectedWinner || !selectedWinner.id) {
        showError("Erreur : Aucun gagnant valide sélectionné.")
        return
      }

      const response = await fetch("/api/draw-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selectedWinner.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec du tirage au sort final")
      }

      // Show winner popup instead of alert
      showWinnerPopup(selectedWinner)
      
      // Refresh winners list
      await fetchWinners(prizeId)
    } catch (error: any) {
      console.error("Error drawing winner:", error)
      showError(`Erreur lors du tirage : ${error.message || "Une erreur inconnue s'est produite"}`)
    } finally {
      setDrawingWinner(false)
    }
  }

  // Calculate statistics
  const totalWinners = winners.length
  const finalWinners = winners.filter(w => w.is_final_winner).length
  const pendingWinners = totalWinners - finalWinners
  const hasFinalWinner = finalWinners > 0

  return (
    <div
      className="min-h-screen bg-gray-50 p-6"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <img src="/media7-logo.png" alt="Media 7 Store" className="h-12 w-auto" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Centre de Contrôle</h1>
                  <p className="text-red-100 text-lg">Administration Media 7 Store - Gestion des Concours</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-white text-sm font-medium">Statut</div>
                  <div className="text-white text-lg font-bold">En Ligne</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Prix</p>
                  <p className="text-3xl font-bold text-gray-900">{prizes.length}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Participants</p>
                  <p className="text-3xl font-bold text-gray-900">{totalWinners}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Gagnants Finaux</p>
                  <p className="text-3xl font-bold text-gray-900">{finalWinners}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">En Attente</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingWinners}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prizes Section */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
                Catalogue des Prix
              </CardTitle>
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                {prizes.length} prix disponibles
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {prizesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-white border-2 border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prizes.map((prize) => {
                  // Check if this prize has a final winner
                  const prizeHasFinalWinner = selectedPrize?.id === prize.id && hasFinalWinner
                  
                  return (
                    <Card
                      key={prize.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 group relative ${
                        selectedPrize?.id === prize.id
                          ? "ring-4 ring-red-200 bg-red-50 border-red-300 shadow-lg"
                          : "bg-white hover:bg-gray-50 border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md"
                      }`}
                      onClick={() => handlePrizeSelect(prize)}
                    >
                      {/* Final Winner Indicator */}
                      {prizeHasFinalWinner && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-green-600 text-white rounded-full p-2 shadow-lg animate-pulse">
                            <Crown className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className="w-12 h-12 rounded-xl shadow-sm border-2 border-white flex items-center justify-center"
                              style={{ backgroundColor: prize.color }}
                            >
                              <Star className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition-colors">
                              {prize.name_en}
                            </h3>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant="secondary" 
                                className="bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {prize.probability}%
                              </Badge>
                              {selectedPrize?.id === prize.id && (
                                <div className="flex items-center text-red-600">
                                  <Zap className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">Sélectionné</span>
                                </div>
                              )}
                            </div>
                            {prizeHasFinalWinner && (
                              <div className="mt-2">
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Gagnant désigné
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Winners Section */}
        {selectedPrize && (
          <Card ref={winnersRef} className="bg-white border-0 shadow-sm scroll-mt-6">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    Participants - {selectedPrize.name_en}
                  </CardTitle>
                  <p className="text-gray-600">
                    {hasFinalWinner 
                      ? "Le gagnant final a été désigné pour ce prix" 
                      : "Gérez les gagnants et effectuez le tirage final"
                    }
                  </p>
                </div>
                <Button
                  onClick={() => drawWinner(selectedPrize.id)}
                  disabled={winners.length === 0 || loading || hasFinalWinner || drawingWinner}
                  className={`font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    hasFinalWinner 
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  }`}
                >
                  {drawingWinner ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Tirage en cours...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      {hasFinalWinner ? "Gagnant Désigné" : "Tirage Final"}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-xl font-semibold">Chargement des données...</p>
                  <p className="text-gray-500 text-sm mt-2">Veuillez patienter</p>
                </div>
              ) : winners.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun participant</h3>
                  <p className="text-gray-600 text-base">Les participants apparaîtront ici après avoir joué à la roue</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total</p>
                          <p className="text-2xl font-bold text-blue-900">{totalWinners}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Gagnant Final</p>
                          <p className="text-2xl font-bold text-green-900">{finalWinners}</p>
                        </div>
                        <Crown className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">En Attente</p>
                          <p className="text-2xl font-bold text-yellow-900">{pendingWinners}</p>
                        </div>
                        <Target className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  {/* Winners Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-gray-200">
                          <TableHead className="text-gray-900 font-semibold py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Participant
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-900 font-semibold py-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Contact
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-900 font-semibold py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-900 font-semibold py-4">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Statut
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {winners.map((winner, index) => (
                          <TableRow 
                            key={winner.id} 
                            className={`border-gray-100 hover:bg-gray-50 transition-colors ${
                              winner.is_final_winner ? 'bg-green-50/50 ring-2 ring-green-200' : ''
                            }`}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  winner.is_final_winner ? 'bg-green-600 ring-4 ring-green-200' : 'bg-gray-400'
                                }`}>
                                  {winner.is_final_winner ? <Crown className="w-5 h-5" /> : index + 1}
                                </div>
                                <div>
                                  <p className={`font-semibold ${winner.is_final_winner ? 'text-green-900' : 'text-gray-900'}`}>
                                    {winner.first_name && winner.last_name
                                      ? `${winner.first_name} ${winner.last_name}`
                                      : "Nom non disponible"}
                                  </p>
                                  {winner.is_final_winner && (
                                    <p className="text-xs text-green-600 font-medium">🎉 Gagnant Final</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${winner.is_final_winner ? 'bg-green-100' : 'bg-gray-100'}`}>
                                  <Phone className={`w-4 h-4 ${winner.is_final_winner ? 'text-green-600' : 'text-gray-600'}`} />
                                </div>
                                <span className={`font-mono ${winner.is_final_winner ? 'text-green-800 font-semibold' : 'text-gray-700'}`}>
                                  {winner.phone || "Non disponible"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className={winner.is_final_winner ? 'text-green-800' : 'text-gray-700'}>
                                {new Date(winner.won_at).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                                <div className={`text-xs ${winner.is_final_winner ? 'text-green-600' : 'text-gray-500'}`}>
                                  {new Date(winner.won_at).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              {winner.is_final_winner ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg">
                                  <Crown className="w-4 h-4 mr-2" />
                                  Gagnant Final
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="border-yellow-400 text-yellow-700 bg-yellow-50 font-semibold px-3 py-1 rounded-full"
                                >
                                  <Target className="w-3 h-3 mr-1" />
                                  En Attente
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Winner Popup */}
      <WinnerPopup
        isOpen={winnerPopup.isOpen}
        winner={winnerPopup.winner}
        onClose={() => setWinnerPopup({ isOpen: false, winner: null })}
      />

      {/* Error Popup */}
      <ErrorPopup
        isOpen={errorPopup.isOpen}
        message={errorPopup.message}
        onClose={() => setErrorPopup({ isOpen: false, message: "" })}
      />
    </div>
  )
}
