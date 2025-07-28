const https = require('http');

async function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runMigration() {
    console.log('=== Database Migration Tool ===\n');
    
    try {
        console.log('Step 1: Analyzing current database...');
        const analysis = await makeRequest('GET', '/api/admin/migrate-database');
        console.log('Analysis Results:');
        console.log(JSON.stringify(analysis, null, 2));
        console.log('\n' + '='.repeat(50) + '\n');
        
        console.log('Step 2: Running migration...');
        const migration = await makeRequest('POST', '/api/admin/migrate-database');
        console.log('Migration Results:');
        console.log(JSON.stringify(migration, null, 2));
        
        console.log('\n=== Migration Complete ===');
    } catch (error) {
        console.error('Error:', error.message);
        console.log('Make sure your development server is running: npm run dev');
    }
}

runMigration();
