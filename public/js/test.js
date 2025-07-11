// Simple test script to verify API endpoints
const testAPI = async () => {
    try {
        // Test health endpoint
        const healthResponse = await fetch('/health');
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
        
        // Test session creation
        const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const sessionData = await sessionResponse.json();
        console.log('Session creation:', sessionData);
        
        // Test file listing
        const filesResponse = await fetch('/api/pdf/files');
        const filesData = await filesResponse.json();
        console.log('Files listing:', filesData);
        
    } catch (error) {
        console.error('API test failed:', error);
    }
};

// Run test when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testAPI, 1000);
});
