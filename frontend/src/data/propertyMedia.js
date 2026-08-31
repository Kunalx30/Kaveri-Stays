import { PROPERTY_IMAGES, FALLBACK_IMAGES, getPropertyImages, getPropertyHeroImage } from '../config/propertyImages';

export const getPropertyCardImage = (propertyId) => getPropertyHeroImage(propertyId);

export const getAvailabilityRoomImage = (room) => {
  const propId = Number(room?.property_id);
  const typeId = Number(room?.room_type_id);
  const images = getPropertyImages(propId);

  // Map room types directly to hotel's dedicated suite and amenity images
  if (typeId === 1) return images[1] || images[0];
  if (typeId === 2) return images[2] || images[1] || images[0];
  if (typeId === 3) return images[3] || images[0];
  return images[1] || images[0];
};

export { PROPERTY_IMAGES, FALLBACK_IMAGES, getPropertyImages, getPropertyHeroImage };
