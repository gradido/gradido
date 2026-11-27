// AI-GENERATED — not an architecture reference
import { projectBrandingBannerSchema } from '@/data/ProjectBranding.schema'
import { projectBrandingBanner } from '@/graphql/account'
import { request } from '@/graphql/client'

/**
 * The project a sign-in or a registration is for (`?project=` in the address): the frame
 * around the page asks for its banner, and the page sends its name along -- once the server
 * knew it. A name the server does not know is no project.
 */
export const projectBranding: { project?: string; banner?: string | null; asking: boolean } = {
  asking: false,
}

// the lookup asked last: an earlier one that answers after it says nothing any more
let latest: Promise<void> = Promise.resolve()

/** Asks the server for the banner of `project`; without one, nothing is for a project. */
export function askProjectBranding(project: string | undefined) {
  projectBranding.project = undefined
  projectBranding.banner = undefined
  projectBranding.asking = project !== undefined
  const lookup: Promise<void> = project
    ? request(projectBrandingBanner, { project }, projectBrandingBannerSchema).then((answer) => {
        if (lookup !== latest) {
          return
        }
        projectBranding.asking = false
        if (answer.success) {
          projectBranding.project = project
          projectBranding.banner = answer.value.projectBrandingBanner
        }
      })
    : Promise.resolve()
  latest = lookup
  return lookup
}

/** Settles once the project asked for last is known: a sign-in sent before would go without it. */
export const projectBrandingKnown = () => latest
