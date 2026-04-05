export class FederationSettlementFailedError extends Error {
  constructor(details?: string) {
    super(`Federation settlement failed.${details ? ' Details: ' + details : ''}`)
  }
}