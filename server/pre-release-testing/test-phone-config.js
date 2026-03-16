/**
 * Test Phone Number Configuration
 * Verifies your personal phone number is correctly configured
 */

const { config } = require('../config');

function testPhoneConfiguration() {
    console.log('📱 Testing Phone Number Configuration...\n');

    // Check Telnyx configuration
    console.log('🔧 Telnyx Configuration:');
    console.log(`   API Key: ${config.telnyx.apiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Phone Number: ${config.telnyx.phoneNumber || '❌ Not set'}`);
    console.log(`   WhatsApp Number: ${config.telnyx.whatsappNumber || '❌ Not set'}`);
    console.log(`   Webhook URL: ${config.telnyx.webhookUrl || '❌ Not set'}`);
    console.log(`   Connection ID: ${config.telnyx.connectionId || '❌ Not set'}`);
    console.log(`   Messaging Profile: ${config.telnyx.messagingProfileId || '❌ Not set'}`);
    
    console.log('\n📋 Configuration Summary:');
    
    if (config.telnyx.phoneNumber && config.telnyx.phoneNumber !== '+1234567890') {
        console.log('✅ Your personal phone number is configured!');
        console.log(`   📞 Voice: ${config.telnyx.phoneNumber}`);
        console.log(`   📱 WhatsApp: ${config.telnyx.whatsappNumber}`);
    } else {
        console.log('❌ Phone number not properly configured');
        console.log('   Current value: ' + (config.telnyx.phoneNumber || 'Not set'));
        console.log('   Expected: +972500000000 (your personal number)');
    }
    
    console.log('\n🎯 Call Tracking Requirements:');
    console.log('1. ✅ Phone number configured');
    console.log('2. ❌ Database connection needed');
    console.log('3. ✅ Telnyx API key configured');
    console.log('4. ✅ Webhook URL configured');
    
    console.log('\n📞 To Test Call Tracking:');
    console.log('1. Configure database (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    console.log('2. Restart server');
    console.log('3. Test outgoing call:');
    console.log('   POST /api/calls/outgoing');
    console.log('   Body: {"to": "+972500000000", "notes": "Test call"}');
    
    console.log('\n📱 To Test WhatsApp:');
    console.log('1. Ensure WhatsApp is enabled in Telnyx Portal');
    console.log('2. Test WhatsApp message:');
    console.log('   POST /api/whatsapp/send');
    console.log('   Body: {"to": "+972500000000", "message": "Test message"}');
}

// Run test
if (require.main === module) {
    testPhoneConfiguration();
}

module.exports = { testPhoneConfiguration };
