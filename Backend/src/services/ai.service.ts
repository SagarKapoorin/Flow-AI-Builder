import OpenAI from 'openai'
import { config } from '../config/env'
import type {
  FlowGraph,
  FlowRecommendationsRequest,
  FlowRecommendationsResponse,
  GenerateFlowFromBriefRequest,
  GenerateFlowFromBriefResponse,
  GenerateImageRequest,
  GenerateImageResponse,
  WriteTextRequest,
  WriteTextResponse,
} from '../types/flow.types'
import { validateFlowGraph } from '../validation/flowValidation'

//this funciton init openai client for ai
const openai = new OpenAI({ apiKey: config.openaiApiKey })
//this funciton analize flow and recomend ai
export async function getFlowRecommendations(
  payload: FlowRecommendationsRequest
): Promise<FlowRecommendationsResponse> {
  const { currentFlow } = payload

  const systemPrompt =
    'You are an expert conversational UX designer and chatbot flow architect. ' +
    'You will receive a JSON definition of a chatbot flow graph and should analyse it for improvements. ' +
    'Focus on: missing confirmations, too many quick replies, inconsistent branches, and dead-ends. ' +
    'Respond ONLY as a JSON object with fields "recommendations" (string[]) and optional "suggestedChanges" { nodes, edges }. ' +
    'The nodes and edges must follow the same schema as the input.'

  const userContent = [
    'Current flow JSON:',
    JSON.stringify(currentFlow, null, 2),
    '',
    'Goal (optional): ' + (currentFlow.goal || 'N/A'),
    'Target audience (optional): ' + (currentFlow.targetAudience || 'N/A'),
  ].join('\n')

  const completion = await openai.chat.completions.create({
    model: config.openaiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
  })
  // console.log("AI Recommendations Completion:", completion);

  const content = completion.choices[0]?.message?.content || '{}'
  let parsed: FlowRecommendationsResponse
  try {
    parsed = JSON.parse(content) as FlowRecommendationsResponse
  } catch {
    throw new Error('Failed to parse OpenAI recommendations response as JSON')
  }
//console.log("Parsed Recommendations:", parsed);
  if (!Array.isArray(parsed.recommendations)) parsed.recommendations = []
//cnsole.log("Validating Suggested Changes:", parsed.suggestedChanges);
  if (parsed.suggestedChanges) {
    const validation = validateFlowGraph(parsed.suggestedChanges as FlowGraph)
    if (!validation.valid) {
      parsed.recommendations.push(
        'Model suggested invalid structural changes, so they were omitted: ' +
          validation.errors.join('; ')
      )
      delete (parsed as any).suggestedChanges
    }
  }
  return parsed
}

