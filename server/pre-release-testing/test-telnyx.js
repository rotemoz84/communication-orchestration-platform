/**
 * Telnyx Migration Test Script
 * Tests the Telnyx integration after migration
 */

const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  baseUrl: 'http://localhost:3003/api',
  yourPhoneNumber: '+972500000000', // Replace with your actual phone number
};

async function testTelnyxMigration() {
  console.log('🔄 Testing Telnyx Migration...\n');

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

    // Test 3: Test WhatsApp message with Telnyx
    console.log('3️⃣ Testing WhatsApp with Telnyx...');
    try {
      const whatsapp = await axios.post(`${CONFIG.baseUrl}/whatsapp/send`, {
        to: CONFIG.yourPhoneNumber,
        message: '🎉 Testing Telnyx WhatsApp integration!'
      });
      
      if (whatsapp.data.success) {
        console.log('✅ WhatsApp message sent via Telnyx');
        console.log('   Message ID:', whatsapp.data.result.messageId);
        console.log('   Status:', whatsapp.data.result.status);
      } else {
        console.log('❌ WhatsApp test failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('Telnyx not configured')) {
        console.log('⚠️  Telnyx not configured - add TELNYX_API_KEY to .env');
      } else {
        console.log('❌ WhatsApp test failed:', errorMsg);
      }
    }
    console.log('');

    // Test 4: Test outgoing call with Telnyx
    console.log('4️⃣ Testing outgoing call with Telnyx...');
    try {
      const call = await axios.post(`${CONFIG.baseUrl}/calls/outgoing`, {
        to: CONFIG.yourPhoneNumber,
        notes: 'Test call via Telnyx'
      });
      
      if (call.data.success) {
        console.log('✅ Outgoing call initiated via Telnyx');
        console.log('   Call ID:', call.data.callId);
        console.log('   Provider Call ID:', call.data.providerCallId);
      } else {
        console.log('❌ Call test failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('Telnyx not configured')) {
        console.log('⚠️  Telnyx not configured - add TELNYX credentials to .env');
      } else {
        console.log('❌ Call test failed:', errorMsg);
      }
    }
    console.log('');

    // Test 5: Check IVR settings
    console.log('5️⃣ Testing IVR controls...');
    const ivrSettings = await axios.get(`${CONFIG.baseUrl}/ivr/settings`);
    console.log('✅ IVR settings accessible');
    console.log('   Emergency mode:', ivrSettings.data.settings.emergencyMode);
    console.log('   Call forwarding:', ivrSettings.data.settings.callForwarding);
    console.log('   WhatsApp fallback:', ivrSettings.data.settings.whatsappFallback);
    console.log('');

    console.log('🎉 Telnyx migration test completed!');
    console.log('');
    console.log('📋 Migration Status:');
    console.log('✅ Server running');
    console.log('✅ IVR system active');
    console.log('✅ API endpoints updated');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Get Telnyx credentials from portal.telnyx.com');
    console.log('2. Update your .env file with TELNYX_* variables');
    console.log('3. Configure webhooks in Telnyx Portal');
    console.log('4. Test with real phone numbers');
    console.log('');
    console.log('📚 For current Telnyx documentation, see: ../docs/server/TELNYX_CONNECTION_GUIDE.md');

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
  console.log('📞 Telnyx Migration Test');
  console.log('========================\n');
  
  console.log('⚠️  IMPORTANT: Update CONFIG.yourPhoneNumber in this file');
  console.log('⚠️  Current setting: +972500000000 (change to your number)\n');
  
  testTelnyxMigration();
}

module.exports = { testTelnyxMigration };
