import { Entity, BaseEntity, Column } from 'typeorm'
import { ObjectType, Field } from 'type-graphql'

@Entity()
@ObjectType()
export class User extends BaseEntity {
  /*
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number
  */

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

  /*
  @Field(() => String)
  @Column({ length: 64 })
  pubkey: string

  // not sure about the type here. Maybe better to have a string
  @Field(() => number)
  @Column({ type: 'datetime' })
  created: number

  @Field(() => Boolean)
  @Column({ default: false })
  emailChecked: boolean

  @Field(() => Boolean)
  @Column({ default: false })
  passphraseShown: boolean
  */

  @Field(() => String)
  @Column({ default: 'de' })
  language: string

  /*
  @Field(() => Boolean)
  @Column({ default: false })
  disabled: boolean
  */

  /* I suggest to have a group as type here
  @Field(() => ID)
  @Column()
  groupId: number

  // what is puvlisherId?
  @Field(() => ID)
  @Column({ default: 0 })
  publisherId: number
  */
}

// temporaray solution until we have JWT implemented
@Entity()
@ObjectType()
export class LoginResponse extends BaseEntity {
  @Field(() => Number)
  @Column()
  sessionId: number

  @Field(() => User)
  @Column()
  user: User
}

@Entity()
@ObjectType()
export class LoginViaVerificationCode extends BaseEntity {
  @Field(() => Number)
  @Column()
  sessionId: number

  @Field(() => String)
  @Column()
  email: string
}

@Entity()
@ObjectType()
export class LogoutResponse extends BaseEntity {
  @Field(() => String)
  state: string
}

@Entity()
@ObjectType()
export class CreateResponse extends BaseEntity {
  @Field(() => String)
  state: string
}

@Entity()
@ObjectType()
export class SendEmailResponse extends BaseEntity {
  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string
}

@Entity()
@ObjectType()
export class Server extends BaseEntity {
  @Field(() => String)
  loginServerPath: string
}

@Entity()
@ObjectType()
export class ErrorData extends BaseEntity {
  @Field(() => String)
  messages: string
}

@Entity()
@ObjectType()
export class GetUserInfoResponse extends BaseEntity {
  /* "state": "success",
	"userData": { 
		"EmailVerificationCode.Register": "2718271129122",
		"pubkeyhex": "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
		"first_name": "Max",
		"last_name": "Musterman",
		"disabled": 0,
		"email_checked": 1
  	},
	"server": {
    	"loginServer.path": "http://localhost/account"
  	},
  	"errors": []
    */
  @Field(() => String)
  state: string

  @Field(() => User)
  userData: User

  @Field(() => Server)
  server: Server

  @Field(() => [ErrorData])
  errors: [ErrorData]
}

@Entity()
@ObjectType()
export class ChangePasswordResponse extends BaseEntity {
  @Field(() => String)
  state: string
}

@Entity()
@ObjectType()
export class UpdateUserInfosResponse extends BaseEntity {
  @Field(() => String)
  state: string

  @Field(() => Number)
  validValues: number

  @Field(() => [ErrorData])
  errors: [ErrorData]
}

@Entity()
@ObjectType()
export class CheckUsernameResponse extends BaseEntity {
  @Field(() => String)
  state: string

  @Field(() => String)
  msg?: string

  @Field(() => Number)
  groupId?: number
}