//this funciton generat new flow from brief ai
export async function generateFlowFromBrief(
  payload: GenerateFlowFromBriefRequest
): Promise<GenerateFlowFromBriefResponse> {
  const { brief, preferences } = payload

  const baseSystemPrompt =
    'You are a senior chatbot flow architect. ' +
    'Your primary goal is to generate a flow graph that STRICTLY passes the following validator rules: ' +
    '(1) The graph must be a directed acyclic graph (DAG): absolutely no cycles. ' +
    '(2) No self-loops are allowed (an edge where source === target). ' +
    '(3) No bidirectional pairs are allowed: if there is an edge A->B then there must NOT be an edge B->A. ' +
    '(4) If there is more than one node, there must be EXACTLY ONE entry node (a node with indegree 0). ' +
    '(5) Allowed node types are ONLY: "text", "image", "button", "conditional". ' +
    '(6) For "text" and "image" nodes: they may have at most ONE outgoing edge, and their outgoing edges MUST NOT use a named sourceHandle (sourceHandle must be null/omitted). ' +
    '(7) For "button" nodes: data = { text: string, buttons: { label: string, value: string }[] }. Every outgoing edge MUST have sourceHandle equal to one of the button "value" strings. You may have multiple outgoing edges from a button node, but each must use a valid button value. Do not create edges with missing or unknown sourceHandle values. ' +
    '(8) For "conditional" nodes: every outgoing edge MUST have sourceHandle equal to "true" or "false" ONLY. ' +
    '(9) All node ids must be unique strings. ' +
    '(10) All edge ids must be unique strings, and every edge.source and edge.target must refer to an existing node id. ' +
    'Use node types: "text", "image", "button", "conditional". ' +
    'Node data schema: ' +
    'text: { text: string }, ' +
    'image: { imageUrl: string, caption?: string }, ' +
    'button: { text: string, buttons: { label: string, value: string }[] }, ' +
    'conditional: { variable: string, condition: string }. ' +
    'Edges schema: { id: string, source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null, type?: string }. ' +
    'Before you respond, mentally CHECK EACH RULE (1)-(10) above and fix any violations (such as cycles, bidirectional edges, invalid handles, multiple entry nodes) so that the final graph will pass validation. ' +
    'Respond ONLY with a JSON object of the form { "nodes": [...], "edges": [...] } and no other text.'

  const preferenceDesc =
    preferences && Object.keys(preferences).length
      ? `Preferences: ${JSON.stringify(preferences)}`
      : 'Preferences: none specified'

  let lastErrors: string[] = []
  let lastGraph: FlowGraph | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: baseSystemPrompt },
      { role: 'user', content: `Brief: ${brief}\n${preferenceDesc}` },
    ]

    if (attempt > 1 && lastGraph) {
      messages.push({
        role: 'user',
        content: [
          'The previous flow graph you produced did not pass validation.',
          'Here is the invalid JSON graph:',
          JSON.stringify(lastGraph, null, 2),
          '',
          'Validator errors:',
          ...lastErrors.map((e) => `- ${e}`),
          '',
          'Please output a CORRECTED graph that fixes ALL of these issues while keeping the overall conversational intent similar.',
          'Remember to re-check ALL rules (1)-(10) before responding.',
        ].join('\n'),
      })
    }

    const completion = await openai.chat.completions.create({
      model: config.openaiModel,
      response_format: { type: 'json_object' },
      messages,
      temperature: attempt === 1 ? 0.4 : 0.2,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    let parsed: GenerateFlowFromBriefResponse
    try {
      parsed = JSON.parse(content) as GenerateFlowFromBriefResponse
    } catch {
      lastErrors = ['Failed to parse OpenAI flow generation response as JSON']
      lastGraph = null
      continue
    }

    const validation = validateFlowGraph(parsed as unknown as FlowGraph)
    if (validation.valid) {
      return parsed
    }

    lastErrors = validation.errors
    lastGraph = parsed as unknown as FlowGraph
  }

  const error: any = new Error(
    'Model produced an invalid flow graph after retries: ' + lastErrors.join('; ')
  )
  error.name = 'AIFlowGenerationError'
  error.validationErrors = lastErrors
  throw error
}

//this funciton generat image with ai
export async function generateImage(payload: GenerateImageRequest): Promise<GenerateImageResponse> {
  const { prompt } = payload

  const imageResponse = await openai.images.generate({
    model: config.openaiImageModel,
    prompt,
    size: '1024x1024',
  })

  const imageUrl = imageResponse.data?.[0]?.url
  if (!imageUrl) throw new Error('OpenAI image API did not return an image URL')

  return { imageUrl }
}

//this funciton write text contant with ai
export async function writeText(payload: WriteTextRequest): Promise<WriteTextResponse> {
  const { prompt, style = 'generic', length = 'medium' } = payload

  const systemPrompt =
    'You are a copywriter for chatbot messages. ' +
    'Write concise, user-friendly text suitable for a chatbot bubble or quick reply prompt. ' +
    'Do not include markdown, bullet points, or surrounding quotes. ' +
    'Return only the final text.'

  const userLines = [
    `Base prompt: ${prompt}`,
    `Style: ${style}`,
    `Length: ${length} (short ~1 sentence, medium ~2-3 sentences, long ~4-6 sentences)`,
  ].join('\n')

  const completion = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userLines },
    ],
    temperature: 0.7,
  })

  const text = (completion.choices[0]?.message?.content || '').trim()
  // console.log("AI Write Text Completion:", text);
  return { text }
}
