const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = http.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: buf ? JSON.parse(buf) : null, raw: buf });
        } catch {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(data));
      req.write(data);
    }
    req.end();
  });
}

async function runSmokeTest() {
  console.log('1. Checking Backend Rates Endpoint...');
  const ratesRes = await request({ hostname: 'localhost', port: 4568, path: '/api/rates', method: 'GET' });
  if (ratesRes.status !== 200 || !Array.isArray(ratesRes.data)) {
    throw new Error('Rates endpoint failed with status ' + ratesRes.status);
  }
  console.log('Rates verified. Route count: ' + ratesRes.data.length);

  console.log('2. Authenticating Student STU-2026-BDT01 against PostgreSQL...');
  const loginRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/auth/login', method: 'POST' },
    { studentIdOrEmail: 'STU-2026-BDT01', password: 'student123', permissionTier: 'EXECUTE' }
  );
  if (loginRes.status !== 201 || !loginRes.data?.accessToken) {
    throw new Error('Login failed with status ' + loginRes.status + ': ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.accessToken;
  const authHeaders = { Authorization: 'Bearer ' + token };
  console.log('Authentication successful. Bearer token acquired.');

  console.log('3. Comparing Remittance Corridors for $3,000 USD...');
  const compareRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/routes/compare', method: 'POST', headers: authHeaders },
    { amountUsd: 3000, preference: 'balanced' }
  );
  if (compareRes.status !== 201) {
    throw new Error('Route comparison failed with status ' + compareRes.status);
  }
  console.log('Route comparison completed successfully.');

  console.log('4. Creating Tuition Payment Draft in PostgreSQL...');
  const draftRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/transfers/draft', method: 'POST', headers: authHeaders },
    {
      studentId: 'STU-2026-BDT01',
      routeId: 'route-edupay-prime',
      amountUsd: 3000,
      recipientUniversity: 'University of Oxford',
    }
  );
  if (draftRes.status !== 201 || !draftRes.data?.transferId || !draftRes.data?.confirmationToken) {
    throw new Error('Draft creation failed with status ' + draftRes.status + ': ' + JSON.stringify(draftRes.data));
  }
  const transferId = draftRes.data.transferId;
  const confirmationToken = draftRes.data.confirmationToken;
  console.log('Draft created: ' + transferId + ', required BDT: ' + draftRes.data.sourceAmountBdt);

  console.log('5. Requesting Step-Up 2FA OTP...');
  const otpRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/auth/step-up-otp', method: 'POST', headers: authHeaders }
  );
  if (otpRes.status !== 201 || !otpRes.data?.otp) {
    throw new Error('OTP request failed with status ' + otpRes.status);
  }
  const otp = otpRes.data.otp;
  console.log('Step-Up OTP issued: ' + otp);

  console.log('6. Executing Payment Confirmation with Step-Up OTP...');
  const confirmRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/transfers/' + transferId + '/confirm', method: 'POST', headers: authHeaders },
    { confirmationToken, userConsent: true, twoFactorPin: otp }
  );
  if (confirmRes.status !== 201 || confirmRes.data?.status !== 'CONFIRMED') {
    throw new Error('Payment confirmation failed with status ' + confirmRes.status + ': ' + JSON.stringify(confirmRes.data));
  }
  console.log('Payment confirmed. New student balance: ' + confirmRes.data.newBalanceBdt + ' BDT');

  console.log('7. Verifying PostgreSQL Transfer History Persistence...');
  const txRes = await request(
    { hostname: 'localhost', port: 4568, path: '/api/transfers', method: 'GET', headers: authHeaders }
  );
  if (txRes.status !== 200 || !Array.isArray(txRes.data) || txRes.data.length === 0) {
    throw new Error('Transfer history verification failed with status ' + txRes.status);
  }
  console.log('Transfer persistence verified in PostgreSQL. Count: ' + txRes.data.length);

  console.log('8. Verifying Frontend HTML Rendering...');
  const frontendRes = await request({ hostname: 'localhost', port: 4567, path: '/', method: 'GET' });
  if (frontendRes.status !== 200) {
    throw new Error('Frontend check failed with status ' + frontendRes.status);
  }
  console.log('Frontend rendered successfully with status ' + frontendRes.status);
  console.log('All containerized smoke tests passed cleanly.');
}

runSmokeTest().catch((err) => {
  console.log('::error title=Smoke Test Error::' + (err.message || String(err)).replace(/[\r\n]+/g, ' '));
  console.error('Smoke test failed:', err);
  process.exit(1);
});
