import PocketBase from 'pocketbase';

// Connect to your local PocketBase server
// We use an environment variable so we can change it later when we deploy to the cloud
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Disable auto-cancellation to prevent issues with React re-renders
pb.autoCancellation(false);

export default pb;