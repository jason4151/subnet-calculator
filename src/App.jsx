import { useState } from 'react'
import './App.css'
import { calculateSubnets } from './subnet.js'

export default function App() {
  const [network, setNetwork] = useState('10.33.0.0/22')
  const [mask, setMask] = useState('26')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    try {
      setResult(calculateSubnets(network, mask))
      setError('')
    } catch (err) {
      setResult(null)
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Subnet calculator</h1>
        <p className="lede">
          Split a CIDR into equal child subnets. Host bits in the network field
          are aligned down to the prefix.
        </p>
      </header>

      <form onSubmit={onSubmit} className="form">
        <label>
          Network
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="10.33.0.0/22"
            autoComplete="off"
            spellCheck="false"
          />
        </label>
        <label>
          Target prefix
          <input
            type="text"
            value={mask}
            onChange={(e) => setMask(e.target.value)}
            placeholder="/26"
            autoComplete="off"
            spellCheck="false"
          />
        </label>
        <button type="submit">Calculate</button>
      </form>

      {error ? <p className="error" role="alert">{error}</p> : null}

      {result ? (
        <section className="results">
          <p className="summary">
            {result.aligned ? (
              <>
                Aligned <code>{result.original}/{result.prefix}</code> to{' '}
                <code>
                  {result.network}/{result.prefix}
                </code>
                .{' '}
              </>
            ) : null}
            {result.count.toLocaleString()} × /{result.target}
            {result.count === 1 ? ' subnet' : ' subnets'}
            {' '}({result.size.toLocaleString()} addresses each).
            {result.truncated
              ? ` Showing the first ${result.maxRows.toLocaleString()} of ${result.count.toLocaleString()}. Narrow the range if you need the rest.`
              : null}
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Network</th>
                  <th>Range</th>
                  <th>First usable</th>
                  <th>Last usable</th>
                  <th>Broadcast</th>
                  <th>Usable</th>
                </tr>
              </thead>
              <tbody>
                {result.subnets.map((s) => (
                  <tr key={`${s.network}/${s.prefix}`}>
                    <td>
                      <code>
                        {s.network}/{s.prefix}
                      </code>
                    </td>
                    <td>{s.range}</td>
                    <td>{s.firstUsable}</td>
                    <td>{s.lastUsable}</td>
                    <td>{s.broadcast}</td>
                    <td>{s.usable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
