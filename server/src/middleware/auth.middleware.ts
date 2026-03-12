import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils';
import { User } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = verifyToken(token);

      // Check if user still exists in DB
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          message: 'Not authorized, user not found.',
        });
      }

      req.user = user;

      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      res.status(401).json({
        message: 'Not authorized, token failed.',
      });
    }
  }

  if (!token) {
    res.status(401).json({
      message: 'Not authorized, no token.',
    });
  }
};
