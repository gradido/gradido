// AI-GENERATED — not an architecture reference

import * as v from 'valibot'
import { HANDLED_FILTER, OPEN_STATES } from '@/data/Contribution.logic'
import { contributionCountSchema } from '@/data/Contribution.schema'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { graphqlRequest } from '@/graphql/client'
import { setOpenCreations } from './admin.store'

// The question about the badges' count asked last -- by any page (MG1): an earlier one's answer,
// arriving later, does not set them. A slow start page must not put back a count from before a save.
let lastAsked = 0

/** A question whose answer is to set the badges goes out: the mark to set them with. */
export const askingOpenCreations = () => ++lastAsked

/** Sets the badges to the count answered, where no later question went out after it was asked. */
export const answerOpenCreations = (asked: number, count: number) => {
  if (asked === lastAsked) {
    setOpenCreations(count)
  }
}

/**
 * Asks how many creations are open in "Meine Gruppen" (MG1), the resubmissions hidden -- what the
 * start page counts -- and sets the badges to it, where no later question was asked in the
 * meantime. Where it fails, the badges keep what they showed.
 */
export const askOpenCreations = async () => {
  const asked = askingOpenCreations()
  const answer = await graphqlRequest(adminListContributionsCount, {
    filter: { statusFilter: OPEN_STATES, hideResubmission: true, creationGroup: HANDLED_FILTER },
  })
  if (answer.success) {
    answerOpenCreations(
      asked,
      v.parse(contributionCountSchema, answer.value).adminListContributions.contributionCount,
    )
  }
}
