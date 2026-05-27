/**
 * Quick Test Script for Phone Setup
 * Run this to test your configuration
 */

const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  baseUrl: 'http://localhost:3003/api',
  yourPhoneNumber: '+972500000000', // Replace with your actual phone number
};

async function testConnection() {
  console.log('🧪 Testing Phone Connection Setup...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connection...');
    const health = await axios.get(`${CONFIG.baseUrl.replace('/api', '')}/health`);
    console.log('✅ Server is running:', health.data.status);
    console.log('   Timezone:', health.data.timezone);
    console.log('');

    // Test 2: Check IVR status
    console.log('2️⃣ Testing IVR system...');
    const ivrStatus = await axios.get(`${CONFIG.baseUrl}/voice/status`);
    console.log('✅ IVR system active');
    console.log('   Office open:', ivrStatus.data.officeOpen);
    console.log('');

    // Test 3: Test WhatsApp message
    console.log('3️⃣ Testing WhatsApp message...');
    try {
      const whatsapp = await axios.post(`${CONFIG.baseUrl}/whatsapp/send`, {
        to: CONFIG.yourPhoneNumber,
        message: '🎉 Test message from your communication system!'
      });
      
      if (whatsapp.data.result.mock) {
        console.log('⚠️  WhatsApp in mock mode (Twilio not configured)');
        console.log('   Message would be sent to:', CONFIG.yourPhoneNumber);
        console.log('   Message:', '🎉 Test message from your communication system!');
      } else {
        console.log('✅ WhatsApp message sent');
        console.log('   Message SID:', whatsapp.data.result.sid);
        console.log('   Status:', whatsapp.data.result.status);
      }
    } catch (error) {
      console.log('❌ WhatsApp test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Test outgoing call
    console.log('4️⃣ Testing outgoing call...');
    try {
      const call = await axios.post(`${CONFIG.baseUrl}/calls/outgoing`, {
        to: CONFIG.yourPhoneNumber,
        notes: 'Test call from system setup'
      });
      
      if (call.data.mock) {
        console.log('⚠️  Call in mock mode (Twilio not configured)');
        console.log('   Call would be made to:', CONFIG.yourPhoneNumber);
      } else {
        console.log('✅ Outgoing call initiated');
        console.log('   Call ID:', call.data.callId);
        console.log('   Provider Call ID:', call.data.providerCallId);
      }
    } catch (error) {
      console.log('❌ Call test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Check call statistics
    console.log('5️⃣ Testing call statistics...');
    const today = new Date().toISOString().split('T')[0];
    const stats = await axios.get(`${CONFIG.baseUrl}/calls/stats?startDate=${today}&endDate=${today}`);
    console.log('✅ Call statistics working');
    console.log('   Total calls today:', stats.data.stats.total || 0);
    console.log('');

    // Test 6: Check IVR settings
    console.log('6️⃣ Testing IVR controls...');
    const ivrSettings = await axios.get(`${CONFIG.baseUrl}/ivr/settings`);
    console.log('✅ IVR settings accessible');
    console.log('   Emergency mode:', ivrSettings.data.settings.emergencyMode);
    console.log('   Call forwarding:', ivrSettings.data.settings.callForwarding);
    console.log('   WhatsApp fallback:', ivrSettings.data.settings.whatsappFallback);
    console.log('');

    console.log('🎉 Setup test completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. If you see "mock mode" messages, configure your Twilio credentials in .env');
    console.log('2. Set up Twilio webhooks to point to your server');
    console.log('3. Try calling your Twilio number to test the IVR system');
    console.log('4. Send WhatsApp messages to test the bot functionality');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Start it with: npm run dev');
    } else {
      console.log('❌ Test failed:', error.response?.data?.error || error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  console.log('📞 Communication Platform Setup Test');
  console.log('=====================================\n');
  
  console.log('⚠️  IMPORTANT: Update CONFIG.yourPhoneNumber in this file');
  console.log('⚠️  Current setting: +972500000000 (change to your number)\n');
  
  testConnection();
}

module.exports = { testConnection };
