import type { Flow } from '../types/flow.types'
import { validateFlow } from '../hooks/useFlowValidation'

type Props = {
  flow: Flow
  name?: string
  description?: string
  flowId?: string
  onFlowIdChange?: (id: string | undefined) => void
  onSave?: (flow: Flow) => void
  onError?: (errors: string[]) => void
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function persistFlowToBackend(
  flow: Flow,
  name?: string,
  description?: string,
  existingId?: string
): Promise<string | undefined> {
  const payload = {
    name: name || 'Main Chatbot Flow',
    description: description ?? 'Saved from BiteSpeed Flow Builder',
    nodes: flow.nodes,
    edges: flow.edges,
  }
  const url = existingId
    ? `${API_BASE}/api/flows/${encodeURIComponent(existingId)}`
    : `${API_BASE}/api/flows`
  const method = existingId ? 'PUT' : 'POST'

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let message = 'Failed to save flow to backend'
    try {
      const body = await res.json()
      if (Array.isArray(body.errors) && body.errors.length > 0) message = body.errors[0]
      else if (typeof body.message === 'string') message = body.message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  try {
    const saved = await res.json()
    if (saved && typeof saved.id === 'string') {
      return saved.id
    }
  } catch {
    // ignore if no json body / parse error
  }
  return existingId
}

export default function SaveButton({
  flow,
  name,
  description,
  flowId,
  onFlowIdChange,
  onSave,
  onError,
}: Props) {
  const handleClick = async () => {
    const result = validateFlow(flow)
    if (!result.valid) {
      if (onError) onError(result.errors)
      return
    }
    try {
      const newId = await persistFlowToBackend(flow, name, description, flowId)
      if (newId && onFlowIdChange) onFlowIdChange(newId)
      if (onSave) onSave(flow)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save to backend'
      if (onError) onError([message])
    }
  }
  return (
    <>
      <button className="btn btn-primary" onClick={handleClick}>
        Save Changes
      </button>
    </>
  )
}
