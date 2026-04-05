export class FederationVoteFailedError extends Error {
  constructor(details?: string) {
    super(`Federation vote failed.${details ? ' Details: ' + details : ''}`)
  }
}