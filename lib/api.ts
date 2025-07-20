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

export interface MasterConsensusResponse {
  overallVerdict: "pass" | "warning" | "fail"
  trustScore: number
  summary: string
  keyIssues: string[]
  recommendations: string[]
  consensusText: string
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
      max_tokens: 50000
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

// Separate function specifically for master consensus API calls
async function callMasterConsensusAPI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<MasterConsensusResponse> {
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
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2, // Lower temperature for more consistent consensus
      max_tokens: 150000  // More tokens for comprehensive analysis
    })
  })

  if (!response.ok) {
    throw new Error(`Master consensus API call failed: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  try {
    const parsed = JSON.parse(content)
    // Validate the response structure
    if (!parsed.overallVerdict || !parsed.trustScore || !parsed.summary) {
      throw new Error('Invalid master consensus response structure')
    }
    return parsed
  } catch (e) {
    throw new Error(`Failed to parse master consensus response: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }
}

export async function runParallelAnalysis(
  originalPrompt: string,
  aiResponse: string,
  apiKey: string,
  onAgentComplete: (agentId: string, result: APIResponse, processingTime: number) => void
): Promise<Array<{ agentId: string; result: APIResponse }>> {
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

  // Wait for all agents to complete and return results
  const results = await Promise.all(agentPromises)
  return results.map(({ agentId, result }) => ({ agentId, result }))
}

// Improved fallback consensus generation
function generateFallbackConsensus(
  agentResults: Array<{ agentId: string; result: APIResponse }>
): MasterConsensusResponse {
  const verdictCounts = { pass: 0, warning: 0, fail: 0 }
  const issues: string[] = []
  const recommendations: string[] = []
  let weightedConfidenceSum = 0
  let totalValidResponses = 0

  // Analyze agent results
  agentResults.forEach(({ agentId, result }) => {
    const agentName = AGENT_PROMPTS.find(a => a.id === agentId)?.name || agentId
    
    if (result.confidence > 0) {
      verdictCounts[result.verdict]++
      weightedConfidenceSum += result.confidence
      totalValidResponses++
    }

    // Extract issues from commentary
    if (result.verdict === 'fail' || result.verdict === 'warning') {
      issues.push(`${agentName}: ${result.commentary.substring(0, 100)}...`)
    }

    // Generate recommendations based on verdict
    if (result.verdict === 'fail') {
      recommendations.push(`Address ${agentName.toLowerCase()} concerns`)
    }
  })

  // Calculate trust score based on weighted average of confidence and verdict distribution
  const avgConfidence = totalValidResponses > 0 ? weightedConfidenceSum / totalValidResponses : 0
  const passRate = verdictCounts.pass / Math.max(totalValidResponses, 1)
  const trustScore = Math.round((avgConfidence * 0.7) + (passRate * 30)) // Weight confidence more heavily

  // Determine overall verdict with more nuanced logic
  let overallVerdict: "pass" | "warning" | "fail"
  const failRate = verdictCounts.fail / Math.max(totalValidResponses, 1)
  const warningRate = verdictCounts.warning / Math.max(totalValidResponses, 1)

  if (failRate > 0.3) { // If more than 30% fail
    overallVerdict = "fail"
  } else if (failRate > 0 || warningRate > 0.5) { // If any fail or more than 50% warning
    overallVerdict = "warning"
  } else {
    overallVerdict = "pass"
  }

  // Add general recommendations
  if (issues.length === 0) {
    recommendations.push("Continue with current approach")
  } else {
    recommendations.push("Review and address identified issues")
    if (trustScore < 70) {
      recommendations.push("Consider additional review or revision")
    }
  }

  return {
    overallVerdict,
    trustScore,
    summary: `Analysis complete: ${verdictCounts.pass} agents passed, ${verdictCounts.warning} raised warnings, ${verdictCounts.fail} identified critical issues. Average confidence: ${Math.round(avgConfidence)}%.`,
    keyIssues: issues.slice(0, 5), // Limit to top 5 issues
    recommendations: recommendations.slice(0, 5), // Limit to top 5 recommendations
    consensusText: `Fallback consensus generated due to API issues. Based on ${totalValidResponses} valid agent responses, the overall assessment is ${overallVerdict} with a trust score of ${trustScore}%. ${issues.length > 0 ? `Key concerns identified by: ${issues.map(i => i.split(':')[0]).join(', ')}.` : 'No significant issues identified.'}`
  }
}

export async function generateMasterConsensus(
  originalPrompt: string,
  aiResponse: string,
  agentResults: Array<{ agentId: string; result: APIResponse }>,
  apiKey: string
): Promise<MasterConsensusResponse> {
  // Prepare agent summary for master consensus
  const agentSummary = agentResults.map(({ agentId, result }) => {
    const agentName = AGENT_PROMPTS.find(a => a.id === agentId)?.name || agentId
    return `${agentName}: ${result.verdict.toUpperCase()} (${result.confidence}% confidence)\n   Analysis: ${result.commentary}\n   ${result.revisedText ? `Suggested revision: ${result.revisedText.substring(0, 200)}...` : ''}`
  }).join('\n\n')

  const masterSystemPrompt = `You are the Master Consensus Agent responsible for synthesizing multiple expert analyses into a comprehensive final assessment. 

Your role is to:
1. Weigh each expert's verdict and confidence level
2. Identify patterns and consensus across expert opinions  
3. Generate an overall trust score (0-100) based on agreement and confidence levels
4. Provide actionable recommendations
5. Create a balanced final assessment

Consider that:
- Higher confidence ratings should carry more weight
- Multiple experts agreeing increases reliability
- Failed analyses (confidence 0) should be noted but not heavily weighted
- Domain-specific experts may have more authority in their areas`

  const masterUserPrompt = `Synthesize these expert analyses into a comprehensive final assessment:

ORIGINAL USER PROMPT: "${originalPrompt}"

AI RESPONSE BEING EVALUATED: "${aiResponse}"

EXPERT AGENT ANALYSES:
${agentSummary}

Provide your master consensus in this exact JSON format:
{
  "overallVerdict": "pass" | "warning" | "fail",
  "trustScore": 85,
  "summary": "Brief 2-3 sentence summary of the overall assessment",
  "keyIssues": ["Specific issue 1", "Specific issue 2", "etc"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "etc"], 
  "consensusText": "Detailed 3-4 sentence explanation of your reasoning, consensus findings, and final judgment"
}`

  try {
    const result = await callMasterConsensusAPI(
      masterSystemPrompt,
      masterUserPrompt,
      apiKey
    )
    
    // Validate and sanitize the response
    return {
      overallVerdict: result.overallVerdict,
      trustScore: Math.max(0, Math.min(100, result.trustScore)), // Clamp between 0-100
      summary: result.summary || "Master consensus analysis completed",
      keyIssues: Array.isArray(result.keyIssues) ? result.keyIssues.slice(0, 10) : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 10) : [],
      consensusText: result.consensusText || "Master consensus generated successfully"
    }
    
  } catch (error) {
    console.error('Master consensus API failed:', error)
    console.log('Generating fallback consensus based on agent results...')
    
    // Use improved fallback logic
    return generateFallbackConsensus(agentResults)
  }
}
