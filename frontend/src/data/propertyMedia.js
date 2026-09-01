import { PROPERTY_IMAGES, FALLBACK_IMAGES, getPropertyImages, getPropertyHeroImage } from '../config/propertyImages';
import { getRoomImage } from '../config/roomImages';

export const getPropertyCardImage = (propertyId) => getPropertyHeroImage(propertyId);

export const getAvailabilityRoomImage = (room) => getRoomImage(room);

export { PROPERTY_IMAGES, FALLBACK_IMAGES, getPropertyImages, getPropertyHeroImage };
