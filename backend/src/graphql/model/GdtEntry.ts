/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field } from 'type-graphql'
import { GdtEntryType } from '../enum/GdtEntryType'

@ObjectType()
export class GdtEntry {
  constructor(json: any) {
    this.id = json.id
    this.amount = json.amount
    this.date = json.date
    this.email = json.email
    this.comment = json.comment
    this.couponCode = json.coupon_code
    this.gdtEntryType = json.gdt_entry_type_id
    this.factor = json.factor
    this.amount2 = json.amount2
    this.factor2 = json.factor2
    this.gdt = json.gdt
  }

  @Field(() => Number)
  id: number

  @Field(() => Number)
  amount: number

  @Field(() => String)
  date: string

  @Field(() => String)
  email: string

  @Field(() => String)
  comment: string

  @Field(() => String)
  couponCode: string

  @Field(() => GdtEntryType)
  gdtEntryType: GdtEntryType

  @Field(() => Number)
  factor: number

  @Field(() => Number)
  amount2: number

  @Field(() => Number)
  factor2: number

  @Field(() => Number)
  gdt: number
}
