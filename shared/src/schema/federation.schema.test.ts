import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { publicHttpUrlSchema } from './federation.schema'

const accepts = (url: string) => v.is(publicHttpUrlSchema, url)

describe('publicHttpUrlSchema', () => {
  it.each([
    'https://gdd.gradido.net/api/',
    'http://stage3.gradido.net/api/',
    'https://gdd.gradido.net:8443/api/',
    'http://8.8.8.8/api/',
    'http://[2606:4700:4700::1111]/api/',
  ])('takes %s', (url) => {
    expect(accepts(url)).toBe(true)
  })

  it.each([
    // no url, another scheme, credentials
    ['no url', 'no url'],
    ['ftp', 'ftp://gdd.gradido.net/api/'],
    ['file', 'file:///etc/passwd'],
    ['credentials', 'https://user:secret@gdd.gradido.net/api/'],
    // names of this machine and the local network
    ['localhost', 'http://localhost/api/'],
    ['localhost with a dot at the end', 'http://LocalHost./api/'],
    ['a subdomain of localhost', 'http://app.localhost/api/'],
    ['a docker service', 'http://mariadb:3306/'],
    ['mdns', 'http://printer.local/'],
    ['an internal name', 'http://backend.internal/'],
    // IPv4
    ['loopback', 'http://127.0.0.1:4000/'],
    ['loopback in hex', 'http://0x7f.1/'],
    ['loopback as a number', 'http://2130706433/'],
    ['this host', 'http://0.0.0.0/'],
    ['private 10', 'http://10.1.2.3/'],
    ['private 172.16', 'http://172.20.0.5/'],
    ['private 192.168', 'http://192.168.1.1/'],
    ['shared address space', 'http://100.64.0.1/'],
    ['link-local, the cloud metadata', 'http://169.254.169.254/latest/meta-data/'],
    ['documentation', 'http://203.0.113.7/'],
    ['multicast', 'http://224.0.0.1/'],
    ['broadcast', 'http://255.255.255.255/'],
    // IPv6
    ['IPv6 loopback', 'http://[::1]/'],
    ['IPv6 unspecified', 'http://[::]/'],
    ['IPv4 inside IPv6', 'http://[::ffff:127.0.0.1]/'],
    ['NAT64', 'http://[64:ff9b::7f00:1]/'],
    ['6to4', 'http://[2002:7f00:1::]/'],
    ['unique local', 'http://[fd12:3456::1]/'],
    ['IPv6 link-local', 'http://[fe80::1]/'],
    ['IPv6 multicast', 'http://[ff02::1]/'],
  ])('refuses %s', (_, url) => {
    expect(accepts(url)).toBe(false)
  })
})
