import * as v from 'valibot'

export const HIERO_ACTIVE = v.nullish(
  v.boolean('Flag to indicate if the Hiero (Hedera Hashgraph Ledger) service is used.'),
  false,
)

export const HIERO_HEDERA_NETWORK = v.nullish(
  v.union([v.literal('mainnet'), v.literal('testnet'), v.literal('previewnet')]),
  'testnet',
)

export const HIERO_OPERATOR_ID = v.nullish(
  v.pipe(v.string('The operator ID for Hiero integration'), v.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/)),
  '0.0.2',
)

export const HIERO_OPERATOR_KEY = v.nullish(
  v.pipe(
    v.string('The operator key for Hiero integration, default is for local default node'),
    v.regex(/^[0-9a-fA-F]{64,96}$/),
  ),
  '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137',
)
