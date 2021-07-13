// import jwt from 'jsonwebtoken'
import axios from 'axios'
import { Resolver, Query, /* Mutation, */ Arg } from 'type-graphql'
import CONFIG from '../../config'
import { LoginResponse } from '../models/User'
// import { LoginUserInput } from '../inputs/LoginUserInput'
// import { loginAPI, LoginResult } from '../../apis/loginAPI'
// import { CreateBookInput } from '../inputs/CreateBookInput'
// import { UpdateBookInput } from '../inputs/UpdateBookInput'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiPost = async (url: string, payload: unknown): Promise<any> => {
  try {
    // console.log(url, payload)
    const result = await axios.post(url, payload)
    // console.log('-----', result)
    if (result.status !== 200) {
      throw new Error('HTTP Status Error ' + result.status)
    }
    if (result.data.state === 'warning') {
      return { success: true, result: result.data.errors }
    }
    if (result.data.state !== 'success') {
      throw new Error(result.data.msg)
    }
    return { success: true, result }
  } catch (error) {
    // console.log(error)
    return { success: false, result: error }
  }
}

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
  async login(@Arg('email') email: string, @Arg('password') password: string): Promise<any> {
    email = email.trim().toLowerCase()
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.result)
    }

    // temporary solution until we have JWT implemented
    // console.log(result.result.data)
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

  @Mutation(() => Book)
  async updateBook(@Arg('id') id: string, @Arg('data') data: UpdateBookInput) {
    const book = await Book.findOne({ where: { id } })
    if (!book) throw new Error('Book not found!')
    Object.assign(book, data)
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
