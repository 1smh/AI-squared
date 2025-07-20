export interface AgentPrompt {
  id: string
  name: string
  systemPrompt: string
  analysisPrompt: string
}

export interface APIResponse {
  verdict: "pass" | "warning" | "fail"
  commentary: string
  revisedText?: string
  confidence: number
}

export const AGENT_PROMPTS: AgentPrompt[] = [
  {
    id: "developer",
    name: "Software Developer",
    systemPrompt: "You are an experienced software developer. Your job is to review AI-generated content for code correctness, logic errors, best practices, and technical accuracy. Focus on syntax, implementation details, security concerns, and maintainability.",
    analysisPrompt: "Analyze this AI response for code correctness and technical implementation. Check for:\n- Syntax errors\n- Logic flaws\n- Security vulnerabilities\n- Best practice violations\n- Missing error handling\n\nProvide a verdict (pass/warning/fail), detailed commentary, and confidence score (0-100)."
  },
  {
    id: "child",
    name: "Child",
    systemPrompt: "You are a curious 8-year-old child. Your job is to evaluate if explanations are simple enough for a child to understand. Look for complex words, confusing concepts, and unclear explanations.",
    analysisPrompt: "Read this AI response and tell me if a child could understand it. Check for:\n- Big words that are hard to understand\n- Confusing explanations\n- Too many complex ideas at once\n- Missing simple examples\n\nIf it's too hard, suggest a simpler version. Give a verdict (pass/warning/fail), explain why, and rate your confidence (0-100)."
  },
  {
    id: "philosopher",
    name: "Philosopher",
    systemPrompt: "You are a philosopher specializing in logic, ethics, and reasoning. Your role is to examine AI responses for logical consistency, ethical implications, reasoning flaws, and philosophical soundness.",
    analysisPrompt: "Examine this AI response for logical and ethical soundness. Evaluate:\n- Logical consistency and reasoning\n- Ethical implications and concerns\n- Philosophical assumptions\n- Argument structure and validity\n- Potential biases or fallacies\n\nProvide verdict (pass/warning/fail), detailed analysis, and confidence score (0-100)."
  },
  {
    id: "journalist",
    name: "Investigative Journalist",
    systemPrompt: "You are an investigative journalist focused on fact-checking and source verification. Your job is to identify claims that need verification, check for misinformation, and assess the credibility of statements.",
    analysisPrompt: "Fact-check this AI response like an investigative journalist. Look for:\n- Unverified claims and statistics\n- Missing or questionable sources\n- Potential misinformation\n- Statements that need fact-checking\n- Credibility concerns\n\nProvide verdict (pass/warning/fail), identify specific issues, and rate confidence (0-100)."
  },
  {
    id: "expert",
    name: "Domain Expert",
    systemPrompt: "You are a domain expert with deep knowledge across multiple fields. Your role is to verify technical accuracy, identify subject matter errors, and ensure information aligns with current best practices and standards.",
    analysisPrompt: "Review this AI response for technical accuracy and domain expertise. Assess:\n- Factual correctness in the subject area\n- Alignment with current standards/practices\n- Technical terminology usage\n- Depth and accuracy of explanations\n- Missing important context\n\nProvide verdict (pass/warning/fail), expert commentary, and confidence score (0-100)."
  },
  {
    id: "compliance",
    name: "Compliance Officer",
    systemPrompt: "You are a compliance officer responsible for identifying legal, safety, and policy violations. Your job is to scan content for potential risks, regulatory issues, and safety concerns.",
    analysisPrompt: "Scan this AI response for compliance and safety issues. Check for:\n- Legal or regulatory concerns\n- Safety risks or dangerous advice\n- Privacy violations\n- Ethical policy violations\n- Inappropriate content\n\nProvide verdict (pass/warning/fail), identify specific risks, and rate confidence (0-100)."
  },
  {
    id: "editor",
    name: "Clarity Editor",
    systemPrompt: "You are a professional editor focused on clarity, accessibility, and readability. Your job is to identify unclear writing, suggest improvements, and make content more accessible to diverse audiences.",
    analysisPrompt: "Edit this AI response for clarity and accessibility. Evaluate:\n- Writing clarity and readability\n- Sentence structure and flow\n- Jargon and technical language\n- Accessibility for diverse audiences\n- Overall communication effectiveness\n\nProvide verdict (pass/warning/fail), suggest improvements, and rate confidence (0-100). If needed, provide a revised version."
  }
]

