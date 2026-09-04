const MAX_ROWS = 1024

export function intToIp(n) {
  const x = n >>> 0
  return [
    (x >>> 24) & 255,
    (x >>> 16) & 255,
    (x >>> 8) & 255,
    x & 255,
  ].join('.')
}

export function parseIPv4(s) {
  const parts = String(s).trim().split('.')
  if (parts.length !== 4) {
    throw new Error('IPv4 address must have four octets (e.g. 10.33.0.0).')
  }
  const octets = parts.map((p) => {
    if (!/^\d+$/.test(p)) {
      throw new Error(`Invalid octet "${p}".`)
    }
    const n = Number(p)
    if (n > 255) {
      throw new Error(`Octet ${n} is out of range (0–255).`)
    }
    return n
  })
  return octets.reduce((acc, o) => ((acc << 8) + o) >>> 0, 0)
}

export function parsePrefix(s) {
  const t = String(s).trim().replace(/^\//, '')
  if (!/^\d+$/.test(t)) {
    throw new Error('Prefix must be an integer 0–32 (e.g. 26 or /26).')
  }
  const n = Number(t)
  if (n > 32) {
    throw new Error('Prefix must be between 0 and 32.')
  }
  return n
}

export function parseCidr(s) {
  const t = String(s).trim()
  const m = t.match(/^([^/]+)\/(\d+)$/)
  if (!m) {
    throw new Error('Network must be CIDR form, e.g. 10.33.0.0/22.')
  }
  const ip = parseIPv4(m[1])
  const prefix = parsePrefix(m[2])
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const network = (ip & mask) >>> 0
  return { ip, prefix, network, aligned: network !== ip }
}

export function blockSize(prefix) {
  return 2 ** (32 - prefix)
}

export function usableCount(prefix) {
  if (prefix === 32) return 1
  if (prefix === 31) return 2
  return blockSize(prefix) - 2
}

function rowFor(start, prefix) {
  const size = blockSize(prefix)
  const end = (start + size - 1) >>> 0
  const row = {
    network: intToIp(start),
    prefix,
    range: `${intToIp(start)} – ${intToIp(end)}`,
    usable: usableCount(prefix),
    broadcast: '—',
    firstUsable: intToIp(start),
    lastUsable: intToIp(end),
  }
  if (prefix <= 30) {
    row.broadcast = intToIp(end)
    row.firstUsable = intToIp((start + 1) >>> 0)
    row.lastUsable = intToIp((end - 1) >>> 0)
  } else if (prefix === 32) {
    row.lastUsable = intToIp(start)
  }
  return row
}

export function calculateSubnets(cidrStr, maskInput, { maxRows = MAX_ROWS } = {}) {
  const { ip, prefix, network, aligned } = parseCidr(cidrStr)
  const target = parsePrefix(maskInput)
  if (target < prefix) {
    throw new Error(
      `Target /${target} is shorter than the network /${prefix}. This tool splits into smaller subnets, not supernets.`,
    )
  }
  const count = 2 ** (target - prefix)
  const size = blockSize(target)
  const truncated = count > maxRows
  const n = Math.min(count, maxRows)
  const subnets = []
  for (let i = 0; i < n; i++) {
    const start = (network + i * size) >>> 0
    subnets.push(rowFor(start, target))
  }
  return {
    aligned,
    original: intToIp(ip),
    network: intToIp(network),
    prefix,
    target,
    count,
    size,
    truncated,
    maxRows,
    subnets,
  }
}
