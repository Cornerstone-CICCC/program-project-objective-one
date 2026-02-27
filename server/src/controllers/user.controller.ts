import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/auth.utils';
import { User } from '../models/user.model';
import userService from '../services/user.service';
import zxcvbn from 'zxcvbn';

/**
 * Sign up (Register User + Location)
 * @route POST /users/signup
 */
const signup = async (req: Request, res: Response) => {
  const { firstname, lastname, username, email, password, lat, lng, address, city } = req.body;

  // Validate basic fields
  if (
    !firstname?.trim() ||
    !lastname?.trim() ||
    !username?.trim() ||
    !email?.trim() ||
    !password?.trim()
  ) {
    return res.status(400).json({
      message: 'Missing required registration fields!',
    });
  }

  // Validate location fields
  if (lat === undefined || lng === undefined || !address || !city) {
    return res.status(400).json({
      message: 'Location data (lat, lng, address, city) is required!',
    });
  }

  // Password strength check
  const strength = zxcvbn(password);

  if (strength.score < 3) {
    return res.status(400).json({
      message: 'Password is too weak.',
      feedback: strength.feedback.warning || 'Avoid common patterns and names.',
      suggestions: strength.feedback.suggestions,
    });
  }

  // Duplicate check
  const existingUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return res.status(409).json({
        message: 'Email is already registered.',
      });
    }

    if (existingUser.username === username) {
      return res.status(409).json({
        message: 'Username is already taken.',
      });
    }
  }

  try {
    const newUser = await userService.registerWithLocation(
      { firstname, lastname, username, email, password },
      { lat, lng, address, city },
    );

    if (!newUser) {
      return res.status(409).json({
        message: 'Failed to create user.',
      });
    }

    // Generate token
    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      message: 'User successfully registered!',
      token,
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        username: newUser.username,
        email: newUser.email,
        location_id: newUser.location_id,
      },
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({
      message: 'Server error.',
    });
  }
};

/**
 * Log in
 * @route POST /users/login
 */
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      message: 'Email and password are required!',
    });
  }

  try {
    const result = await userService.login({ email, password });

    if (!result) {
      return res.status(401).json({
        message: 'Incorrect email or password!',
      });
    }

    const { user } = result;
    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        avatar_url: user.avatar_url,
        location_id: user.location_id,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: 'Unable to login.',
    });
  }
};

/**
 * Get All Users
 * @route GET /users
 */
const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAll();
    res.status(200).json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({
      messsage: 'Server error while fetching users.',
    });
  }
};

/**
 * Get User by ID
 * @route GET /users/:id
 */
const getUserById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const { email, password, ...publicUser } = user.toObject();

    res.status(200).json(publicUser);
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({
      message: 'Server error while fetching user details.',
    });
  }
};

/**
 * Get Current User Info
 * @route GET /users/me
 */
const getMe = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      message: 'Not authorized.',
    });
  }

  const user = await userService.getById(userId);

  if (!user) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }

  res.status(200).json(user);
};

/**
 * Update Profile
 * @route PUT /users/profile
 */
const updateAccount = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { firstname, lastname, username, email, currPassword, newPassword, bio, avatar_url } =
    req.body;

  try {
    const user = await User.findById(userId).select('+password');
    if (!user)
      return res.status(404).json({
        message: 'User not found.',
      });

    // Password update
    let finalPassword = user.password;
    if (newPassword) {
      if (!currPassword) {
        return res.status(400).json({
          message: 'Current password is required to set a new one.',
        });
      }

      const isMatch = await bcrypt.compare(currPassword, newPassword);
      if (!isMatch) {
        return res.status(400).json({
          message: 'Incorrect current password.',
        });
      }

      const strength = zxcvbn(newPassword);
      if (strength.score < 3) {
        return res.status(400).json({
          message: 'New password is too weak.',
          suggestions: strength.feedback.suggestions,
        });
      }

      finalPassword = await bcrypt.hash(newPassword, 12);
    }

    // Duplicate check
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists)
        return res.status(409).json({
          message: 'Email already in use.',
        });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists)
        return res.status(409).json({
          message: 'Username already taken.',
        });
    }

    const updateData: any = {
      firstname: firstname || user.firstname,
      lastname: lastname || user.lastname,
      username: username || user.username,
      email: email || user.email,
      bio: bio || user.bio,
      avatar_url: avatar_url || user.avatar_url,
      password: finalPassword,
    };

    const updatedUser = await userService.update(userId, updateData);

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (err) {
    (console.error('Update Error'),
      res.status(500).json({
        message: 'Server error during update.',
      }));
  }
};

/**
 * Delete Account
 * @route DELETE /users/delete
 */
const deleteAccount = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  const deleted = await userService.remove(userId);

  if (!deleted) {
    return res.status(400).json({
      message: 'Failed to delete user!',
    });
  }

  res.status(200).json({
    message: 'Account deleted successfully!',
  });
};

export default {
  signup,
  login,
  getAllUsers,
  getUserById,
  getMe,
  updateAccount,
  deleteAccount,
};
