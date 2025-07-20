"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Eye, EyeOff } from "lucide-react"

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApiKeySet: (apiKey: string) => void
  currentApiKey?: string
}

export function ApiKeyDialog({ open, onOpenChange, onApiKeySet, currentApiKey }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || "")
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            GMI-Cloud API Key
          </DialogTitle>
          <DialogDescription>
            Enter your GMI-Cloud API key to enable AI agent analysis. Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                placeholder="Enter your GMI-Cloud API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Get your API key from <a href="https://api.gmi-serving.com" target="_blank" rel="noopener noreferrer" className="underline">GMI-Cloud</a></p>
            <p>• Your key is stored locally in your browser</p>
            <p>• Used for DeepSeek-R1 model access</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}