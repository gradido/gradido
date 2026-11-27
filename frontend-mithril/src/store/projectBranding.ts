// AI-GENERATED — not an architecture reference
import { projectBrandingBannerSchema } from '@/data/ProjectBranding.schema'
import { projectBrandingBanner } from '@/graphql/account'
import { Resource } from './Resource'

/**
 * The banner of the project a sign-in or a registration is for: the frame around the page asks
 * for it, and the page sends the project's name along once the server knew it. A name the
 * server does not know is no project.
 */
export const projectBranding = new Resource(projectBrandingBanner, projectBrandingBannerSchema)

/** The project of the address (`?project=`); one without a name is none. */
export const projectOfAddress = () =>
  new URLSearchParams(location.search).get('project') || undefined

/** The project of the address, once the server said it knows it: what a sign-in sends along. */
export async function knownProject() {
  const project = projectOfAddress()
  if (!project) {
    return null
  }
  await projectBranding.ensureLoaded(undefined, { project })
  return projectBranding.value ? project : null
}
