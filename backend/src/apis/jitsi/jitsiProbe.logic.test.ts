// AI-GENERATED — not an architecture reference
import {
  boshSessionRequest,
  evaluateBoshFeatures,
  evaluateJitsiConfig,
  JitsiProbeError,
} from './jitsiProbe.logic'

// Excerpts of config.js as the servers answered on 25.09.2026 -- the Debian form, with Jitsi's
// own comments around the settings (meet.ffmuc.net, one of the default servers).
const OPEN_CONFIG = `
var config = {
    hosts: {
        // XMPP domain.
        domain: 'meet.ffmuc.net',

        // When using authentication, domain for guest users.
        // anonymousdomain: 'guest.example.com',

        // Domain for authenticated users. Defaults to <domain>.
        // authdomain: 'meet.ffmuc.net',

        // Focus component domain. Defaults to focus.<domain>.
        focus: 'focus.meet.ffmuc.net',

        // XMPP MUC domain. FIXME: use XEP-0030 to discover it.
        muc: 'conference.' + subdomain + 'meet.ffmuc.net'
    },

    // BOSH URL. FIXME: use XEP-0156 to discover it.
    bosh: '//meet.ffmuc.net/' + subdir + 'http-bind',

    // You can use tokenAuthUrl config to point to a URL of such service.
    // tokenAuthUrl:
    //      'https://myservice.com/auth/{room}?code_challenge_method=S256&code_challenge={code_challenge}'

    /**
     requireDisplayName
     tokenAuthUrl
     */
};
`

// jitsi.mpi-bremen.de: the guest domain is set -- rooms are opened by somebody with an account.
const GUEST_DOMAIN_CONFIG = `
var config = {
    hosts: {
        // XMPP domain.
        domain: 'jitsi.mpi-bremen.de',

        // When using authentication, domain for guest users.
        anonymousdomain: 'guest.jitsi.mpi-bremen.de',
    },
};
`

// jitsi.debian.social: anonymous in XMPP, and still everybody is sent to a login.
const TOKEN_CONFIG = `
var config = {
    hosts: {
        domain: 'jitsi.debian.social',
        // anonymousdomain: 'guest.example.com',
    },
     tokenAuthUrl: 'https://sso.jitsi.debian.social/room_auth/{room}',
     tokenAuthUrlAutoRedirect: true,
};
`

// fairmeeting.net: the form of the Docker images.
const DOCKER_CONFIG = `
// Jitsi Meet configuration.

var config = {};

config.hosts = {};
config.hosts.domain = 'fairmeeting.net';

config.hosts.muc = 'muc.' + subdomain + 'fairmeeting.net';
config.bosh = 'https://fairmeeting.net/' + subdir + 'http-bind';
`

// The answers to the first BOSH request, as meet.ffmuc.net and jitsi.mpi-bremen.de gave them.
const ANONYMOUS_FEATURES =
  "<body ver='1.6' from='meet.ffmuc.net' sid='72a678dd' xmlns='http://jabber.org/protocol/httpbind'" +
  " xmlns:stream='http://etherx.jabber.org/streams'><stream:features xmlns='jabber:client'>" +
  "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><mechanism>ANONYMOUS</mechanism>" +
  '</mechanisms></stream:features></body>'
const PLAIN_FEATURES =
  "<body xmlns='http://jabber.org/protocol/httpbind' from='jitsi.mpi-bremen.de' sid='ee6f6ad1'>" +
  "<stream:features xmlns='jabber:client'><register xmlns='http://jabber.org/features/iq-register'/>" +
  "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><mechanism>PLAIN</mechanism></mechanisms>" +
  '</stream:features></body>'

