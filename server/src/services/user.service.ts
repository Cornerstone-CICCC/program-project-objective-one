import { User, IUser } from '../models/user.model';
import { Location } from '../models/location.model';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// Get all users
const getAll = async () => {
  return await User.find().select('-password');
};

// Get user by ID
const getById = async (id: string) => {
  return await User.findById(id).populate('location_id');
};

// Get user by email
const getByEmail = async (email: string) => {
  return await User.findOne({ email }).select('+password').populate('location_id');
};

// Registration (User + Location)
const registerWithLocation = async (userData: any, locationData: any) => {
  const { firstname, lastname, username, email, password } = userData;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) return null;

  const userId = new mongoose.Types.ObjectId();
  const locationId = new mongoose.Types.ObjectId();

  const hashedPassword = await bcrypt.hash(password, 12);

  const newLocation = await Location.create({
    _id: locationId,
    user_id: userId,
    geo_location: {
      type: 'Point',
      coordinates: [locationData.lng, locationData.lat],
    },
    address: locationData.address,
    city: locationData.city,
  });

  const newUser = await User.create({
    _id: userId,
    firstname,
    lastname,
    username,
    email,
    password: hashedPassword,
    location_id: newLocation._id,
  });

  return newUser;
};

// Update user
const update = async (id: string, data: Partial<IUser>) => {
  return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// Increment trade stats
const updateTradeStats = async (id: string, newRating: number) => {
  const user = await User.findById(id);
  if (!user) return null;

  const currentTotal = user.average_rating * user.total_trades;
  const newTotalTrades = user.total_trades + 1;
  const newAverage = (currentTotal + newRating) / newTotalTrades;

  user.total_trades = newTotalTrades;
  user.average_rating = Number(newAverage.toFixed(2));

  return await user.save();
};

export interface IUserLogin {
  email: string;
  password: string;
}

// Login user
const login = async (details: IUserLogin) => {
  const { email, password } = details;
  const foundUser = await getByEmail(email);

  if (!foundUser) return null;

  const isMatch = await bcrypt.compare(password, foundUser.password);
  if (!isMatch) return null;

  const userObj = foundUser.toObject();
  delete (userObj as any).password;

  return {
    user: userObj,
  };
};

// Delete user
const remove = async (id: string) => {
  await Location.findOneAndDelete({ user_id: id });

  const deleteUser = await User.findByIdAndDelete(id);

  return deleteUser;
};

export default {
  getAll,
  getById,
  getByEmail,
  registerWithLocation,
  update,
  updateTradeStats,
  login,
  remove,
};
