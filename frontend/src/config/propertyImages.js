/**
 * Centralized Property Image Configuration for Kaveri Stays
 *
 * Each hotel property has its own dedicated, authentic image gallery.
 * Property 1: Kaveri Riverside (Coorg)
 * Property 2: Kaveri Hilltop (Ooty)
 * Property 3: Kaveri Backwater (Alleppey)
 */

export const PROPERTY_IMAGES = {
  1: [
    '/images/hotel1.png',
    '/images/bedroom1.png',
    '/images/bathroom1.jpg',
    '/images/dinning1.jpg',
    '/images/swimmingpool.png',
    '/images/bar1.png',
  ],
  2: [
    '/images/hotel2.png',
    '/images/bedroom2.png',
    '/images/bathroom2.jpg',
    '/images/dinning2.jpg',
    '/images/swimmingpool2.jpg',
    '/images/bar2.png',
  ],
  3: [
    '/images/hotel3.png',
    '/images/bedroom3.png',
    '/images/bathroom3.png',
    '/images/dinning3.png',
    '/images/swimmingpool3.png',
    '/images/bar3.png',
  ],
};

export const FALLBACK_IMAGES = [
  '/images/hotel1.png',
  '/images/bedroom1.png',
  '/images/bathroom1.jpg',
  '/images/dinning1.jpg',
  '/images/swimmingpool.png',
  '/images/bar1.png',
];

export const IMAGE_LABELS = [
  'Resort Exterior',
  'Master Suite & Bedroom',
  'Bathing Sanctuary',
  'Dining & Plantation Cuisine',
  'Infinity Pool & Leisure',
  'Lounge & Evening Bar',
];

/**
 * Get the full image gallery array for a given property ID
 * @param {number|string} propertyId
 * @returns {string[]} Array of image paths
 */
export const getPropertyImages = (propertyId) => {
  if (!propertyId) return FALLBACK_IMAGES;
  const id = Number(propertyId);
  return PROPERTY_IMAGES[id] || FALLBACK_IMAGES;
};

/**
 * Get the primary hero image for a given property ID
 * @param {number|string} propertyId
 * @returns {string} Hero image path
 */
export const getPropertyHeroImage = (propertyId) => {
  const images = getPropertyImages(propertyId);
  return images[0] || FALLBACK_IMAGES[0];
};

export default PROPERTY_IMAGES;
