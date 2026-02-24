import { Location, ILocation } from '../models/location.model';

// Create new location
const add = async (data: Partial<ILocation>) => {
  return await Location.create(data);
};

// Get location by User ID
const getByUserId = async (userId: string) => {
  return await Location.findOne({ user_id: userId });
};

// Update location
const update = async (userId: string, lat: number, lng: number, address: string, city: string) => {
  return await Location.findOneAndUpdate(
    { user_id: userId },
    {
      geo_location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address,
      city,
    },
    { new: true },
  );
};

// Find users within a radius
const findNearby = async (lng: number, lat: number, maxDistanceInMeters: number = 5000) => {
  return await Location.find({
    geo_location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistanceInMeters,
      },
    },
  }).populate('user_id', 'firstname lastname username avatar_url skillsOffering');
};

export default {
  add,
  getByUserId,
  update,
  findNearby,
};
