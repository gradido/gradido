// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

const creationGroup = gql`
  fragment creationGroup on CreationGroup {
    id
    tag
    name
  }
`

/** Every group: what the field of a contribution offers. */
export const creationGroups = gql`
  query {
    creationGroups {
      ...creationGroup
    }
  }
  ${creationGroup}
`

/** The groups the community's list has something to show for: its filter. */
export const communityCreationGroups = gql`
  query {
    communityCreationGroups {
      ...creationGroup
    }
  }
  ${creationGroup}
`

/** The groups the member's own list has something to show for: its filter. */
export const myContributionCreationGroups = gql`
  query {
    myContributionCreationGroups {
      ...creationGroup
    }
  }
  ${creationGroup}
`

/** What the field of a contribution starts with: the member's last choice, null for none. */
export const suggestedCreationGroup = gql`
  query {
    suggestedCreationGroup {
      ...creationGroup
    }
  }
  ${creationGroup}
`
