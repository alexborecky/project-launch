import { useCallback } from 'react'
import { useDialogs } from '../components/Confirm'
import type { Action } from '../game/actions'
import { saveCode, store } from './store'

/**
 * Sends one action to the store. If the server asks for a code, asks for it once and retries.
 * Problems (no connection, someone else got there first) are shown in a dialog.
 * Resolves to true when the change was saved.
 */
export function useAct() {
  const { alert, prompt } = useDialogs()

  return useCallback(
    async (action: Action): Promise<boolean> => {
      let result = await store.dispatch(action)
      for (let tries = 0; !result.ok && result.need && tries < 2; tries++) {
        const admin = result.need === 'admin'
        const code = await prompt({
          title: tries === 0 ? (admin ? 'Admin code needed' : 'Team code needed') : 'That code didn’t work',
          message: admin
            ? 'Resetting, the go / no-go poll and launching need the facilitator’s admin code.'
            : 'Changes to the board need the team code. You only enter it once on this device.',
          field: admin ? 'Admin code' : 'Team code',
        })
        if (code == null) return false
        saveCode(code)
        result = await store.dispatch(action)
      }
      if (!result.ok) {
        await alert({ title: result.offline ? 'No connection' : 'Not saved', message: result.error })
        return false
      }
      return true
    },
    [alert, prompt],
  )
}
