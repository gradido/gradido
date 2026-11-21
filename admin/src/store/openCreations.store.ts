// AI-GENERATED — not an architecture reference

import * as v from 'valibot'
import { HANDLED_FILTER, OPEN_STATES } from '@/data/Contribution.logic'
import { contributionCountSchema } from '@/data/Contribution.schema'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { graphqlRequest } from '@/graphql/client'
import { setOpenCreations } from './admin.store'

// the question last asked: the answer to an earlier one, coming later, does not set the badges
let lastAsked = 0

/**
 * Asks how many creations are open in "Meine Gruppen" (MG1), the resubmissions hidden -- what the
 * start page counts -- and sets the badges to it, where no later question was asked in the
 * meantime: a slow answer must not put back a count from before a save. Where it fails, the badges
 * keep what they showed.
 */
export const askOpenCreations = async () => {
  const asked = ++lastAsked
  const answer = await graphqlRequest(adminListContributionsCount, {
    filter: { statusFilter: OPEN_STATES, hideResubmission: true, creationGroup: HANDLED_FILTER },
  })
  if (answer.success && asked === lastAsked) {
    setOpenCreations(
      v.parse(contributionCountSchema, answer.value).adminListContributions.contributionCount,
    )
  }
}
