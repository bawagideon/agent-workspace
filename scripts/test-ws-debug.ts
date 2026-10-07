import fs from 'fs';
import path from 'path';
import os from 'os';

async function testWs() {
  console.log('Testing WebSocket connection to ws://127.0.0.1:18789...');

  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.gateway?.auth?.token;
  console.log('Gateway token:', token ? `${token.substring(0, 8)}...` : 'NONE');

  const ws = new WebSocket('ws://127.0.0.1:18789');

  ws.onopen = () => {
    console.log('✅ WebSocket open event fired');
  };

  ws.onmessage = (event) => {
    console.log('📩 Message from server:', event.data.toString());
    const data = JSON.parse(event.data.toString());
    if (data.type === 'event' && data.event === 'connect.challenge') {
      console.log('⚡ Sending handshake response...');
      const req = {
        type: 'req',
        id: 'handshake-1',
        method: 'connect',
        params: {
          minProtocol: 4,
          maxProtocol: 4,
          client: {
            id: 'gateway-client',
            version: '2026.9.3',
            platform: process.platform,
            mode: 'backend'
          },
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          auth: { token }
        }
      };
      ws.send(JSON.stringify(req));
    } else if (data.type === 'res' && data.id === 'handshake-1') {
      console.log('✅ Handshake response:', JSON.stringify(data));
      ws.close();
      process.exit(0);
    }
  };

  ws.onerror = (err) => {
    console.error('❌ WebSocket error:', err);
  };

  ws.onclose = (event) => {
    console.log('🔌 WebSocket closed:', event.code, event.reason);
  };

  setTimeout(() => {
    console.log('Timed out waiting for handshake.');
    ws.close();
    process.exit(1);
  }, 10000);
}

testWs().catch(console.error);
