import { RIGHTS } from './RIGHTS'

// AI_SETTINGS is deliberately NOT here: switching Crea's model/effort applies globally to
// every moderator at once, so it stays an admin right (see ADMIN_RIGHTS and docu/crea,
// decision E-028). AI moderators inherit the effect, not the control.
// SET_USER_SALUTATION writes to another person's user record, so it gets its own right
// rather than riding along on AI_SEND_MESSAGE: the two answer different questions ("may
// I have Crea draft a reply?" vs. "may I change how this person is addressed?"), and only
// a separate right can be withdrawn without switching Crea off. It sits here because the
// salutation is set from Crea's evaluation window, where a wrong one is noticed.
export const MODERATOR_AI_RIGHTS = [RIGHTS.AI_SEND_MESSAGE, RIGHTS.SET_USER_SALUTATION]
