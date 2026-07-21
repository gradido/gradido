import { RIGHTS } from './RIGHTS'

// AI_SETTINGS is deliberately NOT here: switching Crea's model/effort applies globally to
// every moderator at once, so it stays an admin right (see ADMIN_RIGHTS and docu/crea,
// decision E-028). AI moderators inherit the effect, not the control.
export const MODERATOR_AI_RIGHTS = [RIGHTS.AI_SEND_MESSAGE]
