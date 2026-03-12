import mongoose from 'mongoose';
import { UserRole, RequestStage } from '../types';
import User from '../models/User';
import RequestModel from '../models/Request';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-approval';

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const userRes = await User.updateMany(
            { role: 'DEAN' },
            { $set: { role: 'STUDENT_AFFAIRS' } }
        );
        console.log(`Updated ${userRes.modifiedCount} users.`);

        // Note: If using strict validation on enums in the model, we may need to bypass validation
        const reqRes = await RequestModel.collection.updateMany(
            { currentStage: 'DEAN_APPROVAL' },
            { $set: { currentStage: 'STUDENT_AFFAIRS_APPROVAL' } }
        );
        console.log(`Updated ${reqRes.modifiedCount} requests.`);

        // Also update any logs referring to DEAN
        const logRes = await RequestModel.collection.updateMany(
            { "logs.actorName": "Dean Williams" },
            { $set: { "logs.$[elem].actorName": "Student Affairs" } },
            { arrayFilters: [{ "elem.actorName": "Dean Williams" }] }
        );

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
