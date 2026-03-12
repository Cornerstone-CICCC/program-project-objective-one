import { Request, Response } from 'express';
import locationService from '../services/location.service';

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

    res.status(200).json(locations);
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
