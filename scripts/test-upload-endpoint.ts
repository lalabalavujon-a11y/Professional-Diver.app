/**
 * Quick test script to verify the upload endpoint is working
 */
async function testUploadEndpoint() {
  const testFile = new Blob(['test audio content'], { type: 'audio/m4a' });
  const formData = new FormData();
  formData.append('file', testFile, 'test.m4a');

  try {
    const response = await fetch('http://127.0.0.1:5000/api/objects/upload-local/test-upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('✅ Upload endpoint is working!');
    console.log('Response:', result);
  } catch (error: any) {
    console.error('❌ Upload endpoint test failed:');
    console.error('Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Server is running: npm run dev:api');
    console.error('   2. Server has been restarted after code changes');
    console.error('   3. Port 5000 is accessible');
  }
}

// Note: This script needs to run in a browser context or with node-fetch
console.log('Run this in browser console or use curl to test the endpoint');

