import {
  UserContext,
  LoginUserContext,
  LoginUserBackupContext,
  ServerUserContext,
  LoginUserRolesContext,
} from '../../interface/UserContext'
import { UserInterface } from '../../interface/UserInterface'
import { LoginUser } from '../../../entity/LoginUser'

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
