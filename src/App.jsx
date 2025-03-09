// src/App.jsx
import { useState } from 'react';
import './App.css';

function App() {
  const [network, setNetwork] = useState('');
  const [mask, setMask] = useState('');
  const [subnets, setSubnets] = useState([]);

  const calculateSubnets = () => {
    if (!network || !mask) {
      alert('Please enter a network and mask.');
      return;
    }

    const [ip, baseMask] = network.split('/');
    const baseMaskNum = parseInt(baseMask);
    const targetMaskNum = parseInt(mask);

    if (!ip || isNaN(baseMaskNum) || isNaN(targetMaskNum) || baseMaskNum >= targetMaskNum || targetMaskNum > 32) {
      alert('Invalid input! Ensure base mask < target mask (e.g., 10.0.0.0/16, 21).');
      return;
    }

    const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
    const subnetSize = 2 ** (32 - targetMaskNum);
    const subnetCount = 2 ** (targetMaskNum - baseMaskNum);
    const newSubnets = [];

    for (let i = 0; i < subnetCount; i++) {
      const start = ipInt + i * subnetSize;
      const end = start + subnetSize - 1;
      newSubnets.push({
        address: intToIp(start),
        mask: targetMaskNum,
        range: `${intToIp(start)} - ${intToIp(end)}`,
        usable: subnetSize - 2,
      });
    }

    setSubnets(newSubnets);
  };

  const intToIp = (int) => {
    return [
      (int >> 24) & 255,
      (int >> 16) & 255,
      (int >> 8) & 255,
      int & 255,
    ].join('.');
  };

  return (
    <div className="app">
      <h1>Subnet Calculator</h1>
      <div>
        <label>
          Network (e.g., 10.0.0.0/16):
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="10.0.0.0/16"
          />
        </label>
        <label>
          Mask (e.g., 21):
          <input
            type="number"
            value={mask}
            onChange={(e) => setMask(e.target.value)}
            placeholder="21"
            min="1"
            max="32"
          />
        </label>
        <button onClick={calculateSubnets}>Calculate</button>
      </div>
      {subnets.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Mask</th>
              <th>Range</th>
              <th>Usable IPs</th>
            </tr>
          </thead>
          <tbody>
            {subnets.map((subnet, index) => (
              <tr key={index}>
                <td>{subnet.address}</td>
                <td>/{subnet.mask}</td>
                <td>{subnet.range}</td>
                <td>{subnet.usable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No subnets yet—enter a network and mask above.</p>
      )}
    </div>
  );
}

export default App;