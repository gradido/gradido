import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { ObjectType, Field, ID, GraphQLISODateTime } from 'type-graphql'

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => String)
  @Column({ length: 191 })
  email: string

  @Field(() => String)
  @Column({ length: 150 })
  firstName: string

  @Field(() => String)
  @Column()
  lastName: string

  @Field(() => String)
  @Column()
  username: string

  @Field(() => String)
  @Column('text')
  description: string

  @Field(() => String)
  @Column({ length: 64 })
  pubkey: string

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'datetime' })
  created: Date

  @Field(() => Boolean)
  @Column({ default: false })
  emailChecked: boolean

  @Field(() => Boolean)
  @Column({ default: false })
  passphraseShown: boolean

  @Field(() => String)
  @Column({ default: 'de' })
  language: string

  @Field(() => Boolean)
  @Column({ default: false })
  disabled: boolean

  @Field(() => ID)
  @Column()
  groupId: number

  @Field(() => ID)
  @Column({ default: 0 })
  publisherId: number
}
