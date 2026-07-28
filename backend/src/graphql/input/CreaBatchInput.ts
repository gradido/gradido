import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Field, Float, InputType } from 'type-graphql'

// One contribution inside a batch (E-020). Only the fields the batch prompt needs
// per item: the text plus the entered GDD amount and the date. The money/context
// facts stay lean - batch mode runs no per-contribution discrepancy check.
@InputType()
export class CreaBatchContribution {
  @Field()
  @IsString()
  text: string

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  enteredGdd?: number | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  date?: string | null
}

// Batch evaluation input (E-020): all contributions belong to ONE participant, so
// the recipient's first name (for the local [ANREDE] fill) and the UI language are
// shared across them. The name is used ONLY locally to build the salutation and never
// reaches the Anthropic API (PII stays local, E-012). No contributionRef /
// personPseudonym: batch mode does not persist crea_records (kept lean; the
// fine-grained per-contribution records are nachruestbar later).
@InputType()
export class CreaBatchInput {
  @Field(() => [CreaBatchContribution])
  contributions: CreaBatchContribution[]

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  recipientFirstName?: string | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  salutation?: string | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  uiLanguage?: string | null

  // The moderator's target decision when deviating from Crea's overall recommendation
  // (E-017 / E-020): confirm | inquire | deny. Only set on the batch rewrite call
  // (creaRewriteBatch); "deny" stays out of Crea's own verdict enum (E-008).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  moderatorDecision?: string | null

  // One or two sentences the moderator adds when deviating - context Crea lacked.
  // Treated as true; steers the tone and the reason for the new joint reply.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  moderatorContext?: string | null
}
