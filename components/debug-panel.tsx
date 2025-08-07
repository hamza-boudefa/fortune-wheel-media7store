"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPanel() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async (endpoint: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      setResults({ endpoint, status: response.status, data })
    } catch (error) {
      setResults({ endpoint, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => runTest("/api/debug")} disabled={loading}>
              Test Environment
            </Button>
            <Button onClick={() => runTest("/api/test-db")} disabled={loading}>
              Test Database
            </Button>
          </div>

          {results && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">Results:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