describe('evaluateJitsiConfig', () => {
  it('passes an open server and reads its XMPP domain -- a commented guest domain does not count', () => {
    expect(evaluateJitsiConfig(OPEN_CONFIG)).toEqual({
      success: true,
      value: { domain: 'meet.ffmuc.net' },
    })
  })

  it('sends an active guest domain to LOGIN_REQUIRED', () => {
    expect(evaluateJitsiConfig(GUEST_DOMAIN_CONFIG)).toEqual({
      success: false,
      error: 'LOGIN_REQUIRED',
    })
  })

  it('sends an active tokenAuthUrl to LOGIN_REQUIRED', () => {
    expect(evaluateJitsiConfig(TOKEN_CONFIG)).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
  })

  it('reads the Docker form, and a login set there counts as well', () => {
    expect(evaluateJitsiConfig(DOCKER_CONFIG)).toEqual({
      success: true,
      value: { domain: 'fairmeeting.net' },
    })
    expect(
      evaluateJitsiConfig(`${DOCKER_CONFIG}config.hosts.anonymousdomain = 'guest.meet.jitsi';\n`),
    ).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
    expect(
      evaluateJitsiConfig(
        `${DOCKER_CONFIG}config.tokenAuthUrl = 'https://login.example/{room}';\n`,
      ),
    ).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
  })

  it('does not count a setting inside a block comment', () => {
    const commented = OPEN_CONFIG.replace(
      '    /**',
      "    /*\n     anonymousdomain: 'guest.example.com',\n     tokenAuthUrl: 'https://x/{room}',",
    )
    expect(commented).toContain("tokenAuthUrl: 'https://x/{room}'")
    expect(evaluateJitsiConfig(commented).success).toBe(true)
  })

  it('does not count a comment at the end of a line, and keeps the code before it', () => {
    const trailing = `
var config = {
    hosts: { domain: 'meet.example.org', // anonymousdomain: 'guest.meet.example.org'
    },
    bosh: '//meet.example.org/http-bind', // tokenAuthUrl: 'https://login.example.org/{room}'
};
`
    expect(evaluateJitsiConfig(trailing)).toEqual({
      success: true,
      value: { domain: 'meet.example.org' },
    })
  })

  // ⛔ The dangerous direction: a server that wants a login must not pass as open.
  it('reads // and /* inside a string as text -- a string cannot hide the setting after it', () => {
    const quoted = `
var config = {
    hosts: { domain: 'meet.example.org' },
    welcome: 'Rooms/*: open to all',
    anonymousdomain: 'guest.meet.example.org',
    footer: 'the end*/',
};
`
    expect(evaluateJitsiConfig(quoted)).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
    expect(
      evaluateJitsiConfig(
        `${DOCKER_CONFIG}config.tokenAuthUrl = 'https://login.example.org//auth'; // a note\n`,
      ),
    ).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
  })

  it('keeps an escaped quote inside its string, and the setting after it', () => {
    // config.js holds: welcome: 'It\'s // open', anonymousdomain: 'guest.meet.example.org',
    const escaped = `
var config = {
    hosts: { domain: 'meet.example.org' },
    welcome: 'It\\'s // open', anonymousdomain: 'guest.meet.example.org',
};
`
    expect(escaped).toContain("'It\\'s // open'")
    expect(evaluateJitsiConfig(escaped)).toEqual({ success: false, error: 'LOGIN_REQUIRED' })
  })

  it('names no domain where config.js names none, and the probe takes the host then', () => {
    expect(evaluateJitsiConfig("var config = { hosts: { muc: 'conference.x' } };")).toEqual({
      success: true,
      value: { domain: null },
    })
  })

  it('knows an answer without hosts as NOT_JITSI -- a page, or hosts only in a comment', () => {
    for (const text of [
      '<!DOCTYPE html><html><head><title>Welcome</title></head></html>',
      '// hosts: { domain: "x" }\nvar config = {};',
      '',
    ]) {
      expect(evaluateJitsiConfig(text)).toEqual({ success: false, error: 'NOT_JITSI' })
    }
  })
})

describe('evaluateBoshFeatures', () => {
  it('passes a server that offers ANONYMOUS', () => {
    expect(evaluateBoshFeatures(ANONYMOUS_FEATURES)).toEqual({ success: true })
  })

  it('knows ways in without ANONYMOUS as NO_ANONYMOUS', () => {
    expect(evaluateBoshFeatures(PLAIN_FEATURES)).toEqual({ success: false, error: 'NO_ANONYMOUS' })
  })

  it('knows an answer without ways in as NO_BOSH -- a refused session, an error page', () => {
    for (const text of [
      "<body type='terminate' condition='host-unknown' xmlns='http://jabber.org/protocol/httpbind'/>",
      '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title></head></html>',
      '',
    ]) {
      expect(evaluateBoshFeatures(text)).toEqual({ success: false, error: 'NO_BOSH' })
    }
  })
})

describe('boshSessionRequest', () => {
  it('opens a session with the domain and the request id', () => {
    expect(boshSessionRequest('meet.ffmuc.net', 4711)).toBe(
      "<body rid='4711' xmlns='http://jabber.org/protocol/httpbind' to='meet.ffmuc.net' " +
        "xml:lang='en' wait='5' hold='1' content='text/xml; charset=utf-8' ver='1.6' " +
        "xmpp:version='1.0' xmlns:xmpp='urn:xmpp:xbosh'/>",
    )
  })
})

describe('JitsiProbeError', () => {
  it('keeps host, reason and detail apart, and names them in its message', () => {
    const error = new JitsiProbeError('meet.example.org', 'NO_BOSH', 'http-bind answered 404')
    expect(error).toMatchObject({
      name: 'JitsiProbeError',
      host: 'meet.example.org',
      reason: 'NO_BOSH',
      detail: 'http-bind answered 404',
      message: 'JITSI_PROBE_NO_BOSH on meet.example.org: http-bind answered 404',
    })
  })
})
