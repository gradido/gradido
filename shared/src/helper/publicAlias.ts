// AI-GENERATED — not an architecture reference

import { ALIAS_MIN_CHARS } from '../schema/user.schema'

/**
 * What a member may be called in front of anybody else (NU-018/NU-024): their alias,
 * and without a usable one their FULL gradidoID. Never a real name, and never empty.
 *
 * ⛔ This lives in `shared` because THREE packages have to agree on it and none of them
 * can import the others' copy: the backend answers the wallet with it, `core` writes it
 * into the mails a third party reads (KLAR-08), and the federation carries it across a
 * community border. A second copy anywhere is the bug this file exists to prevent --
 * the last time this rule was written out per call site, one of the five had quietly
 * drifted to a bare `alias || gradidoID`.
 *
 * `ALIAS_MIN_CHARS`, not mere truthiness: a stored alias of one or two characters
 * predates the rule and is not one, so it falls back to the identifier like an absent
 * one does. `backend`'s `PublishNameLogic.getPublicAlias()` delegates here rather than
 * repeating it.
 *
 * The gradidoID is handed out in FULL on purpose -- `findUserByIdentifier` resolves a
 * UUID as readily as an alias, so it is a working address rather than a placeholder,
 * and a shortened one would only be decoration.
 *
 * Exempt from Result on purpose: every input produces an answer, there is no failure
 * to model.
 */
export const publicAlias = (
  alias: string | null | undefined,
  gradidoID: string | null | undefined,
): string => (alias && alias.length >= ALIAS_MIN_CHARS ? alias : (gradidoID ?? ''))
