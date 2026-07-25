import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import {
  buildSalutation,
  computeDiscrepancy,
  resolveEnteredHours,
  SIGNATURE_PLACEHOLDER,
  sumActivityHours,
} from './deterministics'

/**
 * Resolves the salutation locally (E-012 — PII stays local): a salutation stored for
 * this participant wins, otherwise the first-name heuristic decides. Shared by the
 * full evaluation, the rewrite call, the batch call and the stub, so all paths
 * resolve it identically. Takes only the salutation fields (not the whole input) so
 * the batch input can reuse it. Also reports whether the salutation is uncertain, so
 * callers can flag it (E-005).
 *
 * The [ANREDE] placeholder itself is left in the text and filled in the browser, the
 * same reactive pattern the signature already uses: the moderator can correct the
 * salutation and watch the draft follow immediately. The recipient's name still never
 * reaches the API — it is only read here and in the client, never sent to the model.
 */
export function resolveSalutation(recipient: {
  recipientFirstName?: string | null
  salutation?: string | null
}): { salutation: string; uncertain: boolean } {
  return buildSalutation(recipient.recipientFirstName, recipient.salutation)
}

/**
 * Layer-3 post-processing, shared by the live Anthropic client and the stub
 * preview (design docs `G` ch. 5-6, E-009 / E-012 / E-013). The CODE owns the
 * discrepancy flag and resolves the salutation, so neither the recipient's nor the
 * moderator's name ever reaches the API. Both the [ANREDE] and the [SIGNATUR]
 * placeholder are filled in the browser, where the moderator can change either one
 * and see the draft follow.
 *
 * Mutates and returns the passed evaluation (always a freshly parsed/built
 * object, so in-place editing is safe).
 */
export function applyCreaDeterministics(
  input: CreaContributionInput,
  evaluation: CreaEvaluation,
): CreaEvaluation {
  // The code recomputes the authoritative discrepancy from Crea's extracted
  // activity hours vs. the entered hours and overwrites the model's proposal; a
  // divergence is flagged so the UI can surface it to the moderator (E-005).
  const enteredHours = resolveEnteredHours(input)
  const extractedHours = sumActivityHours(evaluation)
  const authoritative = computeDiscrepancy(extractedHours, enteredHours, input.memberStatus)
  if (authoritative !== evaluation.discrepancy) {
    evaluation.flags = [...(evaluation.flags ?? []), 'discrepancy_recomputed']
  }
  evaluation.discrepancy = authoritative

  // Resolve the salutation locally and hand it to the client, which fills [ANREDE]
  // reactively. An uncertain salutation is flagged for the moderator (E-005); once a
  // salutation is stored for this participant it wins and the flag stays away.
  const { salutation, uncertain } = resolveSalutation(input)
  evaluation.salutation = salutation
  if (uncertain) {
    evaluation.flags = [...(evaluation.flags ?? []), 'anrede_unsicher']
  }

  // Fill [SIGNATUR] with the moderator's own greeting (E-013). Left in place when
  // unset so the moderator notices and configures it.
  if (input.moderatorSignature) {
    evaluation.responseText = evaluation.responseText
      .split(SIGNATURE_PLACEHOLDER)
      .join(input.moderatorSignature)
  }
  return evaluation
}
