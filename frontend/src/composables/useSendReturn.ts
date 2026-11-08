// AI-GENERATED — not an architecture reference
import { type RouteLocationRaw, type Router, useRouter } from 'vue-router'
import { useWalletStore } from '@/store/useWalletStore'

/**
 * How long a way back handed over waits for the send form: ten minutes, as the other handovers into
 * that form (usePassOnDraft). Taken later, it is let go.
 */
export const SEND_RETURN_HOLDS_MS = 10 * 60 * 1000

/**
 * What a window hands over: `to`, the path about to be opened (`/send/<community>/<member>`);
 * `back`, the address "Zurück" leads to from there.
 */
export type SendReturnHandover = { to: string; back: RouteLocationRaw }

type Held = SendReturnHandover & { owner: string | null; at: number }

/**
 * A one-shot handover from the three windows that open the send form with a member named -- the
 * contact window, the group window, the profile window of the map -- to the page of that form:
 * where its "Zurück" leads (E-043). From the form itself and after a transfer or a letter that went
 * out, back to what that window showed: the conversation, open on the contacts page
 * (`/contacts?with=…&community=…`) -- also where the window stood over another page, the overview
 * or the column (W5) --, the group (`/contacts?group=…`), the map as it was left
 * (`/matching/karte`, which opens the person's window again by itself). Those three know their
 * place; every other way into the form leaves by the browser's history (utils/backOrOverview).
 *
 * Bound to the path it was handed over for (`to`, as the router resolves it): the page takes it
 * only on that path. The form beside /send is patched, not rebuilt, when a contact is tapped in the
 * column, so the page takes it again at every change of its address (pages/Send.tsx).
 *
 * ⛔ In memory only, and read exactly once (the shape of usePassOnDraft):
 * - never into the address: a `?back=` would stay in the browser's history, through a reload and a
 *   sign-out, and lead a later visit of the form somewhere it did not come from;
 * - never into `history.state` (E-043, W4);
 * - never into the store, which is mirrored into the device's storage with every mutation.
 * A reload loses it, and "Zurück" goes by the browser's history then.
 *
 * ⛔ It belongs to the member who handed it over, and only for a while: signing out drops it
 * (`clearSendReturn`, store), it is handed out to that member only, and only for
 * SEND_RETURN_HOLDS_MS.
 */
let held: Held | null = null

/** Drops what is held, because the session it belonged to has ended. */
export function clearSendReturn() {
  held = null
}

/**
 * Whether `to` is the page at `path`, as the router reads both: the path alone, without the query
 * the form is opened with (`?art=send`).
 */
const samePath = (router: Router, to: string, path: string | null | undefined) => {
  if (!to || !path) {
    return false
  }
  try {
    return router.resolve(to).path === router.resolve(path).path
  } catch {
    return false
  }
}

export function useSendReturn() {
  const store = useWalletStore()
  const router = useRouter()

  return {
    /** @returns what was handed over, for `drop` */
    put({ to, back }: SendReturnHandover): Held {
      held = { to, back, owner: store.gradidoID, at: Date.now() }
      return held
    },

    /**
     * The way back for the page of the send form at `path` -- or null. Reads and clears in one go:
     * what is held goes to the member it came from, on the path it was handed over for, while it is
     * fresh; anything else is let go. A way back handed over for another path is a stale one.
     */
    take(path: string | null | undefined): RouteLocationRaw | null {
      const was = held
      held = null
      if (!was) {
        return null
      }
      const mine = Boolean(was.owner) && was.owner === store.gradidoID
      const fresh = Date.now() - was.at <= SEND_RETURN_HOLDS_MS
      return mine && fresh && samePath(router, was.to, path) ? was.back : null
    },

    /**
     * Takes back what `put` handed over, where the send form was never reached. Only its own: a
     * second tap may have handed over something newer in the meantime.
     */
    drop(handed: Held) {
      if (held === handed) {
        held = null
      }
    },
  }
}
