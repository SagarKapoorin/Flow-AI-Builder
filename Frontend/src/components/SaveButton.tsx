import type { Flow } from '../types/flow.types'
import { validateFlow } from '../hooks/useFlowValidation'
type Props = {
  flow: Flow
  onSave?: (flow: Flow) => void
  onError?: (errors: string[]) => void
}

export default function SaveButton({ flow, onSave, onError }: Props) {  const handleClick = () => {
    const result = validateFlow(flow)
    if (!result.valid) {
      if (onError) onError(result.errors)
      return
    }
    try {
      const json = JSON.stringify(flow)
      localStorage.setItem('bitspeed.flow', json)
      if (onSave) onSave(flow)
    } catch {
      const errs = ['failed to save to localstorage']
      if (onError) onError(errs)
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
