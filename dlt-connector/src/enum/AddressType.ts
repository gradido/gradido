import {
  AddressType_COMMUNITY_AUF,
  AddressType_COMMUNITY_GMW,
  AddressType_COMMUNITY_HUMAN,
  AddressType_COMMUNITY_PROJECT,
  AddressType_CRYPTO_ACCOUNT,
  AddressType_DEFERRED_TRANSFER,
  AddressType_NONE,
  AddressType_SUBACCOUNT,
} from 'gradido-blockchain-js'

export enum AddressType {
  COMMUNITY_AUF = AddressType_COMMUNITY_AUF,
  COMMUNITY_GMW = AddressType_COMMUNITY_GMW,
  COMMUNITY_HUMAN = AddressType_COMMUNITY_HUMAN,
  COMMUNITY_PROJECT = AddressType_COMMUNITY_PROJECT,
  CRYPTO_ACCOUNT = AddressType_CRYPTO_ACCOUNT,
  NONE = AddressType_NONE,
  SUBACCOUNT = AddressType_SUBACCOUNT,
  DEFERRED_TRANSFER = AddressType_DEFERRED_TRANSFER,
}
