import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import s from './Confirm.module.css'

interface Request {
  title: string
  message: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

type ConfirmFn = (opts: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => false)

// oxlint-disable-next-line react/only-export-components
export const useConfirm = () => useContext(ConfirmContext)

/** HUD-styled replacement for window.confirm, built on the native <dialog>. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const confirm = useCallback<ConfirmFn>(
    ({ title, message, confirmLabel = 'Confirm' }) =>
      new Promise((resolve) => {
        setRequest({ title, message, confirmLabel, resolve })
      }),
    [],
  )

  useEffect(() => {
    if (request && !dialog.current?.open) dialog.current?.showModal()
  }, [request])

  const close = (ok: boolean) => {
    dialog.current?.close()
    request?.resolve(ok)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
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
          <>
            <h2 id="confirm-title" className={s.title}>{request.title}</h2>
            <p className={s.message}>{request.message}</p>
            <div className={s.actions}>
              <button type="button" className={s.cancel} onClick={() => close(false)} autoFocus>
                Cancel
              </button>
              <button type="button" className={s.ok} onClick={() => close(true)}>
                {request.confirmLabel}
              </button>
            </div>
          </>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}
