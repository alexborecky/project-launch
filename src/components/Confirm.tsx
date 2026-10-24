import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import s from './Confirm.module.css'

// HUD-styled replacements for window.confirm / alert / prompt, built on the native <dialog>.

type Kind = 'confirm' | 'alert' | 'prompt'

interface Request {
  kind: Kind
  title: string
  message: string
  confirmLabel: string
  /** prompt only: label of the text field */
  field?: string
  resolve: (value: boolean | string | null) => void
}

interface Dialogs {
  confirm(opts: { title: string; message: string; confirmLabel?: string }): Promise<boolean>
  alert(opts: { title: string; message: string }): Promise<void>
  /** Resolves to the typed text, or null if cancelled. */
  prompt(opts: { title: string; message: string; field: string; confirmLabel?: string }): Promise<string | null>
}

const DialogContext = createContext<Dialogs>({
  confirm: async () => false,
  alert: async () => {},
  prompt: async () => null,
})

// oxlint-disable-next-line react/only-export-components
export const useDialogs = () => useContext(DialogContext)
// oxlint-disable-next-line react/only-export-components
export const useConfirm = () => useContext(DialogContext).confirm

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  const [text, setText] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

  const open = useCallback(
    (r: Omit<Request, 'resolve'>) =>
      new Promise<boolean | string | null>((resolve) => {
        setText('')
        setRequest({ ...r, resolve })
      }),
    [],
  )

  const dialogs = useMemo<Dialogs>(
    () => ({
      confirm: ({ title, message, confirmLabel = 'Confirm' }) => open({ kind: 'confirm', title, message, confirmLabel }) as Promise<boolean>,
      alert: async ({ title, message }) => void (await open({ kind: 'alert', title, message, confirmLabel: 'OK' })),
      prompt: ({ title, message, field, confirmLabel = 'Save' }) =>
        open({ kind: 'prompt', title, message, field, confirmLabel }) as Promise<string | null>,
    }),
    [open],
  )

  useEffect(() => {
    if (request && !dialog.current?.open) dialog.current?.showModal()
  }, [request])

  const close = (ok: boolean) => {
    dialog.current?.close()
    if (request?.kind === 'prompt') request.resolve(ok ? text : null)
    else request?.resolve(ok)
    setRequest(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (request?.kind === 'prompt' && !text.trim()) return
    close(true)
  }

  return (
    <DialogContext.Provider value={dialogs}>
      {children}
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-labelledby="confirm-title"
        onCancel={(e) => {
          e.preventDefault()
          close(false)
        }}
      >
        {request && (
          <form onSubmit={submit}>
            <h2 id="confirm-title" className={s.title}>{request.title}</h2>
            <p className={s.message}>{request.message}</p>
            {request.kind === 'prompt' && (
              <label className={s.field}>
                <span>{request.field}</span>
                <input
                  className={s.input}
                  type="password"
                  autoComplete="off"
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
            )}
            <div className={s.actions}>
              {request.kind !== 'alert' && (
                <button type="button" className={s.cancel} onClick={() => close(false)} autoFocus={request.kind === 'confirm'}>
                  Cancel
                </button>
              )}
              <button type="submit" className={s.ok} autoFocus={request.kind === 'alert'}>
                {request.confirmLabel}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </DialogContext.Provider>
  )
}
