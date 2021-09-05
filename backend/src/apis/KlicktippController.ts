import * as KlicktippAPI from '../apis/KlicktippAPI'
import CONFIG from '../config'

export class KlicktippController {
  private klicktippConnector: KlicktippAPI.KlicktippConnector

  constructor(service?: string) {
    this.klicktippConnector = new KlicktippAPI.KlicktippConnector(service)
  }

  async signin(email: string, language: string): Promise<boolean> {
    const fields = {}
    const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
    const result = await this.klicktippConnector.signin(apiKey, email, fields)
    return result
  }

  async signout(email: string, language: string): Promise<boolean> {
    const apiKey = language === 'de' ? CONFIG.KLICKTIPP_APIKEY_DE : CONFIG.KLICKTIPP_APIKEY_EN
    const result = await this.klicktippConnector.signoff(apiKey, email)
    return result
  }

  async userTags(email: string): Promise<any> {
    await this.loginKlicktippUser()
    const subscriberId = await this.klicktippConnector.subscriberSearch(email)
    const result = await this.klicktippConnector.subscriberGet(subscriberId)
    console.log('The subscriber with the id: ', subscriberId, result)
    return result
  }

  private async loginKlicktippUser() {
    return await this.klicktippConnector.login(CONFIG.KLICKTIPP_USER, CONFIG.KLICKTIPP_PASSWORD)
  }

  async untagUser(email: string, tagid: string) {
    await this.loginKlicktippUser()
    return await this.klicktippConnector.untag(email, tagid)
  }
}
