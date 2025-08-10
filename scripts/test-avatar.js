import crypto from 'crypto';

/**
 * Generate a simple default avatar for testing purposes
 * @param {string} identifier - User identifier (email or username)
 * @returns {Object} Avatar object with URL, seed, and provider info
 */
function generateTestAvatar(identifier) {
  const seed = crypto
    .createHash('md5')
    .update(identifier.toLowerCase())
    .digest('hex')
    .substring(0, 8);

  const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg';
  const url = `${baseUrl}?seed=${seed}&size=200&backgroundColor=b6e3f4,c4b5fd,a78bfa&radius=50`;

  return { url, seed, provider: 'dicebear' };
}

/**
 * Test default avatar generation functionality
 * @description Tests avatar generation with multiple identifiers and displays results
 */
function testDefaultAvatar() {
  console.log('🧪 Testing default avatar generation...\n');

  const testCases = [
    'john.doe@example.com',
    'jane.smith@test.com',
    'bob123',
    'alice.wonderland@gmail.com',
  ];

  testCases.forEach((identifier, index) => {
    const avatar = generateTestAvatar(identifier);
    console.log(`${index + 1}. 👤 ${identifier}`);
    console.log(`   🔗 ${avatar.url}`);
    console.log(`   🎲 Seed: ${avatar.seed}\n`);
  });

  console.log('✅ Default avatar tests completed successfully!');
  console.log('💡 URLs can be opened in a browser to view the avatars.');
}

/**
 * Execute avatar tests
 * @description Main execution function for running avatar generation tests
 */
testDefaultAvatar();
