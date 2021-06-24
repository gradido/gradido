import { Resolver, Query, Mutation, Arg } from 'type-graphql'
import { User } from '../models/User'
import jwt from 'jsonwebtoken'
import { LoginUserInput } from '../inputs/LoginUserInput'
import { loginAPI, LoginResult } from '../../apis/loginAPI'
// import { CreateBookInput } from '../inputs/CreateBookInput'
// import { UpdateBookInput } from '../inputs/UpdateBookInput'

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(): Promise<User[]> {
    return User.find()
  }

  @Query(() => User)
  user(@Arg('id') id: string): Promise<User | undefined> {
    return User.findOne({ where: { id } })
  }

  @Mutation(() => User)
  async login(@Arg('data') data: LoginUserInput): Promise<User> {
    const loginResult: LoginResult = await loginAPI.login(data)
    return loginResult.user ? loginResult.user : new User()
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
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id') id: string): Promise<boolean> {
    const user = await User.findOne({ where: { id } })
    if (!user) throw new Error('User not found!')
    await user.remove()
    return true
  }
}
