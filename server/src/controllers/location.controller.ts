import { Request, Response } from 'express';
import locationService from '../services/location.service';
import { UserSkill } from '../models/userSkill.model';
import { User } from '../models/user.model';

// Fetch a user's skills
const fetchUserSkills = async (userId: string | any) => {
  const userSkills = await UserSkill.find({ user_id: userId }).populate('skill_id');

  const offering = userSkills
    .filter((userSkill) => userSkill.type === 'TEACH')
    .map((userSkill) => (userSkill.skill_id as any).name);

  const seeking = userSkills
    .filter((userSkill) => userSkill.type === 'LEARN')
    .map((userSkill) => (userSkill.skill_id as any).name);

  return { offering, seeking };
};

/**
 * Update Current Location (GPS Ping)
 * @route PUT /locations/update
 * @desc Called when user moves or manually changes address
 */
const updateLocation = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { lat, lng, address, city } = req.body;

  if (!userId) {
    return res.status(401).json({
      message: 'Not authorized',
    });
  }

  if (lat === undefined || lng === undefined || !address || !city) {
    return res.status(400).json({
      message: 'Missing location fields (lat, lng, address, city',
    });
  }

  try {
    const updatedLocation = await locationService.update(userId, lat, lng, address, city);

    if (!updatedLocation) {
      return res.status(404).json({
        message: 'Location not found for this user',
      });
    }

    res.status(200).json({
      message: 'Location updated!',
      location: updatedLocation,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error updating location',
    });
  }
};

/**
 * Get Nearby Swaps (Discovery Map)
 * @route GET /locations/nearby?lat=...&lng=...&radius=...
 * @desc MOVED here from User Controller for better organization
 */
const getNearby = async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      message: 'Latitude and Longitude required',
    });
  }

  try {
    const distance = radius ? parseInt(radius as string) : 5000;

    const locations = await locationService.findNearby(
      parseFloat(lng as string),
      parseFloat(lat as string),
      distance,
    );

    const populatedLocations = await User.populate(locations, {
      path: 'user_id',
      select: 'firstname lastname username avatar_url bio',
    });

    const mapReadyData = await Promise.all(
      populatedLocations.map(async (location: any) => {
        if (!location.user_id) return null;

        const { offering, seeking } = await fetchUserSkills(location.user_id._id);

        return {
          id: location.user_id._id,
          name: `${location.user_id.firstname} ${location.user_id.lastname}`,
          username: location.user_id.username,
          avatar: location.user_id.avatar_url,
          bio: location.user_id.bio,
          lat: location.geo_location.coordinates[1],
          lng: location.geo_location.coordinates[0],
          city: location.city,
          offering,
          seeking,
        };
      }),
    );

    const finalCleanData = mapReadyData.filter((item) => item !== null);

    res.status(200).json(finalCleanData);
  } catch (err) {
    res.status(500).json({
      message: 'Error calculating nearby user locations',
    });
  }
};

export default {
  updateLocation,
  getNearby,
};
