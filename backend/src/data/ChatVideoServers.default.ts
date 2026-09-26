// AI-GENERATED — not an architecture reference
import type { ChatVideoServerEntry } from './ChatVideoServer.logic'

/**
 * The public Jitsi servers video rooms are taken from where the server's configuration sets no
 * CHAT_VIDEO_SERVERS. A link on one of them reaches the wallet as a suggestion in the chat, not
 * as a service of Gradido's (V2).
 *
 * What it takes to be on this list, all of it checked by hand before an entry goes in:
 * - The operator offers the server recognisably to the public: Freifunk, Chaos clubs,
 *   associations, free software projects, a hoster's public offer. No university's server,
 *   which is there for its members; no party's; no fairmeeting without a prefix, which is
 *   fairkom's product (a community with its own fairkom prefix sets it in CHAT_VIDEO_SERVERS).
 * - Rooms open without an account: config.js sets neither anonymousdomain nor tokenAuthUrl, and
 *   the XMPP server offers ANONYMOUS -- the check apis/jitsi/jitsiProbe.ts repeats every ten
 *   minutes (CHAT_VIDEO_CHECK_INTERVAL_MS).
 * - No STUN server of Google's in config.js: a STUN server learns the addresses of everybody in
 *   the room.
 * - The operator's name as its imprint or its about page writes it. None found, none written:
 *   the wallet names the host then.
 *
 * Checked on 25.09.2026, the sources next to each entry. A server is added after such a check,
 * never on its hostname alone; one that stops answering is left out by the check at run time
 * and stays in this list until somebody takes it out by hand.
 */
export const CHAT_VIDEO_SERVERS_DEFAULT: ChatVideoServerEntry[] = [
  // ffmuc.net/impressum, linked from the server's own page; "Meet" among the services on ffmuc.net
  { baseUrl: 'https://meet.ffmuc.net/', operator: 'Freifunk München (Freie Netze München e. V.)' },
  // systemli.org/ueber-uns and /service/meet ("anonyme Nutzung"); no association named
  { baseUrl: 'https://meet.systemli.org/', operator: 'Systemli' },
  // en.opensuse.org/Imprint, linked from the server's config.js: the openSUSE Project Board
  { baseUrl: 'https://meet.opensuse.org/', operator: 'openSUSE Project' },
  // in-berlin.de/legal/imprint; the server's own page links in-berlin.de
  {
    baseUrl: 'https://meet.in-berlin.de/',
    operator: 'IN-Berlin (Individual Network Berlin e. V.)',
  },
  // freifunk-aachen.de: "Videokonferenz auf unserem Jitsi"; the imprint names people, no association
  { baseUrl: 'https://meet.freifunk-aachen.de/', operator: 'Freifunk Aachen' },
  // weimarnetz.de/impressum
  { baseUrl: 'https://meet.weimarnetz.de/', operator: 'Weimarnetz e. V.' },
  // chaosdorf.de/impressum; the Chaosdorf wiki names virtual.chaosdorf.space as its Jitsi
  {
    baseUrl: 'https://virtual.chaosdorf.space/',
    operator: 'Chaos Computer Club Düsseldorf / Chaosdorf e. V.',
  },
  // hamburg.ccc.de/imprint
  { baseUrl: 'https://jitsi.hamburg.ccc.de/', operator: 'CCC Hansestadt Hamburg e. V.' },
  // meerfarbig.net/impressum, an internet service provider
  { baseUrl: 'https://meet.meerfarbig.net/', operator: 'meerfarbig GmbH & Co. KG' },
]
