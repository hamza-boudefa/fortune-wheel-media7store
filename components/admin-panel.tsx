"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Trophy,
  Users,
  Gift,
  Crown,
  Phone,
  User,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Zap,
  Star,
  X,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Package,
  BarChart3,
  RefreshCwIcon as Refresh,
} from "lucide-react"
import type { Prize, Winner, AdminStats } from "@/lib/db"
import { DrawAnimation } from "./draw-animation"

interface DisplayWinner extends Winner {
  first_name?: string
  last_name?: string
  phone?: string
  name?: string
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white relative overflow-hidden">
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
            <p className="text-green-100">Un nouveau gagnant final a été sélectionné</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Nouveau Gagnant Final</h3>
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

interface PrizeFormData {
  name: string
  probability: number
  quantity: number
  is_active: boolean
}

function PrizeDialog({
  isOpen,
  onClose,
  onSave,
  prize,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PrizeFormData) => void
  prize?: Prize | null
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<PrizeFormData>({
    name: "",
    probability: 10,
    quantity: 1,
    is_active: true,
  })

  useEffect(() => {
    if (prize) {
      console.log("PrizeDialog: Loading prize data:", prize)
      setFormData({
        name: prize.name,
        probability: prize.probability,
        quantity: prize.quantity,
        is_active: prize.is_active,
      })
    } else {
      console.log("PrizeDialog: Resetting to defaults")
      setFormData({
        name: "",
        probability: 10,
        quantity: 1,
        is_active: true,
      })
    }
  }, [prize, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("PrizeDialog: Submitting form data:", formData)
    onSave(formData)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = value === "" ? 0 : Number(value)
    console.log("PrizeDialog: Quantity changed to:", value, "->", numValue)
    setFormData({ ...formData, quantity: numValue })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {prize ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {prize ? "Modifier le Prix" : "Nouveau Prix"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilité (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleQuantityChange}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Actif</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminPanel() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [winners, setWinners] = useState<DisplayWinner[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalPrizes: 0,
    totalParticipants: 0,
    totalWinners: 0,
    finalWinners: 0,
    pendingWinners: 0,
    totalQuantity: 0,
  })
  const [loading, setLoading] = useState(false)
  const [prizesLoading, setPrizesLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [drawingWinner, setDrawingWinner] = useState(false)
  const [prizeDialogOpen, setPrizeDialogOpen] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [savingPrize, setSavingPrize] = useState(false)

  const [winnerPopup, setWinnerPopup] = useState<{ isOpen: boolean; winner: DisplayWinner | null }>({
    isOpen: false,
    winner: null,
  })
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  })
  const [drawAnimation, setDrawAnimation] = useState<{ isOpen: boolean; winnerName: string }>({
    isOpen: false,
    winnerName: "",
  })

  const winnersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPrizes()
    fetchStats()
  }, [])

  const fetchPrizes = async () => {
    console.log("AdminPanel: Fetching prizes...")
    setPrizesLoading(true)
    try {
      const response = await fetch(`/api/admin/prizes?ts=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      const data = await response.json()
      console.log("AdminPanel: Prizes response:", data)
      setPrizes(data.prizes || [])
    } catch (error) {
      console.error("AdminPanel: Error fetching prizes:", error)
      setPrizes([])
    } finally {
      setPrizesLoading(false)
    }
  }

  const fetchStats = async () => {
    console.log("AdminPanel: Fetching stats...")
    setStatsLoading(true)
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      if (data.success) setStats(data.stats)
    } catch (error) {
      console.error("AdminPanel: Error fetching stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchWinners = async (prizeId: number) => {
    setLoading(true)
    setWinners([])
    try {
      const response = await fetch(`/api/winners/${prizeId}`)
      const data = await response.json()
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
    setTimeout(() => {
      winnersRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" })
    }, 100)
  }

  const showError = (message: string) => setErrorPopup({ isOpen: true, message })
  const showWinnerPopup = (winner: DisplayWinner) => setWinnerPopup({ isOpen: true, winner })

  const drawWinner = async (prizeId: number) => {
    if (winners.length === 0) return showError("Aucun gagnant disponible pour le tirage.")
    
    // Check if we can still draw more final winners
    const finalWinnersCount = winners.filter((w) => w.is_final_winner).length
    const prize = prizes.find((p) => p.id === prizeId)
    
    if (!prize) {
      return showError("Prix non trouvé.")
    }
    
    if (finalWinnersCount >= prize.quantity) {
      return showError(
        `Le nombre maximum de gagnants finaux (${prize.quantity}) a déjà été atteint pour ce prix.`
      )
    }
    
    const eligibleWinners = winners.filter((w) => !w.is_final_winner)
    if (eligibleWinners.length === 0) return showError("Aucun participant éligible pour le tirage.")

    setDrawingWinner(true)
    try {
      // Start the draw animation
      const selectedWinner = eligibleWinners[Math.floor(Math.random() * eligibleWinners.length)]
      if (!selectedWinner?.id) return showError("Erreur : Aucun gagnant valide sélectionné.")

      const winnerName = `${selectedWinner.first_name} ${selectedWinner.last_name}`
      setDrawAnimation({ isOpen: true, winnerName })

      // Wait for animation to complete before making the API call
      await new Promise((r) => setTimeout(r, 2000))

      const response = await fetch("/api/draw-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selectedWinner.id }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Échec du tirage au sort final")
      }
      
      await fetchWinners(prizeId)
      await fetchStats()
    } catch (error: any) {
      console.error("Error drawing winner:", error)
      showError(`Erreur lors du tirage : ${error.message || "Une erreur inconnue s'est produite"}`)
      setDrawAnimation({ isOpen: false, winnerName: "" })
    } finally {
      setDrawingWinner(false)
    }
  }

  const handleSavePrize = async (formData: PrizeFormData) => {
    console.log("AdminPanel: Saving prize with data:", formData)
    setSavingPrize(true)
    try {
      const url = editingPrize ? `/api/prizes/${editingPrize.id}` : "/api/prizes"
      const method = editingPrize ? "PUT" : "POST"

      // Ensure all fields are properly typed
      const payload = {
        name: String(formData.name).trim(),
        probability: Number(formData.probability),
        quantity: Number(formData.quantity), // Explicitly convert to number
        is_active: Boolean(formData.is_active),
      }

      console.log("AdminPanel: Sending payload:", payload)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()
      console.log("AdminPanel: Save response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Erreur lors de la sauvegarde")
      }

      // Play success sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()

        oscillator.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Create a pleasant success chime
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1500, audioContext.currentTime)

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.log('Audio not supported or blocked by browser')
      }

      console.log("AdminPanel: Prize saved successfully, refreshing data...")
      await fetchPrizes()
      await fetchStats()
      
      // If we're editing the currently selected prize, refresh winners to update the count
      if (editingPrize && selectedPrize?.id === editingPrize.id) {
        await fetchWinners(editingPrize.id)
      }
      
      setPrizeDialogOpen(false)
      setEditingPrize(null)
    } catch (error: any) {
      console.error("AdminPanel: Error saving prize:", error)
      showError(error.message || "Erreur lors de la sauvegarde du prix")
    } finally {
      setSavingPrize(false)
    }
  }

  const handleDeletePrize = async (prize: Prize) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${prize.name}" ?`)) return
    try {
      const response = await fetch(`/api/prizes/${prize.id}`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      await fetchPrizes()
      await fetchStats()
      if (selectedPrize?.id === prize.id) {
        setSelectedPrize(null)
        setWinners([])
      }
    } catch (error: any) {
      console.error("Error deleting prize:", error)
      showError(error.message || "Erreur lors de la suppression du prix")
    }
  }

  const handleEditPrize = (prize: Prize) => {
    console.log("AdminPanel: Editing prize:", prize)
    setEditingPrize(prize)
    setPrizeDialogOpen(true)
  }
  const handleNewPrize = () => {
    console.log("AdminPanel: Creating new prize")
    setEditingPrize(null)
    setPrizeDialogOpen(true)
  }

  const handleSeedPrizes = async () => {
    if (!confirm("Êtes-vous sûr de vouloir initialiser les prix par défaut ? Cela ne fonctionnera que si aucun prix n'existe déjà.")) return
    
    try {
      const response = await fetch("/api/seed-prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showError("Prix initialisés avec succès !")
        await fetchPrizes()
        await fetchStats()
      } else {
        showError(data.error || "Erreur lors de l'initialisation des prix")
      }
    } catch (error: any) {
      console.error("Error seeding prizes:", error)
      showError("Erreur lors de l'initialisation des prix")
    }
  }

  const totalWinners = winners.length
  const finalWinners = winners.filter((w) => w.is_final_winner).length
  const pendingWinners = totalWinners - finalWinners
  const hasFinalWinner = finalWinners > 0
  const canDrawMore = selectedPrize ? finalWinners < selectedPrize.quantity : false
  const remainingDraws = selectedPrize ? selectedPrize.quantity - finalWinners : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-7xl mx-auto space-y-8">
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
                <Button
                  onClick={fetchStats}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={statsLoading}
                >
                  <Refresh className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </div>
{/* make it responsive */}
        <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Prix</p>
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.totalPrizes}</p>
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
                  <p className="text-gray-600 text-sm font-medium">Quantité Total</p>
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.totalQuantity}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Participants</p>
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.totalParticipants}</p>
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
                  <p className="text-gray-600 text-sm font-medium">Total Gains</p>
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.totalWinners}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Gagnants Finaux</p>
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.finalWinners}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{statsLoading ? "..." : stats.pendingWinners}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Gift className="w-6 h-6 text-red-600" />
                </div>
                Gestion des Prix
              </CardTitle>
              <div className="flex gap-2">
                {/* <Button onClick={handleSeedPrizes} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                  <Package className="w-4 h-4 mr-2" />
                  Initialiser les Prix
                </Button> */}
                <Button onClick={handleNewPrize} className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Prix
                </Button>
              </div>
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
                  const prizeFinalWinners = selectedPrize?.id === prize.id ? winners.filter((w) => w.is_final_winner).length : 0
                  const prizeHasFinalWinner = prizeFinalWinners > 0
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
                      {prizeHasFinalWinner && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="bg-green-600 text-white rounded-full p-2 shadow-lg animate-pulse">
                            <div className="flex items-center justify-center">
                              <Crown className="w-3 h-3 mr-1" />
                              <span className="text-xs font-bold">{prizeFinalWinners}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl shadow-sm border-2 border-white flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700">
                              <Star className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition-colors">
                              {prize.name}
                            </h3>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {prize.probability}%
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  prize.quantity > 0
                                    ? "border-green-400 text-green-700 bg-green-50"
                                    : "border-red-400 text-red-700 bg-red-50"
                                }
                              >
                                <Package className="w-3 h-3 mr-1" />
                                {prize.quantity}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              {selectedPrize?.id === prize.id && (
                                <div className="flex items-center text-red-600">
                                  <Zap className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">Sélectionné</span>
                                </div>
                              )}
                              <div className="flex gap-1 ml-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditPrize(prize)
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePrize(prize)
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {prizeHasFinalWinner && (
                              <div className="mt-2">
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  {prizeFinalWinners} gagnant{prizeFinalWinners > 1 ? 's' : ''} final{prizeFinalWinners > 1 ? 'aux' : ''}
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

        {selectedPrize && (
          <Card ref={winnersRef} className="bg-white border-0 shadow-sm scroll-mt-6">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    Participants - {selectedPrize.name}
                  </CardTitle>
                  <p className="text-gray-600">
                    {finalWinners === 0
                      ? "Gérez les gagnants et effectuez le tirage final"
                      : finalWinners >= (selectedPrize?.quantity || 0)
                      ? `Tous les ${selectedPrize?.quantity} gagnants finaux ont été désignés`
                      : `${finalWinners} gagnant${finalWinners > 1 ? 's' : ''} final${finalWinners > 1 ? 'aux' : ''} désigné${finalWinners > 1 ? 's' : ''} - ${remainingDraws} tirage${remainingDraws > 1 ? 's' : ''} restant${remainingDraws > 1 ? 's' : ''}`}
                  </p>
                </div>
                <Button
                  onClick={() => drawWinner(selectedPrize.id)}
                  disabled={winners.length === 0 || loading || !canDrawMore || drawingWinner}
                  className={`font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    !canDrawMore
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  }`}
                >
                  {drawingWinner ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Animation en cours...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      {!canDrawMore 
                        ? `Tous les ${selectedPrize?.quantity} gagnants désignés` 
                        : `Tirage Final (${remainingDraws} restant${remainingDraws > 1 ? 's' : ''})`}
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
                  <p className="text-gray-600 text-base">
                    Les participants apparaîtront ici après avoir joué à la roue
                  </p>
                </div>
              ) : (
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
                            winner.is_final_winner ? "bg-green-50/50 ring-2 ring-green-200" : ""
                          }`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  winner.is_final_winner ? "bg-green-600 ring-4 ring-green-200" : "bg-gray-400"
                                }`}
                              >
                                {winner.is_final_winner ? <Crown className="w-5 h-5" /> : index + 1}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${winner.is_final_winner ? "text-green-900" : "text-gray-900"}`}
                                >
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
                              <div
                                className={
                                  winner.is_final_winner ? "p-2 rounded-lg bg-green-100" : "p-2 rounded-lg bg-gray-100"
                                }
                              >
                                <Phone
                                  className={
                                    winner.is_final_winner ? "w-4 h-4 text-green-600" : "w-4 h-4 text-gray-600"
                                  }
                                />
                              </div>
                              <span
                                className={
                                  winner.is_final_winner
                                    ? "font-mono text-green-800 font-semibold"
                                    : "font-mono text-gray-700"
                                }
                              >
                                {winner.phone || "Non disponible"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className={winner.is_final_winner ? "text-green-800" : "text-gray-700"}>
                              {new Date(winner.won_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                              <div
                                className={winner.is_final_winner ? "text-xs text-green-600" : "text-xs text-gray-500"}
                              >
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
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <PrizeDialog
        isOpen={prizeDialogOpen}
        onClose={() => {
          setPrizeDialogOpen(false)
          setEditingPrize(null)
        }}
        onSave={handleSavePrize}
        prize={editingPrize}
        isLoading={savingPrize}
      />

      <WinnerPopup
        isOpen={winnerPopup.isOpen}
        winner={winnerPopup.winner}
        onClose={() => setWinnerPopup({ isOpen: false, winner: null })}
      />
              <ErrorPopup
          isOpen={errorPopup.isOpen}
          message={errorPopup.message}
          onClose={() => setErrorPopup({ isOpen: false, message: "" })}
        />
        <DrawAnimation
          isOpen={drawAnimation.isOpen}
          winnerName={drawAnimation.winnerName}
          onComplete={() => setDrawAnimation({ isOpen: false, winnerName: "" })}
        />
      </div>
    )
}
