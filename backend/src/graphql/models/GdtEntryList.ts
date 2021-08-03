import { GdtEntry } from './GdtEntry'
import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class GdtSumPerEmail {
  constructor(email: string, summe: number) {
    this.email = email
    this.summe = summe
  }

  @Field(() => String)
  email: string

  @Field(() => Number)
  summe: number
}

@ObjectType()
export class GdtEntryList {
  constructor(json: any) {
    this.state = json.state
    this.moreEntrysAsShown = json.moreEntrysAsShown
    this.ownEntries = []
    if (typeof json.ownEntries !== undefined) {
      for (const entry in json.ownEntries) {
        // eslint-disable-next-line no-console
        console.log(entry)
        this.ownEntries.push(new GdtEntry(json.ownEntries[entry]))
      }
    }
    this.gdtSumPerEmail = []
    for (const email in json.gdtSumPerEmail) {
      this.gdtSumPerEmail.push(new GdtSumPerEmail(email, json.gdtSumPerEmail[email]))
    }
    this.email = json.email
    this.timeUsed = json.timeUsed
  }

  @Field(() => String)
  state: string

  @Field(() => Boolean)
  moreEntrysAsShown: boolean

  @Field(() => [GdtEntry])
  ownEntries: GdtEntry[]

  @Field(() => [GdtSumPerEmail])
  gdtSumPerEmail: GdtSumPerEmail[]

  @Field(() => String)
  email: string

  @Field(() => Number)
  timeUsed: number
}
