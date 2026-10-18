// AI-GENERATED — not an architecture reference
import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { BACKEND_URL } from '../config/index.js'
import { MailServer } from '../mail/MailServer.js'

/** @typedef {import('@playwright/test').APIRequestContext} APIRequestContext */
/**
 * @typedef {object} TestUser
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} password
 */

const createUserMutation = `mutation ($firstName: String!, $lastName: String!, $email: String!, $language: String!) {
  createUser(firstName: $firstName, lastName: $lastName, email: $email, language: $language)
}`

const setPasswordMutation = `mutation ($code: String!, $password: String!) {
  setPassword(code: $code, password: $password)
}`

/**
 * An address no other test and no earlier run uses, so tests can run in parallel and repeatedly.
 * @param {string} prefix
 */
export const uniqueEmail = (prefix) => `${prefix}-${randomUUID()}@example.org`

/**
 * @param {APIRequestContext} request
 * @param {string} query
 * @param {Record<string, string>} variables
 */
async function graphql(request, query, variables) {
  const response = await request.post(BACKEND_URL, { data: { query, variables } })
  expect(response.ok()).toBe(true)
  const body = await response.json()
  expect(body.errors).toBeUndefined()
  return body.data
}

/**
 * Registers a new user, as the registration form does: the account is not activated, the
 * e-mail address is not confirmed and there is no password yet.
 * @param {APIRequestContext} request
 * @param {{ firstName: string, lastName: string }} user
 * @returns {Promise<{ email: string, firstName: string, lastName: string, activationLink: string }>}
 */
export async function createRegisteredUser(request, { firstName, lastName }) {
  const mailServer = new MailServer(request)
  const email = uniqueEmail(firstName.toLowerCase())
  await graphql(request, createUserMutation, { firstName, lastName, email, language: 'en' })
  const activationLink = await mailServer.receiveLink(
    email,
    'Email Verification',
    /\/checkEmail\/[0-9]+/,
  )
  return { email, firstName, lastName, activationLink }
}

/**
 * Registers a new user and activates the account with a password, the way the activation link
 * would.
 * @param {APIRequestContext} request
 * @param {{ firstName: string, lastName: string, password: string }} user
 * @returns {Promise<TestUser>}
 */
export async function createActivatedUser(request, { firstName, lastName, password }) {
  const { email, activationLink } = await createRegisteredUser(request, { firstName, lastName })
  const code = activationLink.replace('/checkEmail/', '')
  await graphql(request, setPasswordMutation, { code, password })
  return { email, firstName, lastName, password }
}
