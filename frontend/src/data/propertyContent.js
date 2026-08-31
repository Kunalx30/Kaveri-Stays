/**
 * Kaveri Stays -- Property Content Descriptions
 *
 * Centralized editorial content for each property.
 * Keyed by property_id to match backend response structure.
 *
 * Fields:
 *   short_description -- 2-3 compact lines for property listing cards.
 *   property_story    -- 4-5 lines narrative for featured homepage sections.
 *   tagline           -- Optional one-line atmospheric phrase.
 */

export const PROPERTY_CONTENT = {
  // Property 1: Kaveri Riverside -- Coorg
  1: {
    tagline: 'A riverside sanctuary in the coffee hills of Coorg.',
    short_description:
      'Set directly on the banks of a clear tributary flowing through the Coorg highlands, Kaveri Riverside is a calm, unhurried retreat surrounded by dense spice gardens and ancient rain trees. Private wooden decks, open-air dining, and the constant sound of moving water define the experience here.',
    property_story:
      'Kaveri Riverside began as a vision to bring guests closer to the river rather than simply near it. Situated on a quiet bend where the water moves slowly around smooth granite boulders, the retreat was shaped by the landscape itself -- open verandas face the current, rooms are positioned for cross-ventilation from the valley breeze, and pathways wind through cardamom and pepper vines. The property draws on the unhurried rhythm of Coorg\'s coffee plantation culture, where mornings begin with local estate brews and evenings settle into the sound of water and forest. Guests here often describe it as one of the few places where the environment genuinely slows the pace of a stay.',
  },

  // Property 2: Kaveri Hilltop -- Ooty
  2: {
    tagline: 'A highland escape above the clouds in the Nilgiris.',
    short_description:
      'Perched in the cool, misty reaches of the Nilgiri Hills above Ooty, Kaveri Hilltop is a hillside retreat built for those who find comfort in altitude and quiet. Pine-lined walking trails, stone-and-timber architecture, and panoramic valley views create an atmosphere of dignified natural seclusion.',
    property_story:
      'Kaveri Hilltop occupies a gentle ridge in the upper Nilgiris, a region long associated with cool-climate retreats and unhurried highland living. The property was conceived as a place where the architecture recedes into its surroundings -- stone walls, timber ceilings, and wide windows that frame the misty morning valley rather than interrupting it. The nearby tea gardens lend their fragrance to the air through the cooler months, while the long evenings invite guests to settle by warmth and read, reflect, or simply watch the light shift across the hills. The experience here is deliberately slow, shaped by elevation and the particular stillness that only highland landscapes carry.',
  },

  // Property 3: Kaveri Backwaters -- Alleppey
  3: {
    tagline: 'A backwater haven where the palm lagoons meet the evening sky.',
    short_description:
      "Nestled along Alleppey's legendary backwater channels, Kaveri Backwaters offers a serene waterfront experience defined by gently swaying palms, private canal-side jetties, and soft lantern light reflecting across still water at dusk. An ideal retreat for those seeking pure stillness and the unhurried character of Kerala's inland waterways.",
    property_story:
      "The backwater landscape of Alleppey has long been one of South India's most distinctive natural environments -- a network of freshwater canals, palm-fringed banks, and quiet lagoons that open gradually into wider waters. Kaveri Backwaters was established to give guests direct, unhurried access to this world, away from the tourist circuits and closer to the organic rhythm of canal-side life. The retreat features private wooden jetties that extend over the water, open dining pavilions that catch the evening breeze, and rooms positioned to draw in the reflections off the surface of the backwaters at different hours of the day. The atmosphere here is one of genuine quietude -- the kind found only at the intersection of water, sky, and stillness.",
  },
};

/**
 * Returns the content object for a given property ID.
 * Falls back to neutral defaults if a property has no specific content entry.
 *
 * @param {number|string} propertyId
 * @returns {{ tagline: string, short_description: string, property_story: string }}
 */
export const getPropertyContent = (propertyId) => {
  const id = Number(propertyId);
  return (
    PROPERTY_CONTENT[id] || {
      tagline: 'A thoughtfully selected Kaveri Stays destination.',
      short_description:
        'A carefully curated property offering genuine comfort, scenic surroundings, and the distinctive character of its destination. Each detail is chosen to give guests a meaningful, unhurried stay.',
      property_story:
        'This Kaveri Stays retreat is part of our hand-inspected collection of riverside and highland sanctuaries across South India. Each property in the portfolio is chosen for its relationship to its landscape -- direct water access, natural materials, and a setting that invites guests to slow down and reconnect with their surroundings.',
    }
  );
};

export default PROPERTY_CONTENT;
