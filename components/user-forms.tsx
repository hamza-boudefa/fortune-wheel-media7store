"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, UserPlus, LogIn, ArrowRight, ArrowLeft } from "lucide-react"

interface UserFormsProps {
  onUserReady: (userId: number) => void
}

export default function UserForms({ onUserReady }: UserFormsProps) {
  const [formType, setFormType] = useState<"selection" | "new" | "returning">("selection")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNewUserSubmit = async (formData: FormData) => {
    setLoading(true)
    setError("")

    const phone = formData.get("phone") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string

    // Client-side validation
    if (!phone || !firstName || !lastName) {
      setError("Tous les champs sont requis")
      setLoading(false)
      return
    }

    // Validate phone number format (8 digits for Tunisia)
    const phoneRegex = /^\d{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setError("Le numéro de téléphone doit contenir 8 chiffres")
      setLoading(false)
      return
    }

    try {
      console.log("Submitting user data:", {
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Erreur lors de la création du compte"
        try {
          const errorData = await response.json()
          console.log("Error response:", errorData)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Erreur serveur: ${response.status}`
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("Success response:", data)

      if (data.success && data.user) {
        console.log("User created successfully, calling onUserReady with ID:", data.user.id)
        onUserReady(data.user.id)
      } else {
        setError(data.error || "Erreur lors de la création du compte")
      }
    } catch (err) {
      console.error("Network error:", err)
      setError("Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleReturningUser = async (phone: string) => {
    setLoading(true)
    setError("")

    // Validate phone number format
    const phoneRegex = /^\d{8}$/
    if (!phoneRegex.test(phone.trim())) {
      setError("Le numéro de téléphone doit contenir 8 chiffres")
      setLoading(false)
      return
    }

    try {
      console.log("Checking user with phone:", phone.trim())

      const response = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Erreur lors de la vérification du numéro"
        try {
          const errorData = await response.json()
          console.log("Error response:", errorData)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Erreur serveur: ${response.status}`
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("Check user response:", data)

      if (data.exists && data.user) {
        console.log("User found, calling onUserReady with ID:", data.user.id)
        onUserReady(data.user.id)
      } else {
        setError("Numéro de téléphone non trouvé. Veuillez vous inscrire comme nouvel utilisateur.")
      }
    } catch (err) {
      console.error("Network error:", err)
      setError("Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.")
    } finally {
      setLoading(false)
    }
  }

  // Selection screen with simple elegant design
  if (formType === "selection") {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-white to-red-50 border-b border-red-100">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-600 mb-2">Roue de la Fortune</CardTitle>
            <p className="text-red-700 text-base font-medium">Gagnez des prix incroyables</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Button
                onClick={() => setFormType("new")}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 group"
              >
                <UserPlus className="w-5 h-5 mr-3" />
                Nouvel utilisateur
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                onClick={() => setFormType("returning")}
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50 font-medium py-4 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 group"
              >
                <LogIn className="w-5 h-5 mr-3" />
                Utilisateur existant
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // New user registration form
  if (formType === "new") {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-white to-red-50 border-b border-red-100">
            <div className="flex justify-center mb-3">
              <UserPlus className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600 mb-1">Inscription</CardTitle>
            <p className="text-red-700 text-sm">Rejoignez-nous et gagnez des prix</p>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleNewUserSubmit(formData)
              }}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-red-800 font-medium">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    placeholder="Ahmed"
                    className="bg-white border-red-200 text-red-900 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400 h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-red-800 font-medium">
                    Nom de famille
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    placeholder="Ben Ali"
                    className="bg-white border-red-200 text-red-900 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400 h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-red-800 font-medium">
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="20123456"
                    className="bg-white border-red-200 text-red-900 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400 h-11 rounded-lg"
                    maxLength={8}
                  />
                  <p className="text-red-600 text-xs">8 chiffres sans indicatif pays</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-center text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => setFormType("selection")}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-11 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium h-11 rounded-lg shadow-md"
                  >
                    {loading ? "Inscription..." : "S'inscrire"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Returning user form
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-white to-red-50 border-b border-red-100">
          <div className="flex justify-center mb-3">
            <LogIn className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 mb-1">Connexion</CardTitle>
          <p className="text-red-700 text-sm">Entrez votre numéro pour jouer</p>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleReturningUser(formData.get("phone") as string)
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-red-800 font-medium">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="20123456"
                  className="bg-white border-red-200 text-red-900 placeholder:text-red-400 focus:border-red-400 focus:ring-red-400 h-11 rounded-lg"
                  maxLength={8}
                />
                <p className="text-red-600 text-xs">8 chiffres sans indicatif pays</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-center text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setFormType("selection")}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-11 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium h-11 rounded-lg shadow-md"
                >
                  {loading ? "Vérification..." : "Se connecter"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
