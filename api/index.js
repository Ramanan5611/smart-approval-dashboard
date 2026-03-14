import app, { connectDB, seedUsers } from '../server-simple.js';

let isInitialized = false;

export default async (req, res) => {
  if (!isInitialized) {
    await connectDB();
    await seedUsers();
    isInitialized = true;
  }
  return app(req, res);
};
