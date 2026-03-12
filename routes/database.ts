import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/index';
import { UserRole } from '../types';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    });
};

// Middleware to check if user is an ADMIN
const isAdmin = async (req: any, res: any, next: any) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Apply middlewares to all routes in this router
router.use(authenticateToken);
router.use(isAdmin);

// GET all database collections
router.get('/collections', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        // Get the native MongoDB database object via Mongoose
        const db = mongoose.connection.db;

        // Safety check; type system isn't strictly aware if 'db' exists right after state=1 check
        if (!db) {
            return res.status(500).json({ message: 'Database reference undefined' });
        }

        const collections = await db.listCollections().toArray();

        // Map to just the names
        const collectionNames = collections.map(col => col.name);

        res.json(collectionNames);
    } catch (error) {
        console.error('List collections error:', error);
        res.status(500).json({ message: 'Server error fetching collections' });
    }
});

// GET dynamic data from a specific collection
router.get('/collections/:name', async (req, res) => {
    try {
        const collectionName = req.params.name;

        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database reference undefined' });
        }

        // Read all documents from the dynamic collection name
        const data = await db.collection(collectionName).find({}).sort({ _id: -1 }).toArray();

        // Filter out passwords manually if looking at users table to avoid leaking hashes even to admin UI
        if (collectionName === 'users') {
            data.forEach(doc => delete doc.password);
        }

        res.json(data);
    } catch (error) {
        console.error(`Get collection ${req.params.name} error:`, error);
        res.status(500).json({ message: `Server error fetching ${req.params.name}` });
    }
});

// DELETE a document dynamically from any collection
router.delete('/collections/:name/:id', async (req, res) => {
    try {
        const collectionName = req.params.name;
        const documentId = req.params.id;

        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database reference undefined' });
        }

        // Check if valid ObjectId format
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            return res.status(400).json({ message: 'Invalid Document ID format' });
        }

        const result = await db.collection(collectionName).deleteOne({ _id: new mongoose.Types.ObjectId(documentId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error(`Delete from ${req.params.name} error:`, error);
        res.status(500).json({ message: `Server error deleting from ${req.params.name}` });
    }
});

export default router;
