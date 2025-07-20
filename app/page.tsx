"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiKeyDialog } from "@/components/ui/api-key-dialog"
import { useToast } from "@/components/ui/use-toast"
import { 
  Brain, 
  Code, 
  Baby, 
  Lightbulb, 
  FileText, 
  GraduationCap, 
  Shield, 
  Edit3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  Loader2,
  BarChart3,
  PieChart,
  MessageSquare,
  User,
  Bot,
  Settings
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { runParallelAnalysis, generateMasterConsensus, AGENT_PROMPTS } from "@/lib/api"
import { cleanJsonArtifacts } from "@/lib/utils"
import type { APIResponse } from "@/lib/api"

interface AgentResult {
  id: string
  name: string
  icon: React.ReactNode
  status: "pending" | "running" | "completed"
  verdict: "pass" | "warning" | "fail" | null
  commentary: string
  revisedText?: string
  processingTime?: number
  confidence: number
  error?: string
}

interface MasterConsensus {
  overallVerdict: "pass" | "warning" | "fail"
  trustScore: number
  summary: string
  betterAnswer?: string
  keyIssues: string[]
  recommendations: string[]
  consensusText?: string
}

export default function TruthCheckAI() {
  const [userPrompt, setUserPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [masterConsensus, setMasterConsensus] = useState<MasterConsensus | null>(null)
  const [isGeneratingConsensus, setIsGeneratingConsensus] = useState(false)
  const { toast } = useToast()
  const [agents, setAgents] = useState<AgentResult[]>(() => {
    const agentIcons = {
      developer: <Code className="w-4 h-4" />,
      child: <Baby className="w-4 h-4" />,
      philosopher: <Lightbulb className="w-4 h-4" />,
      journalist: <FileText className="w-4 h-4" />,
      expert: <GraduationCap className="w-4 h-4" />,
      compliance: <Shield className="w-4 h-4" />,
      editor: <Edit3 className="w-4 h-4" />
    }
    
    return AGENT_PROMPTS.map(agent => ({
      id: agent.id,
      name: agent.name,
      icon: agentIcons[agent.id as keyof typeof agentIcons],
      status: "pending" as const,
      verdict: null,
      commentary: "",
      confidence: 0
    }))
  })

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gmi-api-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleApiKeySet = (newApiKey: string) => {
    setApiKey(newApiKey)
    localStorage.setItem('gmi-api-key', newApiKey)
  }

  const handleAnalyze = async () => {
    if (!userPrompt.trim() || !aiResponse.trim()) return
    
    if (!apiKey.trim()) {
      setShowApiKeyDialog(true)
      return
    }
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setMasterConsensus(null)
    setIsGeneratingConsensus(false)
    
    // Reset agents
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: "pending",
      verdict: null,
      commentary: "",
      revisedText: undefined,
      processingTime: undefined,
      confidence: 0,
      error: undefined
    })))

    try {
      // Set all agents to running
      setAgents(prev => prev.map(agent => ({ ...agent, status: "running" })))
      
      const agentResults: Array<{ agentId: string; result: APIResponse }> = []
      
      // Run parallel analysis
      await runParallelAnalysis(
        userPrompt,
        aiResponse,
        apiKey,
        (agentId: string, result: APIResponse, processingTime: number) => {
          // Ensure result is valid before processing
          if (!result) {
            console.warn(`Agent ${agentId} returned null result`)
            result = {
              verdict: "fail",
              commentary: "Analysis failed - no result returned",
              confidence: 0
            }
          }

          // Update individual agent as it completes
          setAgents(prev => prev.map(agent => 
            agent.id === agentId ? {
              ...agent,
              status: "completed",
              verdict: result.verdict || "fail",
              commentary: result.commentary || "No commentary provided",
              revisedText: result.revisedText,
              confidence: result.confidence || 0,
              processingTime
            } : agent
          ))
          
          agentResults.push({ agentId, result })
          
          // Update progress (leave room for master consensus generation)
          const completedCount = agentResults.length
          setAnalysisProgress((completedCount / AGENT_PROMPTS.length) * 80) // 80% for agents, 20% for consensus
        }
      )
      
      // Generate master consensus only if we have valid results
      const validResults = agentResults.filter(r => r.result && r.result.verdict)
      
      if (validResults.length > 0) {
        setIsGeneratingConsensus(true)
        setAnalysisProgress(90) // Show we're working on consensus
        
        const consensus = await generateMasterConsensus(
          userPrompt,
          aiResponse,
          validResults, // Only pass valid results
          apiKey
        )
        
        setMasterConsensus(consensus)
      } else {
        // Fallback if no valid results
        setMasterConsensus({
          overallVerdict: "fail",
          trustScore: 0,
          summary: "Analysis failed - no valid agent results received",
          keyIssues: ["All agent analyses failed"],
          recommendations: ["Check API key and connection", "Retry analysis"],
          consensusText: "Unable to generate consensus due to analysis failures",
          betterAnswer: "No better answer could be generated due to analysis failures."
        })
      }
      
      setAnalysisProgress(100)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      // Handle error state
      setAgents(prev => prev.map(agent => ({
        ...agent,
        status: "completed",
        verdict: "fail",
        commentary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })))
    } finally {
      setIsAnalyzing(false)
      setIsGeneratingConsensus(false)
    }
  }

  const getVerdictIcon = (verdict: string | null) => {
    switch (verdict) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "fail":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case "pass":
        return "bg-green-100 text-green-800 border-green-300"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "fail":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const completedAgents = agents.filter(agent => agent.status === "completed")
  
  // Chart data with null checks
  const verdictData = [
    { name: "Pass", value: completedAgents.filter(a => a.verdict === "pass").length, fill: "#10b981" },
    { name: "Warning", value: completedAgents.filter(a => a.verdict === "warning").length, fill: "#f59e0b" },
    { name: "Fail", value: completedAgents.filter(a => a.verdict === "fail").length, fill: "#ef4444" }
  ].filter(item => item.value > 0) // Only show non-zero values

  const confidenceData = completedAgents
    .filter(agent => agent.confidence != null) // Filter out null/undefined confidence
    .map(agent => ({
      name: agent.name.split(' ')[0],
      confidence: agent.confidence
    }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-black" />
            <h1 className="text-4xl font-light text-black tracking-tight">TruthCheck AI</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
            Agentic AI verifier for detecting hallucinations, misinformation, and logical errors
          </p>
        </div>

        {/* Input Section */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-xl font-normal">
              <MessageSquare className="w-5 h-5" />
              Input Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  Your Prompt
                </div>
                <Textarea
                  placeholder="Enter the original prompt you gave to the AI..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-[120px] resize-none border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Bot className="w-4 h-4" />
                  AI Response
                </div>
                <Textarea
                  placeholder="Paste the AI-generated response to verify..."
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  className="min-h-[120px] resize-none border-gray-200 focus:border-gray-400 focus:ring-0"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowApiKeyDialog(true)}
                  className="border-gray-300 hover:border-gray-400"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {apiKey ? 'Update' : 'Set'} API Key
                </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={!userPrompt.trim() || !aiResponse.trim() || isAnalyzing || !apiKey.trim()}
                className="bg-black hover:bg-gray-800 text-white px-8 py-2 font-normal"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isGeneratingConsensus ? 'Generating Consensus...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
              </div>
            </div>
            
            {isAnalyzing && (
              <div className="space-y-3 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {isGeneratingConsensus ? 'Generating Master Consensus...' : 'Running Agent Analysis...'}
                  </span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="w-full h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {(completedAgents.length > 0 || masterConsensus) && (
          <Tabs defaultValue="agents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="agents" className="data-[state=active]:bg-white">Agent Reviews</TabsTrigger>
              <TabsTrigger value="consensus" className="data-[state=active]:bg-white">
                Master Consensus {masterConsensus && <span className="ml-1 text-xs">✓</span>}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white">Analytics</TabsTrigger>
            </TabsList>

            {/* Agent Reviews Tab */}
            <TabsContent value="agents" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className={`border-gray-200 shadow-sm transition-all duration-300 ${
                    agent.status === "running" ? "ring-1 ring-gray-400" : ""
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          {agent.icon}
                          <span className="font-medium text-sm">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {agent.status === "running" && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          )}
                          {agent.verdict && getVerdictIcon(agent.verdict)}
                          {agent.verdict && (
                            <Badge className={`text-xs ${getVerdictColor(agent.verdict)}`}>
                              {agent.verdict}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {agent.commentary && (
                        <div className="space-y-3">
                          {agent.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-700">
                                Error: {agent.error}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {cleanJsonArtifacts(agent.commentary)}
                          </p>
                          {agent.revisedText && (
                            <div className="p-3 bg-gray-50 rounded border-l-2 border-gray-400">
                              <p className="text-xs font-medium text-gray-800 mb-1">
                                Suggested Revision:
                              </p>
                              <p className="text-xs text-gray-700">
                                {agent.revisedText}
                              </p>
                            </div>
                          )}
                          <div className="flex justify-between text-xs text-gray-400">
                            {agent.confidence > 0 && (
                              <span>Confidence: {agent.confidence}%</span>
                            )}
                            {agent.processingTime && (
                              <span>{agent.processingTime}ms</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Master Consensus Tab */}
            <TabsContent value="consensus" className="space-y-6">
              {masterConsensus ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2 text-lg font-normal">
                        <Brain className="w-5 h-5" />
                        Final Verdict
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-light text-black">
                          {masterConsensus.trustScore}%
                        </div>
                        <div className="text-sm text-gray-600">Trust Score</div>
                        <Badge className={`${getVerdictColor(masterConsensus.overallVerdict)} text-sm px-3 py-1`}>
                          {masterConsensus.overallVerdict.toUpperCase()}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {cleanJsonArtifacts(masterConsensus.summary)}
                        </p>
                        {masterConsensus.consensusText && (
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {cleanJsonArtifacts(masterConsensus.consensusText)}
                            </p>
                          </div>
                        )}
                        {masterConsensus.betterAnswer && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border-l-4 border-blue-400 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Better Answer
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(masterConsensus.betterAnswer!).then(() => toast({
                                  title: "Copied to clipboard!",
                                  description: "Better answer copied to clipboard.",
                                }))}
                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm text-blue-700 leading-relaxed">
                              {masterConsensus.betterAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-lg font-normal">Key Issues & Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {masterConsensus.keyIssues && masterConsensus.keyIssues.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Key Issues</h4>
                          <ul className="space-y-1">
                            {masterConsensus.keyIssues.map((issue, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="text-red-400 mt-1">•</span>
                                {cleanJsonArtifacts(issue)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {masterConsensus.keyIssues && masterConsensus.keyIssues.length > 0 && 
                       masterConsensus.recommendations && masterConsensus.recommendations.length > 0 && (
                        <Separator />
                      )}
                      {masterConsensus.recommendations && masterConsensus.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {masterConsensus.recommendations.map((rec, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="text-green-400 mt-1">•</span>
                                {cleanJsonArtifacts(rec)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : isGeneratingConsensus ? (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Generating Master Consensus
                    </h3>
                    <p className="text-sm text-gray-600">
                      Synthesizing all agent reviews into a comprehensive final assessment...
                    </p>
                  </CardContent>
                </Card>
              ) : completedAgents.length > 0 ? (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Brain className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Master Consensus Pending
                    </h3>
                    <p className="text-sm text-gray-600">
                      Complete the agent analysis to generate the master consensus.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No Analysis Yet
                    </h3>
                    <p className="text-sm text-gray-600">
                      Run an analysis to see the master consensus here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {completedAgents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2 text-lg font-normal">
                        <PieChart className="w-5 h-5" />
                        Verdict Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {verdictData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <RechartsPieChart data={verdictData}>
                                {verdictData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </RechartsPieChart>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2 text-lg font-normal">
                        <BarChart3 className="w-5 h-5" />
                        Agent Confidence Levels
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {confidenceData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={confidenceData}>
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Bar dataKey="confidence" fill="#6b7280" />
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No Analytics Yet
                    </h3>
                    <p className="text-sm text-gray-600">
                      Run an analysis to see detailed analytics here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* API Key Dialog */}
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          onApiKeySet={handleApiKeySet}
          currentApiKey={apiKey}
        />

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-8">
          <p>Privacy-first • Model-agnostic • Agentic verification</p>
        </div>
      </div>
    </div>
  )
}
