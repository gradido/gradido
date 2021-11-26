import {
  UserContext,
  LoginUserContext,
  LoginUserBackupContext,
  ServerUserContext,
  LoginUserRolesContext,
} from '../../interface/UserContext'
import { UserInterface } from '../../interface/UserInterface'
import { User } from '../../../entity/User'
import { LoginUser } from '../../../entity/LoginUser'
import { LoginUserBackup } from '../../../entity/LoginUserBackup'
import { ServerUser } from '../../../entity/ServerUser'
import { LoginUserRoles } from '../../../entity/LoginUserRoles'
import { Factory } from 'typeorm-seeding'

export const userSeeder = async (factory: Factory, userData: UserInterface): Promise<void> => {
  await factory(User)(createUserContext(userData)).create()
  const loginUser = await factory(LoginUser)(createLoginUserContext(userData)).create()
  await factory(LoginUserBackup)(createLoginUserBackupContext(userData, loginUser)).create()

  if (userData.isAdmin) {
    await factory(ServerUser)(createServerUserContext(userData)).create()

    // This is crazy: we just need the relation to roleId but no role at all
    // It works with LoginRoles empty!!
    await factory(LoginUserRoles)(createLoginUserRolesContext(loginUser)).create()
  }
}

export const createUserContext = (context: UserInterface): UserContext => {
  return {
    pubkey: context.pubKey,
    email: context.email,
    firstName: context.firstName,
    lastName: context.lastName,
    username: context.username,
    disabled: context.disabled,
  }
}

export const createLoginUserContext = (context: UserInterface): LoginUserContext => {
  return {
    email: context.email,
    firstName: context.firstName,
    lastName: context.lastName,
    username: context.username,
    description: context.description,
    password: context.password,
    pubKey: context.pubKey,
    privKey: context.privKey,
    emailHash: context.emailHash,
    createdAt: context.createdAt,
    emailChecked: context.emailChecked,
    passphraseShown: context.passphraseShown,
    language: context.language,
    disabled: context.disabled,
    groupId: context.groupId,
    publisherId: context.publisherId,
  }
}

export const createLoginUserBackupContext = (
  context: UserInterface,
  loginUser: LoginUser,
): LoginUserBackupContext => {
  return {
    passphrase: context.passphrase,
    mnemonicType: context.mnemonicType,
    userId: loginUser.id,
  }
}

export const createServerUserContext = (context: UserInterface): ServerUserContext => {
  return {
    role: context.role,
    username: context.username,
    password: context.serverUserPassword,
    email: context.email,
    activated: context.activated,
    created: context.createdAt,
    lastLogin: context.lastLogin,
    modified: context.modified,
  }
}

export const createLoginUserRolesContext = (loginUser: LoginUser): LoginUserRolesContext => {
  return {
    userId: loginUser.id,
    roleId: 1,
  }
}
