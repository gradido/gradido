import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import {
  buildSalutation,
  computeDiscrepancy,
  defaultSalutationFor,
  resolveEnteredHours,
  SALUTATION_UNCERTAIN_FLAG,
  SIGNATURE_PLACEHOLDER,
  sumActivityHours,
} from './deterministics'

/**
 * Layer-3 post-processing, shared by the live Anthropic client and the stub
 * preview (design docs `G` ch. 5-6, E-009 / E-012 / E-013). The CODE owns the
 * discrepancy flag and the salutation heuristic, so neither the recipient's nor the
 * moderator's name ever reaches the API.
 *
 * The [ANREDE] placeholder is left in the text and filled in the browser, the same
 * reactive pattern the signature already uses: the moderator can correct the salutation
 * and watch the draft follow immediately. What travels to the client is only what the
 * client cannot work out for itself - the name heuristic's result.
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

  // Hand the client the heuristic's salutation, which it uses whenever the moderator's
  // field is empty. An uncertain salutation is flagged for the moderator (E-005); once a
  // salutation is stored for this participant it wins and the flag stays away.
  evaluation.defaultSalutation = defaultSalutationFor(input.recipientFirstName)
  if (buildSalutation(input.recipientFirstName, input.salutation).uncertain) {
    evaluation.flags = [...(evaluation.flags ?? []), SALUTATION_UNCERTAIN_FLAG]
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
