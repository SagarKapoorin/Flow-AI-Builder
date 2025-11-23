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

  const systemPrompt =
    'You are a senior chatbot flow architect. ' +
    'Generate a directed acyclic chatbot flow graph as JSON with exactly one entry node. ' +
    'Use node types: "text", "image", "button", "conditional". ' +
    'Data schema: ' +
    'text: { text: string }, ' +
    'image: { imageUrl: string, caption?: string }, ' +
    'button: { text: string, buttons: { label: string, value: string }[] }, ' +
    'conditional: { variable: string, condition: string }. ' +
    'Edges: { id: string, source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null, type?: string }. ' +
    'For button nodes, sourceHandle must equal one of the button "value" strings. ' +
    'For conditional nodes, use sourceHandle "true" or "false" only. ' +
    'Ensure: no cycles, no self loops, no bidirectional pairs, and exactly one node with zero indegree if there is more than one node. ' +
    'Respond ONLY with a JSON object { "nodes": [...], "edges": [...] }.'

  const preferenceDesc =
    preferences && Object.keys(preferences).length
      ? `Preferences: ${JSON.stringify(preferences)}`
      : 'Preferences: none specified'

  const completion = await openai.chat.completions.create({
    model: config.openaiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Brief: ${brief}\n${preferenceDesc}` },
    ],
    temperature: 0.4,
  })

  const content = completion.choices[0]?.message?.content || '{}'
  // console.log("AI Flow Generation Completion:", content);
  let parsed: GenerateFlowFromBriefResponse
  try {
    parsed = JSON.parse(content) as GenerateFlowFromBriefResponse
  } catch {
    throw new Error('Failed to parse OpenAI flow generation response as JSON')
  }

  const validation = validateFlowGraph(parsed)
  if (!validation.valid) {
    const error: any = new Error(
      'Model produced an invalid flow graph: ' + validation.errors.join('; ')
    )
    error.name = 'AIFlowGenerationError'
    error.validationErrors = validation.errors
    throw error
  }
  return parsed
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
