/**
 * Test Webhook Configuration
 * Tests if your webhook endpoints are accessible
 */

const axios = require('axios');

const WEBHOOK_BASE = 'https://api.drozyuval.com';

async function testWebhookEndpoints() {
    console.log('🔗 Testing webhook endpoints...\n');

    const endpoints = [
        '/api/whatsapp/incoming',
        '/api/whatsapp/status',
        '/api/voice/incoming',
        '/api/voice/status'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${WEBHOOK_BASE}${endpoint}`);
            
            // Test with a simple GET request (should return 404 or 405, but be accessible)
            const response = await axios.get(`${WEBHOOK_BASE}${endpoint}`, {
                timeout: 10000,
                validateStatus: false // Don't throw on non-2xx status
            });
            
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${endpoint} - Connection refused (server not running)`);
            } else if (error.code === 'ENOTFOUND') {
                console.log(`❌ ${endpoint} - Domain not found`);
            } else if (error.code === 'ETIMEDOUT') {
                console.log(`❌ ${endpoint} - Connection timeout`);
            } else {
                console.log(`❌ ${endpoint} - Error: ${error.message}`);
            }
        }
    }

    console.log('\n📋 Webhook Configuration Summary:');
    console.log('1. If all endpoints show ✅, your webhook URLs are accessible');
    console.log('2. If endpoints show ❌, check:');
    console.log('   - Your server is running and accessible');
    console.log('   - DNS is configured for api.drozyuval.com');
    console.log('   - Firewall allows incoming connections');
    console.log('   - SSL certificate is valid (for HTTPS)');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Configure these URLs in Telnyx Portal');
    console.log('2. Test with a real WhatsApp message');
    console.log('3. Check server logs for webhook events');
}

// Run test
if (require.main === module) {
    testWebhookEndpoints();
}

module.exports = { testWebhookEndpoints };
