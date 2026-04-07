import app, { connectDB, seedUsers } from '../server-simple.js';

let isInitialized = false;

export default async (req, res) => {
  if (!isInitialized) {
    try {
      await connectDB();
      await seedUsers();
      isInitialized = true;
    } catch (error) {
      console.error('Serverless initialization failed:', error.message);
    }
  }
  return app(req, res);
};
