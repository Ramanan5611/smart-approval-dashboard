const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const data = JSON.stringify({
    username: 'testuser',
    password: 'Password123!'
});

async function testRateLimit() {
    console.log('Testing rate limit on /api/auth/login...');
    for (let i = 1; i <= 6; i++) {
        await new Promise((resolve) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    console.log(`Request ${i}: Status ${res.statusCode} - ${body}`);
                    resolve();
                });
            });
            req.on('error', e => {
                console.error(`Problem with request ${i}: ${e.message}`);
                resolve();
            });
            req.write(data);
            req.end();
        });
    }
}

testRateLimit();
