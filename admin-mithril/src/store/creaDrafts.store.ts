// AI-GENERATED — not an architecture reference

// What Crea proposed last, kept on this device clipboard-style: the reply draft, the model that
// wrote it, and the public note for the contribution text. Crea's window writes them; the form of
// an open contribution takes them in with one click. Beside them the moderator's signature, which
// lives only here: it is filled into the draft, so the name never reaches the server. The keys of
// the old admin, kept.
const KEYS = {
  draft: 'crea.lastResponse',
  model: 'crea.lastResponseModel',
  note: 'crea.lastSupplement',
  signature: 'crea.moderatorSignature',
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode and the like: it holds for this visit only where it is read anew
  }
}

/** The last reply draft and the model that wrote it; '' for none. */
export const creaDraft = () => ({ text: read(KEYS.draft), model: read(KEYS.model) })

/** Keeps a reply draft with the model that wrote it. */
export const keepCreaDraft = (text: string, model: string) => {
  write(KEYS.draft, text)
  write(KEYS.model, model)
}

/** The last public note for a contribution text; '' for none. */
export const creaNote = () => read(KEYS.note)

export const keepCreaNote = (note: string) => write(KEYS.note, note)

/** The moderator's signature on this device; '' for none. */
export const creaSignature = () => read(KEYS.signature)

export const keepCreaSignature = (signature: string) => write(KEYS.signature, signature)
