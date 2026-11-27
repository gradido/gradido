import { BlockList, isIP } from 'node:net'
import * as v from 'valibot'

// The challenge a request to a peer carries and the peer signs back (RFC 9421 `nonce`): 128 random bits as hex
// a string in and out: it travels in a query, and the peer signs back exactly what it got
export const signatureNonceSchema = v.pipe(v.string(), v.hexadecimal(), v.length(32))
export type SignatureNonce = v.InferOutput<typeof signatureNonceSchema>

// The address ranges a federation url of another community never points to (IANA special-purpose
// registries): this host, the private networks, link-local, documentation, benchmarking,
// multicast, reserved, and the IPv6 forms that carry an IPv4 address inside. An IPv4 address
// written as IPv6 (`::ffff:127.0.0.1`) is checked against the IPv4 ranges by BlockList itself.
const notPublic = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  notPublic.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  // local-use NAT64 (RFC 8215): translates to whatever IPv4 the local translator reaches
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const) {
  notPublic.addSubnet(network, prefix, 'ipv6')
}

// names for this machine or the local network only: none of them reaches another community
const LOCAL_NAME = /(^|\.)(localhost|localdomain|local|internal|intranet|lan|home\.arpa)$/

/**
 * Whether a hostname as `URL` hands it out can be another community on the internet. An address
 * is checked against the ranges above, a name only by its form: without a dot it is a name of
 * the local network or a docker service. What a name resolves to is not known here.
 */
export const isPublicHostname = (hostname: string): boolean => {
  const host = hostname
    .replace(/^\[(.*)\]$/, '$1')
    .replace(/\.$/, '')
    .toLowerCase()
  const family = isIP(host)
  if (family) {
    return !notPublic.check(host, family === 4 ? 'ipv4' : 'ipv6')
  }
  return host.includes('.') && !LOCAL_NAME.test(host)
}

/**
 * The federation url another community announces: http(s), no credentials, and a host that can
 * be on the internet. `URL` reads the IPv4 forms (`0x7f.1`, `2130706433`) as the address they
 * are, so they are checked as such.
 */
export const publicHttpUrlSchema = v.pipe(
  v.string(),
  v.check((input) => {
    if (!URL.canParse(input)) {
      return false
    }
    const url = new URL(input)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password &&
      isPublicHostname(url.hostname)
    )
  }, 'not a public http url'),
)
