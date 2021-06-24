import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

@Entity()
@ObjectType()
export class Group extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => String)
  @Column({ length: 190 })
  alias: string

  @Field(() => String)
  @Column()
  name: string

  @Field(() => String)
  @Column('text')
  description: string

  @Field(() => String)
  @Column()
  url: string
}
