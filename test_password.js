const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const weakPasswordData = JSON.stringify({
    username: 'teststudent2',
    password: 'weak',
    role: 'STUDENT',
    name: 'Test Student'
});

const strongPasswordData = JSON.stringify({
    username: 'teststudent_strong',
    password: 'StrongPassword123!',
    role: 'STUDENT',
    name: 'Test Student Strong'
});

function makeRequest(data, desc) {
    return new Promise((resolve) => {
        console.log(`\nTesting ${desc}...`);
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`Status ${res.statusCode} - ${body}`);
                resolve();
            });
        });
        req.on('error', e => {
            console.error(`Problem with request: ${e.message}`);
            resolve();
        });
        req.write(data);
        req.end();
    });
}

async function testPasswords() {
    await makeRequest(weakPasswordData, 'weak password');
    await makeRequest(strongPasswordData, 'strong password');
}

testPasswords();
