import { FALLBACK_IMAGES } from './propertyImages';

export const ROOM_IMAGE_POOLS = {
  standard: [
    '/images/bedrooms/Standard.png',
    '/images/bedrooms/Standard2.png',
    '/images/bedrooms/Standard3.png',
    '/images/bedrooms/Standard4.png',
  ],
  deluxe: [
    '/images/bedrooms/duluxe.png',
    '/images/bedrooms/duluxe2.png',
    '/images/bedrooms/duluxe3.png',
    '/images/bedrooms/duluxe4.png',
  ],
  suite: [
    '/images/bedrooms/suite.png',
    '/images/bedrooms/suite2.png',
    '/images/bedrooms/suite3.png',
    '/images/bedrooms/suit4.png',
  ],
};

const ROOM_TYPE_ID_CATEGORIES = {
  1: 'standard',
  2: 'deluxe',
  3: 'suite',
};

const FALLBACK_ROOM_IMAGE = FALLBACK_IMAGES[1] || FALLBACK_IMAGES[0];

export const normalizeRoomCategory = (room = {}) => {
  const rawName = String(
    room.room_type_name
    || room.roomTypeName
    || room.room_type?.name
    || room.name
    || ''
  ).toLowerCase();

  if (rawName.includes('suite') || rawName.includes('suit')) return 'suite';
  if (rawName.includes('deluxe') || rawName.includes('duluxe')) return 'deluxe';
  if (rawName.includes('standard')) return 'standard';

  const typeId = Number(room.room_type_id || room.roomTypeId);
  return ROOM_TYPE_ID_CATEGORIES[typeId] || 'standard';
};

const stableHash = (value) => {
  const input = String(value ?? '');
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getRoomImage = (room = {}, property = {}) => {
  const category = normalizeRoomCategory(room);
  const pool = ROOM_IMAGE_POOLS[category] || ROOM_IMAGE_POOLS.standard;

  if (!pool?.length) return FALLBACK_ROOM_IMAGE;

  const stableKey = [
    property.property_id,
    property.id,
    property.name,
    room.property_id,
    room.property_name,
    room.room_type_id,
    room.room_type_name,
    room.room_id,
    room.id,
    room.room_number,
  ].filter((value) => value !== undefined && value !== null && value !== '').join('|');

  return pool[stableHash(stableKey || category) % pool.length] || FALLBACK_ROOM_IMAGE;
};

export const getRoomImagePool = (room = {}) => ROOM_IMAGE_POOLS[normalizeRoomCategory(room)] || ROOM_IMAGE_POOLS.standard;

export default ROOM_IMAGE_POOLS;
