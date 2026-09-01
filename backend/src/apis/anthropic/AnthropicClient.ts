// AI-GENERATED — not an architecture reference
import Anthropic from '@anthropic-ai/sdk'
import { getLogger } from 'log4js'
import { DomainError } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import type { CreaBatchInput } from '@/graphql/input/CreaBatchInput'
import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaBatchEvaluation } from '@/graphql/model/CreaBatchEvaluation'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import type { CreaRewriteResult } from '@/graphql/model/CreaRewriteResult'
import type { CreaChatTurn } from './crea/chatThreads'
import {
  buildSalutation,
  defaultSalutationFor,
  resolveEnteredGdd,
  resolveEnteredHours,
  SALUTATION_PLACEHOLDER,
  SALUTATION_UNCERTAIN_FLAG,
  SIGNATURE_PLACEHOLDER,
} from './crea/deterministics'
import { CREA_BATCH_SCHEMA, CREA_OUTPUT_SCHEMA, CREA_REWRITE_SCHEMA } from './crea/outputSchema'
import { applyCreaDeterministics } from './crea/postprocess'
import {
  buildCreaChatSystemPrompt,
  buildCreaSystemPrompt,
  moderatorDecisionLabel,
} from './crea/ruleset'
import { type CreaEffort, resolveCreaModelParams } from './crea/settings'
import {
  KEYING_INSTRUCTION,
  KEYING_SCHEMA,
  type KeyableEntry,
  type KeyingAnswer,
  type KeyingAnswerRecord,
  keyingUserMessage,
  vocabularyAppendix,
} from './matching/instruction'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.anthropic.AnthropicClient`)

// Fast mode runs the same model with faster output at premium pricing. It rides the
// beta messages endpoint and is only available on some models (Opus tier), so a
// request naming an unsupported model is rejected. Rather than pin a model list in
// code - the admin model field is deliberately free text so new models work without a
// release - we ask for fast mode and fall back to a normal call when the API says no.
const FAST_MODE_BETA = 'fast-mode-2026-02-01'

/**
 * The model that keys matching entries, named here rather than taken from the
 * settings - and both halves of that are decisions rather than shortcuts.
 *
 * Haiku, because keying is a mechanical job on one short sentence and this is the
 * model the whole matching behaviour was measured on: 89 % of 588 offer/need pairs
 * found when the two halves arrive months apart, at 0,60-0,89 $ per 735 entries.
 *
 * Not the model an admin picks for Crea, and that is the important half. Crea's
 * output is a text for one human to read, so a different model there means different
 * wording and that is the community's business. The output here is a shared
 * vocabulary: two communities on two models would coin two words for one thing, and
 * their members would stop finding each other. One model for everyone until somebody
 * has measured how far two of them agree.
 */
const KEYING_MODEL = 'claude-haiku-4-5'

/** Room for a full batch's answer. The measurement used the same number. */
const KEYING_MAX_TOKENS = 8000

/**
 * Crea's answer was cut off at max_tokens. It gets its own class so a caller can tell
 * the moderator the one thing that helps — paste less at a time — instead of passing on
 * the message below, which is written in a language the backend did not get to choose.
 *
 * The two token counts are kept as fields rather than folded into a string: the message
 * is for the log, the numbers are what a caller would act on if it ever wants to raise
 * the limit instead of asking the moderator to paste less.
 */
export class CreaTruncatedError extends DomainError {
  constructor(
    public readonly maxTokens: number,
    public readonly outputTokens: number,
  ) {
    super(`crea output truncated at max_tokens=${maxTokens} (output=${outputTokens})`)
  }
}

/**
 * True when the API refused specifically because of fast mode: either the model does
 * not support it (400 naming speed/fast) or the separate fast-mode rate limit is
 * exhausted (429). Any other error is a real failure and must not trigger a silent
 * retry - that would hide the cause and pay for a second call.
 */
function isFastModeRejection(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) {
    return true
  }
  if (!(error instanceof Anthropic.BadRequestError)) {
    return false
  }
  const message = String(error.message).toLowerCase()
  return message.includes('speed') || message.includes('fast')
}

// TODO: use i18n for prompts in the future so the ai didn't need to translate by non-german moderators which can maybe reduce the accuracy

/**
 * Why fast mode was refused, as a code the admin renders in its own language. Never
 * claim a cause we have not checked: fast mode has its own rate limit, so a 429 means
 * "busy right now" rather than "this model cannot do it". Guessing "not available for
 * this model" would send an admin off changing the model to fix something the model is
 * not responsible for.
 */
function fastModeRefusalCode(error: unknown): 'rate_limited' | 'refused' {
  return error instanceof Anthropic.RateLimitError ? 'rate_limited' : 'refused'
}

/**
 * Singleton client for the Anthropic (Claude) API, used by the Crea moderation
 * assistant — both when judging a single contribution and in CreaChat. Stays
 * disabled unless the API is active and a key is configured.
 */
export class AnthropicClient {
  private static instance: AnthropicClient

  private anthropic: Anthropic

  private constructor() {
    this.anthropic = new Anthropic({ apiKey: CONFIG.ANTHROPIC_API_KEY })
  }

  public static getInstance(): AnthropicClient | undefined {
    if (!CONFIG.ANTHROPIC_ACTIVE || !CONFIG.ANTHROPIC_API_KEY) {
      logger.info('anthropic is disabled via config...')
      return
    }
    if (!AnthropicClient.instance) {
      AnthropicClient.instance = new AnthropicClient()
    }
    return AnthropicClient.instance
  }

  /**
   * Evaluates a single contribution with Crea and returns the validated
   * structured result. The rules (design docs E/G/D) are sent as a cached
   * system prefix; the contribution and the deterministic code facts follow as
   * the user message. Thin slice (DO-1): one contribution, no history, no
   * persistence yet.
   */
  public async evaluateContribution(input: CreaContributionInput): Promise<CreaEvaluation> {
    const params = await resolveCreaModelParams()
    const message = await this.createMessage(
      {
        model: params.model,
        max_tokens: params.maxTokens,
        // Effort 'disabled' keeps thinking off (the lean single-JSON default); any level
        // switches on adaptive thinking and raises max_tokens for the reasoning that
        // precedes the JSON. Model + effort come from the admin settings (DO-4).
        thinking: params.thinking,
        system: [
          {
            type: 'text',
            text: buildCreaSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: this.buildUserMessage(input) }],
        output_config: params.effort
          ? { effort: params.effort, format: { type: 'json_schema', schema: CREA_OUTPUT_SCHEMA } }
          : { format: { type: 'json_schema', schema: CREA_OUTPUT_SCHEMA } },
      },
      params.fastMode,
    )

    logger.info(
      `crea usage: input=${message.usage.input_tokens} cacheRead=${message.usage.cache_read_input_tokens} cacheWrite=${message.usage.cache_creation_input_tokens} output=${message.usage.output_tokens}`,
    )

    this.assertNotTruncated(message, params.maxTokens)
    const evaluation = JSON.parse(this.firstTextBlock(message)) as CreaEvaluation
    // Layer-3 post-processing (authoritative discrepancy + the locally resolved
    // salutation) is shared with the stub preview so both paths behave identically
    // (E-012 / E-013). Both placeholders travel on to the client, which fills them.
    return applyCreaDeterministics(input, evaluation)
  }

  /**
   * Rewrites the reply text when the moderator deviates from Crea's own
   * recommendation (E-017). This is NOT a second evaluation: the moderator's
   * target decision and optional context steer a fresh responseText for that
   * outcome. A confirm rewrite additionally yields memoSupplement (E-019) — the
   * short public note appended to the contribution. Uses the slim rewrite schema,
   * so "deny" stays out of the verdict enum and output stays cheap. The cached
   * rules prefix is reused (cache read), so only the small output is billed anew.
   * No persistence.
   */
  public async rewriteResponse(input: CreaContributionInput): Promise<CreaRewriteResult> {
    const params = await resolveCreaModelParams()
    const message = await this.createMessage(
      {
        model: params.model,
        max_tokens: params.maxTokens,
        thinking: params.thinking,
        system: [
          {
            type: 'text',
            text: buildCreaSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: this.buildRewriteUserMessage(input) }],
        output_config: params.effort
          ? { effort: params.effort, format: { type: 'json_schema', schema: CREA_REWRITE_SCHEMA } }
          : { format: { type: 'json_schema', schema: CREA_REWRITE_SCHEMA } },
      },
      params.fastMode,
    )

    logger.info(
      `crea rewrite usage: input=${message.usage.input_tokens} cacheRead=${message.usage.cache_read_input_tokens} output=${message.usage.output_tokens}`,
    )

    this.assertNotTruncated(message, params.maxTokens)
    const parsed = JSON.parse(this.firstTextBlock(message)) as {
      responseText: string
      memoSupplement?: string | null
    }
    // [ANREDE] and [SIGNATUR] both stay for the client to fill reactively (E-013 /
    // E-014), so the salutation the moderator just corrected carries over into the
    // rewritten reply. No discrepancy recompute: the rewrite does not re-judge, it
    // only reformulates for the chosen outcome. memoSupplement is the plain note only
    // — the 💬 marker + moderator first name are added locally by the client, so that
    // name never reaches the API either.
    return {
      responseText: parsed.responseText,
      memoSupplement: parsed.memoSupplement?.trim() || null,
    }
  }

  /**
   * Evaluates several open contributions of ONE participant together (E-020) and
   * returns a slim result: ONE overall verdict + ONE reply for all of them, so the
   * participant gets a single message instead of many identical mails. Batch mode is
   * lean - no per-activity records, no per-contribution discrepancy (like the old
   * copy-paste flow). Reuses the cached rules prefix; the salutation is resolved
   * locally and both placeholders are left for the client (E-012 / E-014).
   */
  public async evaluateBatch(input: CreaBatchInput): Promise<CreaBatchEvaluation> {
    const params = await resolveCreaModelParams()
    const message = await this.createMessage(
      {
        model: params.model,
        max_tokens: params.maxTokens,
        thinking: params.thinking,
        system: [
          {
            type: 'text',
            text: buildCreaSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: this.buildBatchUserMessage(input) }],
        output_config: params.effort
          ? { effort: params.effort, format: { type: 'json_schema', schema: CREA_BATCH_SCHEMA } }
          : { format: { type: 'json_schema', schema: CREA_BATCH_SCHEMA } },
      },
      params.fastMode,
    )

    logger.info(
      `crea batch usage: input=${message.usage.input_tokens} cacheRead=${message.usage.cache_read_input_tokens} output=${message.usage.output_tokens}`,
    )

    this.assertNotTruncated(message, params.maxTokens)
    const parsed = JSON.parse(this.firstTextBlock(message)) as Omit<CreaBatchEvaluation, 'flags'>
    // Work the salutation out locally (PII stays local); [ANREDE] and [SIGNATUR] stay
    // for the client to fill reactively (E-013 / E-014). No discrepancy recompute:
    // batch mode carries no per-activity hours, so there is nothing to check the
    // entered hours against.
    const { uncertain } = buildSalutation(input.recipientFirstName, input.salutation)
    return {
      ...parsed,
      defaultSalutation: defaultSalutationFor(input.recipientFirstName),
      flags: uncertain ? [SALUTATION_UNCERTAIN_FLAG] : [],
    }
  }

  /**
   * Rewrites the joint reply when the moderator deviates from Crea's overall batch
   * recommendation (E-017 applied to E-020): the target decision + optional context
   * steer ONE fresh reply text for all contributions. Like the single rewrite it does
   * NOT re-judge, uses the slim rewrite schema and reuses the cached rules prefix. On a
   * confirm deviation it also carries memoSupplement (E-019), which the moderator appends
   * to one of the contributions via "Text ergaenzen".
   */
  public async rewriteBatch(input: CreaBatchInput): Promise<CreaRewriteResult> {
    const params = await resolveCreaModelParams()
    const message = await this.createMessage(
      {
        model: params.model,
        max_tokens: params.maxTokens,
        thinking: params.thinking,
        system: [
          {
            type: 'text',
            text: buildCreaSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: this.buildBatchRewriteUserMessage(input) }],
        output_config: params.effort
          ? { effort: params.effort, format: { type: 'json_schema', schema: CREA_REWRITE_SCHEMA } }
          : { format: { type: 'json_schema', schema: CREA_REWRITE_SCHEMA } },
      },
      params.fastMode,
    )

    logger.info(
      `crea batch rewrite usage: input=${message.usage.input_tokens} cacheRead=${message.usage.cache_read_input_tokens} output=${message.usage.output_tokens}`,
    )

    this.assertNotTruncated(message, params.maxTokens)
    const parsed = JSON.parse(this.firstTextBlock(message)) as {
      responseText: string
      memoSupplement?: string | null
    }
    // [ANREDE] and [SIGNATUR] both stay for the client to fill. On a confirm deviation
    // Crea also drafts the public memo note (E-019); the moderator appends it to ONE of
    // the contributions via "Text ergaenzen". The 💬 marker + first name are added
    // client-side.
    return {
      responseText: parsed.responseText,
      memoSupplement: parsed.memoSupplement?.trim() || null,
    }
  }

  /**
   * CreaChat: one turn of the moderator's running exchange in the admin chat window.
   *
   * Unlike the evaluation calls this returns plain text, not JSON — the moderator
   * copies the answer straight into his reply to the participant. The Messages API is
   * stateless, so the caller passes the whole conversation so far and it travels with
   * the request; only the rules prefix is cached, which is the part that repeats
   * unchanged. Model, effort and fast mode come from the same admin settings as every
   * other Crea call.
   */
  public async chatWithCrea(history: CreaChatTurn[], userMessage: string): Promise<string> {
    const params = await resolveCreaModelParams()
    const message = await this.createMessage(
      {
        model: params.model,
        max_tokens: params.maxTokens,
        thinking: params.thinking,
        system: [
          {
            type: 'text',
            text: buildCreaChatSystemPrompt(),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          ...history.map((turn) => ({ role: turn.role, content: turn.content })),
          { role: 'user' as const, content: userMessage },
        ],
        // No output_config.format here: a chat answer is prose, not a schema.
        ...(params.effort ? { output_config: { effort: params.effort } } : {}),
      },
      params.fastMode,
    )

    logger.info(
      `creachat usage: turns=${history.length} input=${message.usage.input_tokens} cacheRead=${message.usage.cache_read_input_tokens} cacheWrite=${message.usage.cache_creation_input_tokens} output=${message.usage.output_tokens}`,
    )

    // A cut-off answer would be copied into a mail to a participant mid-sentence, so
    // treat it as a failure rather than handing the moderator half a reply.
    this.assertNotTruncated(message, params.maxTokens)
    return this.firstTextBlock(message)
  }

  /**
   * A cheap probe for the admin "test model" button (DO-4): verifies the given model
   * (and effort) actually answers. Returns a short outcome instead of throwing so the
   * UI can toast it. Runs on the shared client (needs the key active).
   */
  public async probeModel(
    model: string,
    effort: CreaEffort,
    fastMode: boolean,
  ): Promise<{
    ok: boolean
    code: string
    message: string
    fastMode: string
    fastModeDetail: string
  }> {
    const body: Anthropic.MessageCreateParamsNonStreaming =
      effort === 'disabled'
        ? {
            model,
            max_tokens: 64,
            thinking: { type: 'disabled' },
            messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          }
        : {
            model,
            max_tokens: 4096,
            thinking: { type: 'adaptive' },
            output_config: { effort },
            messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          }

    // With fast mode requested, probe it explicitly and report a downgrade rather than
    // hiding it, so the admin learns before saving that this model answers normally but
    // not in fast mode - and, from the API's own wording, why.
    const failed = (error: unknown) => ({
      ok: false,
      code: 'error',
      message: error instanceof Error ? error.message : String(error),
      fastMode: 'off',
      fastModeDetail: '',
    })

    let fastModeOutcome = 'off'
    let fastModeDetail = ''
    if (fastMode) {
      try {
        const message = await this.anthropic.beta.messages.create({
          ...body,
          speed: 'fast',
          betas: [FAST_MODE_BETA],
        })
        return {
          ok: true,
          code: 'ok',
          message: this.probeText(message),
          fastMode: 'active',
          fastModeDetail: '',
        }
      } catch (error) {
        if (!isFastModeRejection(error)) {
          return failed(error)
        }
        fastModeOutcome = fastModeRefusalCode(error)
        fastModeDetail = error instanceof Error ? error.message : String(error)
      }
    }

    try {
      const message = await this.anthropic.messages.create(body)
      return {
        ok: true,
        code: 'ok',
        message: this.probeText(message),
        fastMode: fastModeOutcome,
        fastModeDetail,
      }
    } catch (error) {
      return failed(error)
    }
  }

  /**
   * Works out a batch of matching entries: for each one, the words it can be found
   * under and seven fields saying what it is about.
   *
   * The vocabulary is handed in rather than fetched here, because what makes the whole
   * mechanism work is that it is CURRENT - a word another community coined has to be
   * in this list, or this entry coins a second word for the same thing and the two
   * members never meet. Keeping it current is the keying run's job; this method passes
   * it on unchanged.
   *
   * Several entries per call, because that is what the numbers come from and because
   * of what the list costs: the instruction is around a thousand tokens and the
   * vocabulary was 8000 after 739 entries, so a call carries that whether it works out
   * one entry or ten. Ten at a time is the difference between the ~11 $ per ten
   * thousand entries the plan budgeted and roughly eight times that.
   *
   * The price of a batch is that its ten entries share one vocabulary snapshot, so a
   * word coined by the first cannot reach the second. That is exactly how the 89 %
   * was measured, and it is also not the live case: entries arrive one at a time, so
   * a batch only fills up when there is a backlog - a new community, or a re-keying.
   *
   * Records come back keyed by `nr`, which is the number each entry was given in the
   * message. A record with no usable `nr` is dropped rather than guessed at: matching
   * by position would hand one member's words to another member's entry the moment
   * the model returns nine records for ten entries. A dropped one costs nothing - its
   * entry keeps no keying and the next pass picks it up again.
   */
  public async keyMatchingEntries(
    entries: readonly KeyableEntry[],
    vocabulary: readonly string[],
  ): Promise<Map<number, KeyingAnswerRecord>> {
    const message = await this.createMessage(
      {
        model: KEYING_MODEL,
        max_tokens: KEYING_MAX_TOKENS,
        // One string, instruction and vocabulary together, because that is the shape
        // that was measured. It also means no prompt cache: the vocabulary grows, so
        // the prefix changes. That cost is the one the plan budgeted - it is not an
        // oversight to be fixed by splitting the two apart without measuring again.
        system: KEYING_INSTRUCTION + vocabularyAppendix(vocabulary),
        messages: [{ role: 'user', content: keyingUserMessage(entries) }],
        output_config: { format: { type: 'json_schema', schema: KEYING_SCHEMA } },
      },
      // Fast mode is a premium price for a faster answer, and nobody is waiting for
      // this one: the member's save button returned long ago.
      false,
    )

    logger.info(
      `matching keying usage: entries=${entries.length} input=${message.usage.input_tokens} output=${message.usage.output_tokens}`,
    )
    this.assertNotTruncated(message, KEYING_MAX_TOKENS)

    const answer = JSON.parse(this.firstTextBlock(message)) as KeyingAnswer
    const byIndex = new Map<number, KeyingAnswerRecord>()
    for (const record of answer.eintraege ?? []) {
      const index = (record.nr ?? 0) - 1
      if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
        logger.warn(`matching keying: record with unusable nr ${record.nr}, dropped`)
        continue
      }
      if (byIndex.has(index)) {
        logger.warn(`matching keying: two records claim entry ${record.nr}, keeping the first`)
        continue
      }
      byIndex.set(index, record)
    }
    if (byIndex.size !== entries.length) {
      // Not an error: what is missing simply stays unkeyed and comes round again.
      logger.warn(`matching keying: ${byIndex.size} records for ${entries.length} entries`)
    }
    return byIndex
  }

  // Structural on purpose: the probe reads the same text block from either the normal
  // or the beta (fast mode) response, whose block unions are separate TypeScript types.
  private probeText(message: { content: Array<{ type: string; text?: string }> }): string {
    const block = message.content.find((content) => content.type === 'text')
    return block?.text?.trim() ?? ''
  }

  /**
   * Sends one Crea request, honouring the admin's fast-mode setting. With fast mode off
   * this is the plain messages call. With it on we use the beta endpoint and, if the API
   * rejects fast mode for this model (or its separate rate limit is exhausted), retry the
   * same request at normal speed so Crea keeps working instead of failing outright.
   */
  private async createMessage(
    body: Anthropic.MessageCreateParamsNonStreaming,
    fastMode: boolean,
  ): Promise<Anthropic.Message> {
    if (!fastMode) {
      return this.anthropic.messages.create(body)
    }
    try {
      const message = await this.anthropic.beta.messages.create({
        ...body,
        speed: 'fast',
        betas: [FAST_MODE_BETA],
      })
      // The beta response carries the same fields Crea reads (content, usage,
      // stop_reason); only the TypeScript type differs.
      return message as Anthropic.Message
    } catch (error) {
      if (!isFastModeRejection(error)) {
        throw error
      }
      logger.warn(
        `crea fast mode refused for model ${body.model} (${
          error instanceof Error ? error.message : String(error)
        }); retrying at normal speed`,
      )
      return this.anthropic.messages.create(body)
    }
  }

  // A truncated response (max_tokens hit) leaves incomplete JSON, which would fail as a
  // cryptic parse error. Catch it explicitly so the log names the cause and the moderator
  // gets a clear message rather than a JSON crash.
  private assertNotTruncated(message: Anthropic.Message, maxTokens: number): void {
    if (message.stop_reason === 'max_tokens') {
      const error = new CreaTruncatedError(maxTokens, message.usage.output_tokens)
      logger.error(error.message)
      throw error
    }
  }

  private firstTextBlock(message: Anthropic.Message): string {
    const block = message.content.find((content) => content.type === 'text')
    if (!block || block.type !== 'text') {
      logger.error('no text block in anthropic response', message.content)
      throw new Error('Crea returned no structured result')
    }
    return block.text
  }

  private buildUserMessage(input: CreaContributionInput): string {
    return [
      '## Aktuell zu bewerten (ein Beitrag)',
      '',
      input.text,
      '',
      ...this.systemFacts(input),
    ].join('\n')
  }

  /**
   * Rewrite prompt (E-017): same contribution + system facts, plus the moderator's
   * target decision and optional context. Crea reformulates only the reply text
   * for that outcome (rule chapter 11); it does not re-evaluate.
   */
  private buildRewriteUserMessage(input: CreaContributionInput): string {
    const lines: string[] = [
      '## Beitrag (unveraendert)',
      '',
      input.text,
      '',
      ...this.systemFacts(input),
      '',
      '## Moderator-Vorgabe (weicht von Deiner Empfehlung ab)',
      `- Zielentscheidung: ${moderatorDecisionLabel(input.moderatorDecision)}`,
    ]
    if (input.moderatorContext?.trim()) {
      lines.push(
        `- Zusatzinfo des Moderators (wahr, er kennt den Fall): ${input.moderatorContext.trim()}`,
      )
    }
    lines.push(
      '- Schreibe NUR den neuen Antwortvorschlag fuer diese Zielentscheidung; bewerte nicht neu.',
    )
    return lines.join('\n')
  }

  /**
   * Batch prompt (E-020): several contributions of the same participant as separately
   * labelled blocks, with the instruction to form ONE overall verdict and ONE reply.
   * The batch instruction goes into the USER message (not the cached system prefix) so
   * the cached rules prefix stays byte-identical and keeps hitting the cache.
   */
  private buildBatchUserMessage(input: CreaBatchInput): string {
    const lines: string[] = [
      '## Mehrere Beitraege desselben Teilnehmers (Sammel-Bewertung)',
      'Es folgen mehrere Beitraege DERSELBEN Person. Bilde EIN Gesamturteil und schreibe EINE Antwort, die alle Beitraege gemeinsam wuerdigt (nicht je Beitrag getrennt). Beziehe Dich, wo hilfreich, auf einzelne Beitraege. Faellt ein einzelner Beitrag aus der Reihe, sprich ihn in der Antwort an.',
      '',
    ]
    input.contributions.forEach((contribution, index) => {
      const meta: string[] = []
      if (contribution.date) {
        meta.push(contribution.date)
      }
      if (contribution.enteredGdd != null) {
        meta.push(`${contribution.enteredGdd} GDD`)
      }
      const heading = `### Beitrag ${index + 1}${meta.length ? ` (${meta.join(', ')})` : ''}`
      lines.push(heading, contribution.text, '')
    })
    lines.push(
      '## Fakten aus dem System',
      `- Anrede: mit dem Platzhalter ${SALUTATION_PLACEHOLDER} beginnen (der Code fuellt den Namen lokal ein)`,
      `- Grussformel: mit dem Platzhalter ${SIGNATURE_PLACEHOLDER} abschliessen (der Code fuellt die Moderator-Signatur lokal ein)`,
      `- Eingestellte Software-Sprache (fuer reasoning): ${input.uiLanguage ?? 'de'}`,
    )
    return lines.join('\n')
  }

  /**
   * Batch rewrite prompt (E-020): the same contributions plus the moderator's target
   * decision and optional context. Crea reformulates ONE joint reply for that outcome;
   * it does not re-evaluate.
   */
  private buildBatchRewriteUserMessage(input: CreaBatchInput): string {
    const lines: string[] = ['## Mehrere Beitraege desselben Teilnehmers (unveraendert)', '']
    input.contributions.forEach((contribution, index) => {
      const meta: string[] = []
      if (contribution.date) {
        meta.push(contribution.date)
      }
      if (contribution.enteredGdd != null) {
        meta.push(`${contribution.enteredGdd} GDD`)
      }
      const heading = `### Beitrag ${index + 1}${meta.length ? ` (${meta.join(', ')})` : ''}`
      lines.push(heading, contribution.text, '')
    })
    lines.push(
      '## Fakten aus dem System',
      `- Anrede: mit dem Platzhalter ${SALUTATION_PLACEHOLDER} beginnen (der Code fuellt den Namen lokal ein)`,
      `- Grussformel: mit dem Platzhalter ${SIGNATURE_PLACEHOLDER} abschliessen (der Code fuellt die Moderator-Signatur lokal ein)`,
      `- Eingestellte Software-Sprache (fuer reasoning): ${input.uiLanguage ?? 'de'}`,
      '',
      '## Moderator-Vorgabe (weicht von Deiner Empfehlung ab)',
      `- Zielentscheidung fuer ALLE Beitraege zusammen: ${moderatorDecisionLabel(input.moderatorDecision)}`,
    )
    if (input.moderatorContext?.trim()) {
      lines.push(
        `- Zusatzinfo des Moderators (wahr, er kennt den Fall): ${input.moderatorContext.trim()}`,
      )
    }
    lines.push(
      '- Schreibe NUR den neuen gemeinsamen Antwortvorschlag fuer diese Zielentscheidung; bewerte nicht neu.',
    )
    return lines.join('\n')
  }

  /** The "## Fakten aus dem System" block, shared by the evaluate and rewrite prompts. */
  private systemFacts(input: CreaContributionInput): string[] {
    const lines: string[] = ['## Fakten aus dem System']
    // The code supplies both figures (1 h = 20 GDD); Crea never back-calculates.
    const enteredHours = resolveEnteredHours(input)
    const enteredGdd = resolveEnteredGdd(input)
    if (enteredHours != null) {
      lines.push(`- Eingetragene Stunden (dieser Beitrag): ${enteredHours}`)
    }
    if (enteredGdd != null) {
      lines.push(`- Eingetragener GDD-Betrag (dieser Beitrag): ${enteredGdd}`)
    }
    if (input.monthlyHours != null) {
      lines.push(
        `- Monatssumme Stunden (fuer den Deckel, kein Diskrepanz-Ausloeser): ${input.monthlyHours}`,
      )
    }
    if (input.memberStatus) {
      lines.push(`- Mitglieds-Status: ${input.memberStatus}`)
    }
    lines.push(
      `- Anrede: mit dem Platzhalter ${SALUTATION_PLACEHOLDER} beginnen (der Code fuellt den Namen lokal ein)`,
    )
    lines.push(
      `- Grussformel: mit dem Platzhalter ${SIGNATURE_PLACEHOLDER} abschliessen (der Code fuellt die Moderator-Signatur lokal ein)`,
    )
    if (input.date) {
      lines.push(`- Datum: ${input.date}`)
    }
    if (input.isNewMember != null) {
      lines.push(`- Neu-Mitglied: ${input.isNewMember ? 'ja' : 'nein'}`)
    }
    lines.push(
      `- Eingestellte Software-Sprache (fuer reasoning/appliedRule): ${input.uiLanguage ?? 'de'}`,
    )
    return lines
  }
}
