import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  calculateSubnets,
  intToIp,
  parseCidr,
  parseIPv4,
  parsePrefix,
  usableCount,
} from './subnet.js'

describe('parseIPv4', () => {
  it('parses dotted quad', () => {
    assert.equal(intToIp(parseIPv4('10.33.0.1')), '10.33.0.1')
    assert.equal(intToIp(parseIPv4('192.168.1.255')), '192.168.1.255')
  })
  it('rejects junk', () => {
    assert.throws(() => parseIPv4('10.0.0'), /four octets/)
    assert.throws(() => parseIPv4('10.0.0.256'), /out of range/)
    assert.throws(() => parseIPv4('10.0.0.a'), /Invalid octet/)
  })
})

describe('parseCidr', () => {
  it('aligns host addresses to the network', () => {
    const c = parseCidr('10.0.1.5/16')
    assert.equal(c.aligned, true)
    assert.equal(intToIp(c.network), '10.0.0.0')
    assert.equal(c.prefix, 16)
  })
  it('keeps already-aligned networks', () => {
    const c = parseCidr('10.33.0.0/22')
    assert.equal(c.aligned, false)
    assert.equal(intToIp(c.network), '10.33.0.0')
  })
})

describe('parsePrefix', () => {
  it('accepts 26 or /26', () => {
    assert.equal(parsePrefix('26'), 26)
    assert.equal(parsePrefix('/26'), 26)
  })
  it('rejects out of range', () => {
    assert.throws(() => parsePrefix('33'), /0 and 32/)
  })
})

describe('usableCount', () => {
  it('uses RFC 3021 for /31 and /32', () => {
    assert.equal(usableCount(24), 254)
    assert.equal(usableCount(30), 2)
    assert.equal(usableCount(31), 2)
    assert.equal(usableCount(32), 1)
  })
})

describe('calculateSubnets', () => {
  it('splits 192.168.1.0/24 into /26', () => {
    const r = calculateSubnets('192.168.1.0/24', '26')
    assert.equal(r.count, 4)
    assert.deepEqual(
      r.subnets.map((s) => s.network),
      ['192.168.1.0', '192.168.1.64', '192.168.1.128', '192.168.1.192'],
    )
    assert.equal(r.subnets[0].range, '192.168.1.0 – 192.168.1.63')
    assert.equal(r.subnets[0].firstUsable, '192.168.1.1')
    assert.equal(r.subnets[0].lastUsable, '192.168.1.62')
    assert.equal(r.subnets[0].broadcast, '192.168.1.63')
    assert.equal(r.subnets[0].usable, 62)
  })

  it('splits 10.0.0.0/16 into /21', () => {
    const r = calculateSubnets('10.0.0.0/16', 21)
    assert.equal(r.count, 32)
    assert.equal(r.subnets[0].network, '10.0.0.0')
    assert.equal(r.subnets[0].range, '10.0.0.0 – 10.0.7.255')
    assert.equal(r.subnets[1].network, '10.0.8.0')
  })

  it('matches the lab VPC 10.33.0.0/22 into /26', () => {
    const r = calculateSubnets('10.33.0.0/22', '/26')
    assert.equal(r.count, 16)
    assert.equal(r.subnets[0].network, '10.33.0.0')
    assert.equal(r.subnets[1].network, '10.33.0.64')
    assert.equal(r.subnets[15].network, '10.33.3.192')
  })

  it('treats equal prefix as a single subnet', () => {
    const r = calculateSubnets('10.0.0.0/24', '24')
    assert.equal(r.count, 1)
    assert.equal(r.subnets[0].network, '10.0.0.0')
  })

  it('handles /31 point-to-point', () => {
    const r = calculateSubnets('192.168.1.0/24', '31')
    assert.equal(r.subnets[0].usable, 2)
    assert.equal(r.subnets[0].firstUsable, '192.168.1.0')
    assert.equal(r.subnets[0].lastUsable, '192.168.1.1')
    assert.equal(r.subnets[0].broadcast, '—')
  })

  it('handles /32 hosts', () => {
    const r = calculateSubnets('10.0.0.1/32', '32')
    assert.equal(r.count, 1)
    assert.equal(r.subnets[0].usable, 1)
    assert.equal(r.subnets[0].network, '10.0.0.1')
  })

  it('aligns then splits', () => {
    const r = calculateSubnets('10.0.1.5/16', '24')
    assert.equal(r.aligned, true)
    assert.equal(r.network, '10.0.0.0')
    assert.equal(r.subnets[0].network, '10.0.0.0')
    assert.equal(r.subnets[1].network, '10.0.1.0')
  })

  it('rejects supernetting', () => {
    assert.throws(() => calculateSubnets('10.0.0.0/24', '16'), /shorter/)
  })

  it('caps huge results', () => {
    const r = calculateSubnets('10.0.0.0/8', '24', { maxRows: 16 })
    assert.equal(r.count, 65536)
    assert.equal(r.truncated, true)
    assert.equal(r.subnets.length, 16)
  })
})
