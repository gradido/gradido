import jwt from 'jsonwebtoken'
import axios from 'axios'
import { Resolver, Query, /* Mutation, */ Arg } from 'type-graphql'
import CONFIG from '../../config'
// import { User } from '../models/User'
// import { LoginUserInput } from '../inputs/LoginUserInput'
// import { loginAPI, LoginResult } from '../../apis/loginAPI'
// import { CreateBookInput } from '../inputs/CreateBookInput'
// import { UpdateBookInput } from '../inputs/UpdateBookInput'

const apiPost = async (url: string, payload: any): Promise<any> => {
  try {
    console.log(url, payload)
    const result = await axios.post(url, payload)
    console.log('-----', result)
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
    console.log(error)
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

  @Query(() => String)
  async login(@Arg('email') email: string, @Arg('password') password: string): Promise<string> {
    email = email.trim().toLowerCase()
    console.log(email, password, CONFIG.LOGIN_API_URL)
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })

    // if there is no user, throw an authentication error
    if (!result.success) {
      throw new Error(result.result)
    }

    // create and return the json web token
    // The expire doesn't help us here. The client needs to track when the token expires on its own,
    // since every action prolongs the time the session is valid.
    return jwt.sign(
      { result, role: 'todo' },
      CONFIG.JWT_SECRET /* , { expiresIn: CONFIG.JWT_EXPIRES_IN } */,
    )
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
