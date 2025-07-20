"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Bot
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
}

interface MasterConsensus {
  overallVerdict: "pass" | "warning" | "fail"
  trustScore: number
  summary: string
  keyIssues: string[]
  recommendations: string[]
  consensusText?: string
}

export default function TruthCheckAI() {
  const [userPrompt, setUserPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [masterConsensus, setMasterConsensus] = useState<MasterConsensus | null>(null)
  const [agents, setAgents] = useState<AgentResult[]>([
    {
      id: "developer",
      name: "Software Developer",
      icon: <Code className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "child",
      name: "Child",
      icon: <Baby className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "philosopher",
      name: "Philosopher",
      icon: <Lightbulb className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "journalist",
      name: "Investigative Journalist",
      icon: <FileText className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "expert",
      name: "Domain Expert",
      icon: <GraduationCap className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "compliance",
      name: "Compliance Officer",
      icon: <Shield className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    },
    {
      id: "editor",
      name: "Clarity Editor",
      icon: <Edit3 className="w-4 h-4" />,
      status: "pending",
      verdict: null,
      commentary: "",
      confidence: 0
    }
  ])

  const handleAnalyze = async () => {
    if (!userPrompt.trim() || !aiResponse.trim()) return
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setMasterConsensus(null)
    
    // Reset agents
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: "pending",
      verdict: null,
      commentary: "",
      revisedText: undefined,
      processingTime: undefined,
      confidence: 0
    })))

    // Simulate analysis process
    for (let i = 0; i < agents.length; i++) {
      // Update current agent to running
      setAgents(prev => prev.map((agent, index) => 
        index === i ? { ...agent, status: "running" } : agent
      ))
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
      
      // Complete current agent with mock results
      const mockResults = getMockAgentResult(agents[i].id)
      setAgents(prev => prev.map((agent, index) => 
        index === i ? { 
          ...agent, 
          status: "completed",
          ...mockResults,
          processingTime: Math.round(800 + Math.random() * 1200)
        } : agent
      ))
      
      setAnalysisProgress(((i + 1) / (agents.length + 1)) * 100)
    }
    
    // Generate master consensus
    await new Promise(resolve => setTimeout(resolve, 1500))
    setMasterConsensus(generateMasterConsensus())
    setAnalysisProgress(100)
    setIsAnalyzing(false)
  }

  const getMockAgentResult = (agentId: string) => {
    const mockResults = {
      developer: {
        verdict: "warning" as const,
        commentary: "Code syntax appears correct, but lacks error handling. Consider adding try-catch blocks for production use.",
        confidence: 75
      },
      child: {
        verdict: "fail" as const,
        commentary: "This explanation is too complex! I don't understand words like 'asynchronous' and 'middleware'. Can you explain it like I'm 5?",
        revisedText: "This is like a helper that waits for things to finish before moving to the next step, like waiting for your turn in line.",
        confidence: 90
      },
      philosopher: {
        verdict: "pass" as const,
        commentary: "The logical structure is sound and the reasoning follows established principles. No ethical concerns identified.",
        confidence: 85
      },
      journalist: {
        verdict: "warning" as const,
        commentary: "Claims need verification. No sources provided for statistical assertions. Recommend fact-checking with primary sources.",
        confidence: 70
      },
      expert: {
        verdict: "pass" as const,
        commentary: "Technical accuracy confirmed. Implementation follows industry best practices and current standards.",
        confidence: 95
      },
      compliance: {
        verdict: "pass" as const,
        commentary: "No legal, safety, or policy violations detected. Content complies with standard guidelines.",
        confidence: 88
      },
      editor: {
        verdict: "warning" as const,
        commentary: "Text could be more accessible. Reduced jargon and simplified sentence structure recommended.",
        revisedText: "Here's a clearer version: This tool helps check if AI responses are accurate and easy to understand.",
        confidence: 80
      }
    }
    
    return mockResults[agentId as keyof typeof mockResults] || {
      verdict: "pass" as const,
      commentary: "Analysis completed successfully.",
      confidence: 85
    }
  }

  const generateMasterConsensus = (): MasterConsensus => {
    const completedAgents = agents.filter(agent => agent.status === "completed")
    const passCount = completedAgents.filter(a => a.verdict === "pass").length
    const warningCount = completedAgents.filter(a => a.verdict === "warning").length
    const failCount = completedAgents.filter(a => a.verdict === "fail").length
    
    const trustScore = Math.round((passCount / completedAgents.length) * 100)
    
    let overallVerdict: "pass" | "warning" | "fail"
    if (failCount > 0) overallVerdict = "fail"
    else if (warningCount > 2) overallVerdict = "warning"
    else overallVerdict = "pass"

    return {
      overallVerdict,
      trustScore,
      summary: `Analysis complete. ${passCount} agents passed, ${warningCount} raised warnings, ${failCount} identified critical issues.`,
      keyIssues: [
        "Complexity concerns raised by accessibility review",
        "Missing source verification for factual claims",
        "Code lacks proper error handling"
      ],
      recommendations: [
        "Simplify technical language for broader audience",
        "Add credible sources for statistical claims",
        "Implement comprehensive error handling in code examples"
      ],
      consensusText: "The response demonstrates technical competence but requires improvements in accessibility and source verification. Consider revising for clarity while maintaining accuracy."
    }
  }

  const getVerdictIcon = (verdict: string | null) => {
    switch (verdict) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-gray-700" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
      case "fail":
        return <XCircle className="w-4 h-4 text-gray-800" />
      default:
        return null
    }
  }

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case "pass":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "warning":
        return "bg-gray-200 text-gray-800 border-gray-400"
      case "fail":
        return "bg-gray-300 text-gray-900 border-gray-500"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const completedAgents = agents.filter(agent => agent.status === "completed")
  
  // Chart data
  const verdictData = [
    { name: "Pass", value: completedAgents.filter(a => a.verdict === "pass").length, fill: "#6b7280" },
    { name: "Warning", value: completedAgents.filter(a => a.verdict === "warning").length, fill: "#9ca3af" },
    { name: "Fail", value: completedAgents.filter(a => a.verdict === "fail").length, fill: "#374151" }
  ]

  const confidenceData = completedAgents.map(agent => ({
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
              <Button 
                onClick={handleAnalyze}
                disabled={!userPrompt.trim() || !aiResponse.trim() || isAnalyzing}
                className="bg-black hover:bg-gray-800 text-white px-8 py-2 font-normal"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
            
            {isAnalyzing && (
              <div className="space-y-3 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Analysis Progress</span>
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
              <TabsTrigger value="consensus" className="data-[state=active]:bg-white">Master Consensus</TabsTrigger>
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
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {agent.commentary}
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
              {masterConsensus && (
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
                          {masterConsensus.summary}
                        </p>
                        {masterConsensus.consensusText && (
                          <div className="p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {masterConsensus.consensusText}
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
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Key Issues</h4>
                        <ul className="space-y-1">
                          {masterConsensus.keyIssues.map((issue, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {masterConsensus.recommendations.map((rec, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-lg font-normal">
                      <PieChart className="w-5 h-5" />
                      Verdict Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-8">
          <p>Privacy-first • Model-agnostic • Agentic verification</p>
        </div>
      </div>
    </div>
  )
}