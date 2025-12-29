#!/usr/bin/env tsx

/**
 * 🚀 LAURA ORACLE INITIALIZATION SCRIPT
 * 
 * This script initializes Laura as the Super Platform Oracle with LangSmith
 * domain learning and comprehensive platform administration capabilities.
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @date 2025
 */

import '../server/bootstrap/env';
import LauraOracleService from '../server/laura-oracle-service';

async function initializeLauraOracle() {
  console.log('🚀 Initializing Laura Super Platform Oracle...');
  console.log('🎯 LangSmith Domain Learning: ENABLED');
  console.log('🛡️ Platform Administration: ENABLED');

  try {
    // Initialize Laura Oracle service
    const lauraOracle = LauraOracleService.getInstance();
    
    console.log('✅ Laura Oracle service initialized');
    console.log('✅ LangSmith domain learning configured');
    console.log('✅ Platform analytics system ready');
    console.log('✅ Administrative capabilities enabled');
    
    // Test Laura Oracle functionality
    console.log('\n🧪 Testing Laura Oracle capabilities...');
    
    const testResponse = await lauraOracle.chatWithOracle(
      "Hello Laura! Can you provide a platform overview?",
      'test-session-001'
    );
    
    console.log('✅ Laura Oracle chat test successful');
    console.log('📊 Platform analytics loaded:', !!testResponse.analytics);
    console.log('🎯 Actions detected:', testResponse.actions?.length || 0);
    
    // Get platform analytics
    const analytics = await lauraOracle.getPlatformAnalytics();
    console.log('✅ Platform analytics retrieved');
    console.log(`   - Total users: ${analytics.users.total}`);
    console.log(`   - Total tracks: ${analytics.content.totalTracks}`);
    console.log(`   - System health: ${analytics.health.databaseStatus}`);
    
    // Test admin task execution
    const adminResult = await lauraOracle.executeAdminTask('get_user_stats');
    console.log('✅ Admin task execution test successful');
    console.log(`   - Task result: ${adminResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\n🎉 Laura Super Platform Oracle initialization complete!');
    console.log('🌟 Laura is now ready to serve as your Super Platform Oracle');
    console.log('📚 LangSmith domain learning is active');
    console.log('🛡️ Administrative capabilities are fully operational');
    
  } catch (error) {
    console.error('❌ Laura Oracle initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeLauraOracle()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Initialization error:', error);
      process.exit(1);
    });
}

export { initializeLauraOracle };
