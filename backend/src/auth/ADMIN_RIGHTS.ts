import { RIGHTS } from './RIGHTS'

export const ADMIN_RIGHTS = [
  // Starting-balance links hand out newly created Gradido, so only administrators may set
  // them up. Reading the list stays with everyone (LIST_CONTRIBUTION_LINKS in USER_RIGHTS):
  // a moderator can look a link up and pass it on, they just cannot change or remove it.
  RIGHTS.CREATE_CONTRIBUTION_LINK,
  RIGHTS.UPDATE_CONTRIBUTION_LINK,
  RIGHTS.DELETE_CONTRIBUTION_LINK,
  RIGHTS.SET_USER_ROLE,
  RIGHTS.DELETE_USER,
  RIGHTS.UNDELETE_USER,
  RIGHTS.COMMUNITY_UPDATE,
  RIGHTS.COMMUNITY_WITH_API_KEYS,
  RIGHTS.PROJECT_BRANDING_MUTATE,
  RIGHTS.AI_SETTINGS,
]