export async function callGMIAPI(
  systemPrompt: string,
  userPrompt: string,
  originalPrompt: string,
  aiResponse: string,
  apiKey: string
): Promise<any> {
  const fullPrompt = `${userPrompt}

ORIGINAL USER PROMPT: "${originalPrompt}"

AI RESPONSE TO ANALYZE: "${aiResponse}"

Please respond in this exact JSON format:
{
  "verdict": "pass" | "warning" | "fail",
  "commentary": "Your detailed analysis here",
  "revisedText": "Optional improved version (only if verdict is warning/fail)",
  "confidence": 85
}`

  const response = await fetch('https://api.gmi-serving.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    // Try to parse JSON response
    const parsed = JSON.parse(content)
    return parsed
  } catch (e) {
    // Fallback if JSON parsing fails
    return {
      verdict: "warning",
      commentary: content || "Analysis completed but response format was unexpected",
      confidence: 50
    }
  }
}

export async function runParallelAnalysis(
  originalPrompt: string,
  aiResponse: string,
  apiKey: string,
  onAgentComplete: (agentId: string, result: APIResponse, processingTime: number) => void
): Promise<void> {
  const startTime = Date.now()
  
  // Create promises for all agent API calls
  const agentPromises = AGENT_PROMPTS.map(async (agent) => {
    const agentStartTime = Date.now()
    
    try {
      const result = await callGMIAPI(
        agent.systemPrompt,
        agent.analysisPrompt,
        originalPrompt,
        aiResponse,
        apiKey
      )
      
      const processingTime = Date.now() - agentStartTime
      onAgentComplete(agent.id, result, processingTime)
      
      return { agentId: agent.id, result, processingTime }
    } catch (error) {
      console.error(`Agent ${agent.id} failed:`, error)
      const processingTime = Date.now() - agentStartTime
      const fallbackResult: APIResponse = {
        verdict: "fail",
        commentary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      }
      onAgentComplete(agent.id, fallbackResult, processingTime)
      return { agentId: agent.id, result: fallbackResult, processingTime }
    }
  })

  // Wait for all agents to complete
  await Promise.all(agentPromises)
}

export async function generateMasterConsensus(
  originalPrompt: string,
  aiResponse: string,
  agentResults: Array<{ agentId: string; result: APIResponse }>,
  apiKey: string
): Promise<any> {
  const agentSummary = agentResults.map(({ agentId, result }) => {
    const agentName = AGENT_PROMPTS.find(a => a.id === agentId)?.name || agentId
    return `${agentName}: ${result.verdict.toUpperCase()} (${result.confidence}% confidence) - ${result.commentary}`
  }).join('\n\n')

  const masterPrompt = `You are the Master Consensus Agent. Your job is to synthesize all expert agent reviews into a final assessment.

ORIGINAL PROMPT: "${originalPrompt}"
AI RESPONSE: "${aiResponse}"

AGENT REVIEWS:
${agentSummary}

Based on all agent feedback, provide a comprehensive final assessment in this JSON format:
{
  "overallVerdict": "pass" | "warning" | "fail",
  "trustScore": 85,
  "summary": "Brief summary of the analysis",
  "keyIssues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "consensusText": "Detailed final assessment and reasoning"
}`

  try {
    const result = await callGMIAPI(
      "You are a master AI analyst who synthesizes multiple expert opinions into comprehensive assessments.",
      masterPrompt,
      originalPrompt,
      aiResponse,
      apiKey
    )
    return result
  } catch (error) {
    console.error('Master consensus failed:', error)
    // Fallback consensus based on agent results
    const passCount = agentResults.filter(r => r.result.verdict === "pass").length
    const warningCount = agentResults.filter(r => r.result.verdict === "warning").length
    const failCount = agentResults.filter(r => r.result.verdict === "fail").length
    
    const trustScore = Math.round((passCount / agentResults.length) * 100)
    let overallVerdict: "pass" | "warning" | "fail"
    
    if (failCount > 0) overallVerdict = "fail"
    else if (warningCount > 2) overallVerdict = "warning"
    else overallVerdict = "pass"

    return {
      overallVerdict,
      trustScore,
      summary: `Analysis complete. ${passCount} agents passed, ${warningCount} raised warnings, ${failCount} identified critical issues.`,
      keyIssues: ["API connection issues prevented full analysis"],
      recommendations: ["Verify API key and connection", "Retry analysis"],
      consensusText: "Master consensus generation failed, but individual agent results are available above."
    }
  }
}