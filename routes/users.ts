import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/index';
import { UserRole } from '../types';
import { validatePassword } from '../utils/passwordValidation';

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

// GET all users
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const formattedUsers = users.map(user => {
            const obj = user.toObject();
            return { ...obj, id: obj._id };
        });
        res.json(formattedUsers);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST new user
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, password, role, name } = req.body;

        if (!username || !password || !role || !name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ message: passwordCheck.message });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = new User({
            username,
            password,
            role,
            name
        });

        await user.save();

        // Convert to object and omit password for the response
        const userObject = user.toObject();
        delete (userObject as any).password;

        res.status(201).json({ ...userObject, id: userObject._id });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT (update) existing user
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username, role, name } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }

        if (role) user.role = role as UserRole;
        if (name) user.name = name;

        await user.save();

        const userObject = user.toObject();
        delete (userObject as any).password;

        res.json({ ...userObject, id: userObject._id });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a user
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (userId === (req as any).userId) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }

        const result = await User.findByIdAndDelete(userId);
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST to reset a user's password
router.post('/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.params.id;

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.isValid) {
            return res.status(400).json({ message: passwordCheck.message });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
