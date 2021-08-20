import axios, { AxiosRequestConfig, Method } from 'axios'

export class KlicktippConnector {
  private baseURL: string
  private sessionName: string
  private sessionId: string
  private error: string

  constructor(service?: string) {
    this.baseURL = service !== undefined ? service : 'https://api.klicktipp.com'
    this.sessionName = ''
    this.sessionId = ''
  }

  /**
   * Get last error
   *
   * @return string an error description of the last error
   */
  getLastError(): string {
    const result = this.error
    return result
  }

  /**
   * login
   *
   * @param username The login name of the user to login.
   * @param password The password of the user.
   * @return TRUE on success
   */
  async login(username: string, password: string): Promise<boolean> {
    if (!(username && password)) {
      throw new Error('Login failed: Illegal Arguments')
    }

    const res = await this.httpRequest('/account/login', 'POST', { username, password }, false)

    if (!res.isAxiosError) {
      this.sessionId = res.data.sessid
      this.sessionName = res.data.session_name

      return true
    }

    throw new Error(`Login failed: ${res.response.statusText}`)
  }

  /**
   * Logs out the user currently logged in.
   *
   * @return TRUE on success
   */
  async logout(): Promise<boolean> {
    const res = await this.httpRequest('/account/logout', 'POST')

    if (!res.isAxiosError) {
      this.sessionId = ''
      this.sessionName = ''

      return true
    }

    throw new Error(`Logout failed: ${res.response.statusText}`)
  }

