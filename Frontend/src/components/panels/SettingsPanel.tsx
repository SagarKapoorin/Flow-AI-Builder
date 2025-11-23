import { useState, type ChangeEvent } from 'react'
import type {
  AppRFNode,
  ButtonNodeData,
  ConditionalNodeData,
  ImageNodeData,
  TextNodeData,
} from '../../types/flow.types'
type Props = {
  node?: AppRFNode
  onChange: (updater: (node: AppRFNode) => AppRFNode) => void
  onBack: () => void
}
export default function SettingsPanel({ node, onChange, onBack }: Props) {
  const type = node?.type
  // console.log( type);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="settings-header">
        <button onClick={onBack} className="back-button">
          ←
        </button>
        <div className="settings-title">{labelFor(type)}</div>
      </div>
      <div className="settings-panel" style={{ padding: '20px' }}>
        {type === 'text' && node && (
          <TextSettings
            data={node.data}
            onChange={(d) => onChange((n) => (n.type === 'text' ? { ...n, data: d } : n))}
          />
        )}
    {type === 'image' && node && (
          <ImageSettings
            data={node.data}
            onChange={(d) => onChange((n) => (n.type === 'image' ? { ...n, data: d } : n))}
          />
        )}
      {type === 'button' && node && (
          <ButtonSettings
            data={node.data}
            onChange={(d) => onChange((n) => (n.type === 'button' ? { ...n, data: d } : n))}
          />
        )}
        {type === 'conditional' && node && (
          <ConditionalSettings
            data={node.data}
            onChange={(d) => onChange((n) => (n.type === 'conditional' ? { ...n, data: d } : n))}
          />
        )}
      </div>
    </div>
  )
}

function labelFor(type: AppRFNode['type'] | undefined) {
  switch (type) {
    case 'text':
      return 'Message'
    case 'image':
      return 'Image'
    case 'button':
      return 'Quick Reply'
    case 'conditional':
      return 'Condition'
    default:
      return 'Settings'
  }
}

function TextSettings({
  data,
  onChange,
}: {
  data?: TextNodeData
  onChange: (d: TextNodeData) => void
}) {
  const [isWriting, setIsWriting] = useState(false)
  const apiBase = (import.meta).env?.VITE_API_BASE_URL || 'http://localhost:4000'
  const handleAiWrite = async () => {
    const basePrompt = data?.text?.trim() || 'Write a friendly chatbot message.'
    setIsWriting(true)
    try {
      const res = await fetch(`${apiBase}/api/ai/write-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt, style: 'support', length: 'medium' }),
      })
      if (!res.ok) return
      const body = await res.json()
      if (body && typeof body.text === 'string') onChange({ text: body.text })
    } catch {
      console.log("Error in AI write");
    } finally {
      setIsWriting(false)
    }
  }
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => onChange({ text: e.target.value })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="form-label">Text</div>
      <textarea value={data?.text ?? ''} onChange={handleChange} rows={6} className="textarea" />
      <button className="btn" type="button" onClick={handleAiWrite} disabled={isWriting}>
        {isWriting ? 'Writing…' : 'Let AI write this'}
      </button>
    </div>
  )
}

function ImageSettings({
  data,
  onChange,
}: {
  data?: ImageNodeData
  onChange: (d: ImageNodeData) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const apiBase = (import.meta).env?.VITE_API_BASE_URL || 'http://localhost:4000'
  const onUrl = (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ imageUrl: e.target.value, caption: data?.caption })
  const onCaption = (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ imageUrl: data?.imageUrl || '', caption: e.target.value })
  const handleGenerate = async () => {
    const basePrompt =
      (data?.caption && data.caption.trim()) ||
      (data?.imageUrl && `Generate an image similar to: ${data.imageUrl}`) ||
      'Generate an image suitable for this chatbot message.'
    setIsGenerating(true)
    try {
      const res = await fetch(`${apiBase}/api/ai/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt, size: '1024x1024' }),
      })
      if (!res.ok) return
      const body = await res.json()
      if (body && typeof body.imageUrl === 'string') {
        onChange({ imageUrl: body.imageUrl, caption: data?.caption })
      }
    } catch {
      console.log("Error in AI image generation");
    } finally {
      setIsGenerating(false)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="form-label">Image URL</div>
        <input
          value={data?.imageUrl ?? ''}
          onChange={onUrl}
          placeholder="https://..."
          className="input"
        />
      </div>
      <div>
        <div className="form-label">Caption</div>
        <input
          value={data?.caption ?? ''}
          onChange={onCaption}
          placeholder="Optional"
          className="input"
        />
      </div>
      <button className="btn" type="button" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating…' : 'Generate image with AI'}
      </button>
    </div>
  )
}

