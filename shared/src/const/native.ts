import { getDecayRespiteCent, getDecayStartTime } from 'shared-native'

// decay
export const DECAY_START_TIME = getDecayStartTime()

/**
 * The tolerance buffer for balance validation and decay calculations, expressed in GradidoCent.
 *
 * This constant accounts for rounding errors, timestamp discrepancies (e.g., Hedera consensus delay),
 * and natural imprecision in continuous decay calculations. It ensures that micro‑transactions are not
 * incorrectly rejected due to mathematical drift, reflecting Gradido's principle of generosity.
 *
 * 100 GradidoCent = 0.01 GDD
 *
 * @constant {number} GRADIDO_DECAY_RESPITE_CENT
 */
export const DECAY_RESPITE_CENT = getDecayRespiteCent()
