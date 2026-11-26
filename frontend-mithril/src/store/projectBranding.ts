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

/** Asks the server for the banner of `project`; without one, nothing is for a project. */
export async function askProjectBranding(project: string | undefined) {
  projectBranding.project = undefined
  projectBranding.banner = undefined
  if (!project) {
    return
  }
  projectBranding.asking = true
  const answer = await request(projectBrandingBanner, { project }, projectBrandingBannerSchema)
  projectBranding.asking = false
  if (answer.success) {
    projectBranding.project = project
    projectBranding.banner = answer.value.projectBrandingBanner
  }
}
