// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'
import { MAILSERVER_URL } from '../config/index.js'

/** @typedef {import('@playwright/test').APIRequestContext} APIRequestContext */
/**
 * @typedef {object} Email as maildev's REST API returns it
 * @property {string} subject
 * @property {string} text
 * @property {string} time
 * @property {{ address: string }[]} to
 */

// Reads the fake mail server (maildev) over its REST API. Only mails to the given recipient
// that arrived after the instance was created count, so tests running in parallel and mails
// from earlier runs do not interfere.
export class MailServer {
  /** @param {APIRequestContext} request */
  constructor(request) {
    this.request = request
    // maildev stores the arrival time in whole seconds
    this.since = Math.floor(Date.now() / 1000) * 1000
  }

  /**
   * @param {string} recipient
   * @param {string} subjectPart
   * @returns {Promise<Email[]>}
   */
  async findEmails(recipient, subjectPart) {
    const response = await this.request.get(`${MAILSERVER_URL}/email`)
    expect(response.ok()).toBe(true)
    /** @type {Email[]} */
    const emails = await response.json()
    return emails.filter(
      (email) =>
        new Date(email.time).getTime() >= this.since &&
        email.to.some((to) => to.address === recipient) &&
        email.subject.includes(subjectPart),
    )
  }

  /**
   * Waits for the mail and returns the first match of linkPattern in its text.
   * @param {string} recipient
   * @param {string} subjectPart
   * @param {RegExp} linkPattern
   * @returns {Promise<string>}
   */
  async receiveLink(recipient, subjectPart, linkPattern) {
    /** @type {Email | undefined} */
    let email
    await expect
      .poll(async () => {
        email = (await this.findEmails(recipient, subjectPart))[0]
        return email
      })
      .toBeDefined()
    const match = email?.text.match(linkPattern)
    expect(match).not.toBeNull()
    return match?.[0] ?? ''
  }

  /**
   * @param {string} recipient
   * @param {string} subjectPart
   * @param {number} waitMs how long a mail would have to arrive
   */
  async assertNoEmail(recipient, subjectPart, waitMs = 1000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    expect(await this.findEmails(recipient, subjectPart)).toHaveLength(0)
  }
}
