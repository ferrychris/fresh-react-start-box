// Test runner script
import { testPostCreation } from './test-post-integration';

// Make the test function available globally
(window as any).runPostTest = async () => {
  console.log('Running post integration test...');
  const result = await testPostCreation();
  console.log('Test completed with result:', result);
  return result;
};

console.log('Test runner loaded. Run the test by executing: runPostTest()');
