import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepo } from '../models/userRepo.js';

function createToken(userId) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, preferredLanguage } = req.body;

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await userRepo.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      preferredLanguage: preferredLanguage || 'en',
    });

    const token = createToken(user._id || user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to SARTHI!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        accessibilityPreferences: user.accessibilityPreferences,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials.',
      });
    }

    const token = createToken(user._id || user.id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        accessibilityPreferences: user.accessibilityPreferences,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        accessibilityPreferences: user.accessibilityPreferences,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;
    const currentPrefs = req.user.accessibilityPreferences || {};
    const newPrefs = { ...currentPrefs, ...req.body };

    const updatedUser = await userRepo.updatePreferences(userId, newPrefs);

    res.status(200).json({
      success: true,
      message: 'Accessibility preferences updated successfully.',
      preferences: updatedUser?.accessibilityPreferences || newPrefs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convenient Instant Demo Login for Hackathon Evaluators
 */
export async function demoLogin(req, res, next) {
  try {
    const demoEmail = 'judge.demo@sarthi.ai';
    let user = await userRepo.findByEmail(demoEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SarthiDemo2026!', salt);
      user = await userRepo.create({
        name: 'Hackathon Evaluator',
        email: demoEmail,
        passwordHash,
        preferredLanguage: 'en',
        stats: {
          documentsAnalyzed: 4,
          questionsAnswered: 8,
          actionsCompleted: 11,
          translationsCount: 3,
        },
      });
    }

    const token = createToken(user._id || user.id);

    res.status(200).json({
      success: true,
      message: 'Logged in as Demo Evaluator.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        accessibilityPreferences: user.accessibilityPreferences,
        stats: user.stats,
      },
    });
  } catch (error) {
    next(error);
  }
}
