"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AgentPrompt } from "@/lib/api"

interface CustomAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (agent: Omit<AgentPrompt, 'id'>) => void
  onUpdate?: (agentId: string, updates: Partial<AgentPrompt>) => void
  editingAgent?: AgentPrompt | null
}

export function CustomAgentDialog({ open, onOpenChange, onSave, onUpdate, editingAgent }: CustomAgentDialogProps) {
  const [name, setName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [analysisPrompt, setAnalysisPrompt] = useState("")
  const [customAgentLimitReached, setCustomAgentLimitReached] = useState(false)

  useEffect(() => {
    // Check if limit reached by counting agents in localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('custom-agents')
      const agents = saved ? JSON.parse(saved) : []
      setCustomAgentLimitReached(agents.length >= 10)
    }
  }, [open])

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name)
      // Strip the auto-added JSON formatting from system prompt for editing
      const cleanSystemPrompt = editingAgent.systemPrompt.replace(/ IMPORTANT: Respond ONLY with valid JSON in the exact format specified\.$/, '')
      setSystemPrompt(cleanSystemPrompt)
      
      // Strip the auto-added JSON formatting from analysis prompt for editing
      const cleanAnalysisPrompt = editingAgent.analysisPrompt.split('\n\nProvide a verdict')[0]
      setAnalysisPrompt(cleanAnalysisPrompt)
    } else {
      setName("")
      setSystemPrompt("")
      setAnalysisPrompt("")
    }
  }, [editingAgent, open])

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim() || !analysisPrompt.trim()) {
      return
    }

    // Auto-format the system prompt to include JSON response requirement
    const formattedSystemPrompt = `${systemPrompt.trim()} IMPORTANT: Respond ONLY with valid JSON in the exact format specified.`

    // Auto-format the analysis prompt to include JSON structure
    const formattedAnalysisPrompt = `${analysisPrompt.trim()}

Provide a verdict (pass/warning/fail), detailed commentary, and confidence score (0-100).

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "verdict": "pass|warning|fail",
  "commentary": "Your detailed analysis here",
  "revisedText": "Optional improved version (only if verdict is warning/fail)",
  "confidence": 85,
  "metrics": {
    "conciseness": 75,
    "correctness": 90,
    "bias": 15,
    "toxicity": 5,
    "objectivity": 85
  }
}`

    if (editingAgent && onUpdate) {
      onUpdate(editingAgent.id, {
        name,
        systemPrompt: formattedSystemPrompt,
        analysisPrompt: formattedAnalysisPrompt
      })
    } else {
      onSave({
        name,
        systemPrompt: formattedSystemPrompt,
        analysisPrompt: formattedAnalysisPrompt
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAgent ? "Edit Custom Agent" : "Add Custom Agent"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g., Security Expert, Marketing Specialist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              placeholder="Define the agent's role and expertise..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              This defines the agent's role, expertise, and general behavior. JSON formatting will be added automatically.
            </p>
          </div>

          <div>
            <Label htmlFor="analysis-prompt">Analysis Prompt</Label>
            <Textarea
              id="analysis-prompt"
              placeholder="Specify what the agent should analyze and how to respond..."
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              This tells the agent what to look for in their analysis. The JSON response format and metrics structure will be added automatically.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !systemPrompt.trim() || !analysisPrompt.trim() || customAgentLimitReached}
              title={customAgentLimitReached ? "Maximum 10 custom agents allowed" : ""}
            >
              {editingAgent ? "Update Agent" : "Add Agent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}