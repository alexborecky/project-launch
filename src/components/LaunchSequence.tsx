import check from '../assets/figma/check.svg'
import stepDot from '../assets/figma/step-dot.svg'
import stepLock from '../assets/figma/step-lock.svg'
import s from './LaunchSequence.module.css'

export type StepState = 'checked' | 'pending' | 'locked'

export interface Step {
  label: string
  state: StepState
  /** Makes the checkbox clickable (go / no-go in god mode). */
  onToggle?: () => void
}

export function LaunchSequence({ steps }: { steps: Step[] }) {
  return (
    <section className={s.panel} aria-label="Launch sequence">
      <h2 className={s.title}>LAUNCH SEQUENCE</h2>
      <ol className={s.list}>
        {steps.map((step) => {
          const box = (
            <span className={`${s.box} ${step.state === 'checked' ? s.boxOn : ''}`} aria-hidden="true">
              {step.state === 'checked' && <img src={check} alt="" width={10} height={10} />}
            </span>
          )
          const stateText = step.state === 'checked' ? 'done' : step.state === 'locked' ? 'locked' : 'not done'
          return (
            <li key={step.label} className={`${s.step} ${s[step.state]}`}>
              {step.onToggle ? (
                <button type="button" className={s.toggle} role="checkbox" aria-checked={step.state === 'checked'} onClick={step.onToggle}>
                  {box}
                  <span className={s.label}>{step.label}</span>
                </button>
              ) : (
                <>
                  {box}
                  <span className={s.label}>
                    {step.label}
                    <span className="sr-only">, {stateText}</span>
                  </span>
                </>
              )}
              <span className={s.spacer} />
              {step.state === 'pending' && <img src={stepDot} alt="" width={5} height={5} />}
              {step.state === 'locked' && <img src={stepLock} alt="" width={11} height={11} />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
