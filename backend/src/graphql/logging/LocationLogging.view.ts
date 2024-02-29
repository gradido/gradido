import { AbstractLoggingView } from '@logging/AbstractLogging.view'

import { Location } from '@model/Location'

export class LocationLoggingView extends AbstractLoggingView {
  public constructor(private self: Location) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      longitude: this.self.longitude,
      latitude: this.self.latitude,
    }
  }
}