  /**
   * Get all subscription processes (lists) of the logged in user. Requires to be logged in.
   *
   * @return A associative obeject <list id> => <list name>
   */
  async subscriptionProcessIndex(): Promise<any> {
    const res = await this.httpRequest('/list')

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Subscription process index failed: ${res.response.statusText}`)
  }

  /**
   * Get subscription process (list) definition. Requires to be logged in.
   *
   * @param listid The id of the subscription process
   *
   * @return An object representing the Klicktipp subscription process.
   */
  async subscriptionProcessGet(listid: string): Promise<any> {
    if (!listid || listid === '') {
      throw new Error('Illegal Arguments')
    }

    // retrieve
    const res = await this.httpRequest(`/subscriber/${listid}`)

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Subscription process get failed: ${res.response.statusText}`)
  }

  /**
   * Get subscription process (list) redirection url for given subscription.
   *
   * @param listid The id of the subscription process.
   * @param email The email address of the subscriber.
   *
   * @return A redirection url as defined in the subscription process.
   */
  async subscriptionProcessRedirect(listid: string, email: string): Promise<any> {
    if (!listid || listid === '' || !email || email === '') {
      throw new Error('Illegal Arguments')
    }

    // update
    const data = { listid, email }
    const res = await this.httpRequest('/list/redirect', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Subscription process get redirection url failed: ${res.response.statusText}`)
  }

  /**
   * Get all manual tags of the logged in user. Requires to be logged in.
   *
   * @return A associative object <tag id> => <tag name>
   */
  async tagIndex(): Promise<any> {
    const res = await this.httpRequest('/tag')

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Tag index failed: ${res.response.statusText}`)
  }

  /**
   * Get a tag definition. Requires to be logged in.
   *
   * @param tagid The tag id.
   *
   * @return An object representing the Klicktipp tag object.
   */
  async tagGet(tagid: string): Promise<any> {
    if (!tagid || tagid === '') {
      throw new Error('Illegal Arguments')
    }
    const res = await this.httpRequest(`/tag/${tagid}`)

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Tag get failed: ${res.response.statusText}`)
  }

  /**
   * Create a new manual tag. Requires to be logged in.
   *
   * @param name The name of the tag.
   * @param text (optional) An additional description of the tag.
   *
   * @return The id of the newly created tag or false if failed.
   */
  async tagCreate(name: string, text?: string): Promise<boolean> {
    if (!name || name === '') {
      throw new Error('Illegal Arguments')
    }
    const data = {
      name,
      text: text !== undefined ? text : '',
    }
    const res = await this.httpRequest('/tag', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Tag creation failed: ${res.response.statusText}`)
  }

  /**
   * Updates a tag. Requires to be logged in.
   *
   * @param tagid The tag id used to identify which tag to modify.
   * @param name (optional) The new tag name. Set empty to leave it unchanged.
   * @param text (optional) The new tag description. Set empty to leave it unchanged.
   *
   * @return TRUE on success
   */
  async tagUpdate(tagid: string, name?: string, text?: string): Promise<boolean> {
    if (!tagid || tagid === '' || (name === '' && text === '')) {
      throw new Error('Illegal Arguments')
    }
    const data = {
      name: name !== undefined ? name : '',
      text: text !== undefined ? text : '',
    }

    const res = await this.httpRequest(`/tag/${tagid}`, 'PUT', data)

    if (!res.isAxiosError) {
      return true
    }

    throw new Error(`Tag update failed: ${res.response.statusText}`)
  }

  /**
   * Deletes a tag. Requires to be logged in.
   *
   * @param tagid The user id of the user to delete.
   *
   * @return TRUE on success
   */
  async tagDelete(tagid: string): Promise<boolean> {
    if (!tagid || tagid === '') {
      throw new Error('Illegal Arguments')
    }

    const res = await this.httpRequest(`/tag/${tagid}`, 'DELETE')

    if (!res.isAxiosError) {
      return true
    }

    throw new Error(`Tag deletion failed: ${res.response.statusText}`)
  }

  /**
   * Get all contact fields of the logged in user. Requires to be logged in.
   *
   * @return A associative object <field id> => <field name>
   */
  async fieldIndex(): Promise<any> {
    const res = await this.httpRequest('/field')

    if (!res.isAxiosError) {
      return res.data
    }

    throw new Error(`Field index failed: ${res.response.statusText}`)
  }

  /**
   * Subscribe an email. Requires to be logged in.
   *
   * @param email The email address of the subscriber.
   * @param listid (optional) The id subscription process.
   * @param tagid (optional) The id of the manual tag the subscriber will be tagged with.
   * @param fields (optional) Additional fields of the subscriber.
   *
   * @return An object representing the Klicktipp subscriber object.
   */
  async subscribe(
    email: string,
    listid?: number,
    tagid?: number,
    fields?: any,
    smsnumber?: string,
  ): Promise<any> {
    if ((!email || email === '') && smsnumber === '') {
      throw new Error('Illegal Arguments')
    }
    // subscribe
    const data = {
      email,
      fields: fields !== undefined ? fields : {},
      smsnumber: smsnumber !== undefined ? smsnumber : '',
      listid: listid !== undefined ? listid : 0,
      tagid: tagid !== undefined ? tagid : 0,
    }

    const res = await this.httpRequest('/subscriber', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`Subscription failed: ${res.response.statusText}`)
  }

  /**
   * Unsubscribe an email. Requires to be logged in.
   *
   * @param email The email address of the subscriber.
   *
   * @return TRUE on success
   */
  async unsubscribe(email: string): Promise<boolean> {
    if (!email || email === '') {
      throw new Error('Illegal Arguments')
    }

    // unsubscribe
    const data = { email }

    const res = await this.httpRequest('/subscriber/unsubscribe', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Unsubscription failed:  ${res.response.statusText}`)
  }

  /**
   * Tag an email. Requires to be logged in.
   *
   * @param email The email address of the subscriber.
   * @param tagids an array of the manual tag(s) the subscriber will be tagged with.
   *
   * @return TRUE on success
   */
  async tag(email: string, tagids: string): Promise<boolean> {
    if (!email || email === '' || !tagids || tagids === '') {
      throw new Error('Illegal Arguments')
    }

    // tag
    const data = {
      email,
      tagids,
    }

    const res = await this.httpRequest('/subscriber/tag', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`Tagging failed: ${res.response.statusText}`)
  }

  /**
   * Untag an email. Requires to be logged in.
   *
   * @param mixed $email The email address of the subscriber.
   * @param mixed $tagid The id of the manual tag that will be removed from the subscriber.
   *
   * @return TRUE on success.
   */
  async untag(email: string, tagid: string): Promise<boolean> {
    if (!email || email === '' || !tagid || tagid === '') {
      throw new Error('Illegal Arguments')
    }

    // subscribe
    const data = {
      email,
      tagid,
    }

    const res = await this.httpRequest('/subscriber/untag', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Untagging failed: ${res.response.statusText}`)
  }

  /**
   * Resend an autoresponder for an email address. Requires to be logged in.
   *
   * @param email A valid email address
   * @param autoresponder An id of the autoresponder
   *
   * @return TRUE on success
   */
  async resend(email: string, autoresponder: string): Promise<boolean> {
    if (!email || email === '' || !autoresponder || autoresponder === '') {
      throw new Error('Illegal Arguments')
    }

    // resend/reset autoresponder
    const data = { email, autoresponder }

    const res = await this.httpRequest('/subscriber/resend', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Resend failed: ${res.response.statusText}`)
  }

  /**
   * Get all active subscribers. Requires to be logged in.
   *
   * @return An array of subscriber ids.
   */
  async subscriberIndex(): Promise<[string]> {
    const res = await this.httpRequest('/subscriber')

    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`Subscriber index failed: ${res.response.statusText}`)
  }

  /**
   * Get subscriber information. Requires to be logged in.
   *
   * @param subscriberid The subscriber id.
   *
   * @return An object representing the Klicktipp subscriber.
   */
  async subscriberGet(subscriberid: string): Promise<any> {
    if (!subscriberid || subscriberid === '') {
      throw new Error('Illegal Arguments')
    }

    // retrieve
    const res = await this.httpRequest(`/subscriber/${subscriberid}`)
    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`Subscriber get failed:  ${res.response.statusText}`)
  }

  /**
   * Get a subscriber id by email. Requires to be logged in.
   *
   * @param email The email address of the subscriber.
   *
   * @return The id of the subscriber. Use subscriber_get to get subscriber details.
   */
  async subscriberSearch(email: string): Promise<any> {
    if (!email || email === '') {
      throw new Error('Illegal Arguments')
    }
    // search
    const data = { email }
    const res = await this.httpRequest('/subscriber/search', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`Subscriber search failed: ${res.response.statusText}`)
  }

  /**
   * Get all active subscribers tagged with the given tag id. Requires to be logged in.
   *
   * @param tagid The id of the tag.
   *
   * @return An array with id -> subscription date of the tagged subscribers. Use subscriber_get to get subscriber details.
   */
  async subscriberTagged(tagid: string): Promise<any> {
    if (!tagid || tagid === '') {
      throw new Error('Illegal Arguments')
    }

    // search
    const data = { tagid }
    const res = await this.httpRequest('/subscriber/tagged', 'POST', data)

    if (!res.isAxiosError) {
      return res.data
    }
    throw new Error(`subscriber tagged failed: ${res.response.statusText}`)
  }

  /**
   * Updates a subscriber. Requires to be logged in.
   *
   * @param subscriberid The id of the subscriber to update.
   * @param fields (optional) The fields of the subscriber to update
   * @param newemail (optional) The new email of the subscriber to update
   *
   * @return TRUE on success
   */
  async subscriberUpdate(
    subscriberid: string,
    fields?: any,
    newemail?: string,
    newsmsnumber?: string,
  ): Promise<boolean> {
    if (!subscriberid || subscriberid === '') {
      throw new Error('Illegal Arguments')
    }

    // update
    const data = {
      fields: fields !== undefined ? fields : {},
      newemail: newemail !== undefined ? newemail : '',
      newsmsnumber: newsmsnumber !== undefined ? newsmsnumber : '',
    }
    const res = await this.httpRequest(`/subscriber/${subscriberid}`, 'PUT', data)
    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Subscriber update failed: ${res.response.statusText}`)
  }

  /**
   * Delete a subscribe. Requires to be logged in.
   *
   * @param subscriberid The id of the subscriber to update.
   *
   * @return TRUE on success.
   */
  async subscriberDelete(subscriberid: string): Promise<boolean> {
    if (!subscriberid || subscriberid === '') {
      throw new Error('Illegal Arguments')
    }

    // delete
    const res = await this.httpRequest(`/subscriber/${subscriberid}`, 'DELETE')

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Subscriber deletion failed: ${res.response.statusText}`)
  }

  /**
   * Subscribe an email. Requires an api key.
   *
   * @param apikey The api key (listbuildng configuration).
   * @param email The email address of the subscriber.
   * @param fields (optional) Additional fields of the subscriber.
   *
   * @return A redirection url as defined in the subscription process.
   */
  async signin(apikey: string, email: string, fields?: any, smsnumber?: string): Promise<boolean> {
    if (!apikey || apikey === '' || ((!email || email === '') && smsnumber === '')) {
      throw new Error('Illegal Arguments')
    }

    // subscribe
    const data = {
      apikey,
      email,
      fields: fields !== undefined ? fields : {},
      smsnumber: smsnumber !== undefined ? smsnumber : '',
    }

    const res = await this.httpRequest('/subscriber/signin', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Subscription failed: ${res.response.statusText}`)
  }

  /**
   * Untag an email. Requires an api key.
   *
   * @param apikey The api key (listbuildng configuration).
   * @param email The email address of the subscriber.
   *
   * @return TRUE on success
   */
  async signout(apikey: string, email: string): Promise<boolean> {
    if (!apikey || apikey === '' || !email || email === '') {
      throw new Error('Illegal Arguments')
    }

    // untag
    const data = { apikey, email }
    const res = await this.httpRequest('/subscriber/signout', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Untagging failed: ${res.response.statusText}`)
  }

  /**
   * Unsubscribe an email. Requires an api key.
   *
   * @param apikey The api key (listbuildng configuration).
   * @param email The email address of the subscriber.
   *
   * @return TRUE on success
   */
  async signoff(apikey: string, email: string): Promise<boolean> {
    if (!apikey || apikey === '' || !email || email === '') {
      throw new Error('Illegal Arguments')
    }

    // unsubscribe
    const data = { apikey, email }
    const res = await this.httpRequest('/subscriber/signoff', 'POST', data)

    if (!res.isAxiosError) {
      return true
    }
    throw new Error(`Unsubscription failed: ${res.response.statusText}`)
  }

  async httpRequest(path: string, method?: Method, data?: any, usesession?: boolean): Promise<any> {
    if (method === undefined) {
      method = 'GET'
    }
    const options: AxiosRequestConfig = {
      baseURL: this.baseURL,
      method,
      url: path,
      data,
      headers: {
        'Content-Type': 'application/json',
        Content: 'application/json',
        Cookie:
          usesession && this.sessionName !== '' ? `${this.sessionName}=${this.sessionId}` : '',
      },
    }

    return axios(options)
      .then((res) => res)
      .catch((error) => error)
  }
}