function ButtonSettings({
  data,
  onChange,
}: {
  data?: ButtonNodeData
  onChange: (d: ButtonNodeData) => void
}) {
  // console.log(data)
  const [isWriting, setIsWriting] = useState(false)
  const apiBase = (import.meta).env?.VITE_API_BASE_URL || 'http://localhost:3000'
  const buttons = data?.buttons ?? []
  const setText = (e: ChangeEvent<HTMLInputElement>) => onChange({ text: e.target.value, buttons })
  const setBtn = (idx: number, key: 'label' | 'value') => (e: ChangeEvent<HTMLInputElement>) => {
    const next = buttons.map((b, i) => (i === idx ? { ...b, [key]: e.target.value } : b))
    onChange({ text: data?.text || '', buttons: next })
  }
  const addBtn = () =>
    onChange({
      text: data?.text || '',
      buttons: [...buttons, { label: 'Option', value: `opt_${buttons.length + 1}` }],
    })
  const removeBtn = (idx: number) =>
    onChange({ text: data?.text || '', buttons: buttons.filter((_, i) => i !== idx) })
  const handleAiWrite = async () => {
    const basePrompt = data?.text?.trim() || 'Write a question for quick reply buttons.'
    setIsWriting(true)
    try {
      const res = await fetch(`${apiBase}/api/ai/write-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt, style: 'support', length: 'short' }),
      })
      if (!res.ok) return
      const body = await res.json()
      if (body && typeof body.text === 'string') onChange({ text: body.text, buttons })
    } catch {
      console.log("Error in AI write for button text");
    } finally {
      setIsWriting(false)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="form-label">Prompt</div>
        <input
          value={data?.text ?? ''}
          onChange={setText}
          placeholder="Ask a question"
          className="input"
        />
        <div style={{ marginTop: '8px' }}>
          <button className="btn" type="button" onClick={handleAiWrite} disabled={isWriting}>
            {isWriting ? 'Writing…' : 'Let AI write this'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="section-title">Buttons</div>
        {buttons.map((b, i) => (
          <div key={i} className="button-edit-row">
            <input
              value={b.label}
              onChange={setBtn(i, 'label')}
              placeholder="Label"
              className="input flex-1"
            />
            <input
              value={b.value}
              onChange={setBtn(i, 'value')}
              placeholder="Value"
              className="input flex-1"
            />
            <button onClick={() => removeBtn(i)} className="btn">
              ✕
            </button>
          </div>
        ))}
        <button onClick={addBtn} className="btn">
          + Add Button
        </button>
      </div>
    </div>
  )
}

function ConditionalSettings({
  data,
  onChange,
}: {
  data?: ConditionalNodeData
  onChange: (d: ConditionalNodeData) => void
}) {
  const onVar = (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ variable: e.target.value, condition: data?.condition || '' })
  const onCond = (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ variable: data?.variable || '', condition: e.target.value })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="form-label">Variable</div>
        <input
          value={data?.variable ?? ''}
          onChange={onVar}
          placeholder="e.g. answer"
          className="input"
        />
      </div>
      <div>
             <div className="form-label">Condition</div>
        <input
          value={data?.condition ?? ''}
          onChange={onCond}
          placeholder={'e.g. == "yes"'}
          className="input"
        />
      </div>
      <div className="muted">Outputs: true, false</div>
    </div>
  )
}
