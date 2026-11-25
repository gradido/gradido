// AI-GENERATED — not an architecture reference
export const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
export const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'

/**
 * A token naming `sub`, written as the server writes one: base64url, without padding. It lasts
 * ten minutes (`exp - iat`), unless `more` says otherwise.
 */
export function tokenOf(sub: string | undefined, more = {}) {
  return `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub, iat: 0, exp: 600, ...more }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')}.signature`
}

/** A member as `login` answers, with `gradidoID`. */
export function member(gradidoID: string) {
  return {
    gradidoID,
    communityUuid: 'f1e2d3c4-b5a6-4978-8695-a4b3c2d1e0f9',
    alias: null,
    firstName: 'Bibi',
    lastName: 'Bloxberg',
    language: 'de',
    role: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    emailChecked: true,
    emailContact: null,
    klickTipp: null,
    avatar: null,
    avatarVisibleToMembers: null,
    creationAllowed: true,
    firstCreationStatus: null,
    transfersInChat: null,
    gmsAllowed: null,
    gmsPublishLocation: null,
    humhubAllowed: null,
    userLocation: null,
    hideAmountGDD: false,
    hideAmountGDT: false,
  }
}
