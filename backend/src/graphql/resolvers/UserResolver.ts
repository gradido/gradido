// import jwt from 'jsonwebtoken'
import { Resolver, Query, /* Mutation, */ Args } from 'type-graphql'
import CONFIG from '../../config'
import { LoginResponse } from '../models/User'
import { UnsecureLoginArgs } from '../inputs/LoginUserInput'
import { apiPost } from '../../apis/loginAPI'
// import { CreateBookInput } from '../inputs/CreateBookInput'
// import { UpdateBookInput } from '../inputs/UpdateBookInput'

@Resolver()
export class UserResolver {
  /* @Query(() => [User])
  users(): Promise<User[]> {
    return User.find()
  } */

  /* @Query(() => User)
  user(@Arg('id') id: string): Promise<User | undefined> {
    return User.findOne({ where: { id } })
  } */

  @Query(() => LoginResponse)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async login(@Args() { email, password }: UnsecureLoginArgs): Promise<any> {
    email = email.trim().toLowerCase()
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.result)
    }

    // temporary solution until we have JWT implemented
    return {
      sessionId: result.result.data.session_id,
      user: {
        email: result.result.data.user.email,
        language: result.result.data.user.language,
        username: result.result.data.user.username,
        firstName: result.result.data.user.first_name,
        lastName: result.result.data.user.last_name,
        description: result.result.data.user.description,
      },
    }

    // create and return the json web token
    // The expire doesn't help us here. The client needs to track when the token expires on its own,
    // since every action prolongs the time the session is valid.
    /*
    return jwt.sign(
      { result, role: 'todo' },
      CONFIG.JWT_SECRET, // * , { expiresIn: CONFIG.JWT_EXPIRES_IN } ,
    )
    */
    // return (await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', login)).result.data
    // const loginResult: LoginResult = await loginAPI.login(data)
    // return loginResult.user ? loginResult.user : new User()
  }

  /*
  @Mutation(() => User)
  async createBook(@Arg('data') data: CreateBookInput) {
    const book = User.create(data)
    await book.save()
    return book
  }
  */

  /* @Mutation(() => Boolean)
  async deleteUser(@Arg('id') id: string): Promise<boolean> {
    const user = await User.findOne({ where: { id } })
    if (!user) throw new Error('User not found!')
    await user.remove()
    return true
  } */
}
