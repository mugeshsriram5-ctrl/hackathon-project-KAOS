import { MasterSpot, PassportStamp, SecretPerk, TerritoryLeader } from '../types';

const senateImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop';
const coffeeImg = 'https://images.unsplash.com/photo-1545235621-3f6b76649e78?q=80&w=600&auto=format&fit=crop';
const armenianImg = 'https://images.unsplash.com/photo-1596422846543-75c6fc18a593?q=80&w=600&auto=format&fit=crop';
const kapaleeshwararImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop';
const dosaImg = 'https://images.unsplash.com/photo-1545235621-3f6b76649e78?q=80&w=600&auto=format&fit=crop';

const FLAGSHIP_SPOTS: MasterSpot[] = [
  {
    id: 'senate-house',
    title: 'Senate House Stained Glass & Brickwork',
    category: 'Architecture',
    categoryKey: 'architecture',
    zone: 'Chepauk',
    distance: '850m away',
    duration: '15 min walk',
    xp: 90,
    description: "Robert Chisholm's masterwork harmonising Byzantine stone vaults with Mughal sunshades. Catch the crimson rosette refraction.",
    fullStory: "Designed by Robert Chisholm and completed in 1879, Senate House stands as a monumental synthesis of Indo-Saracenic architecture. The great assembly hall features vaulted Byzantine ceilings, polychrome tiled floorings, and majestic stained-glass rose windows that project vivid ruby and amber hues across the floor during late afternoon Madras sun.",
    openHours: '09:30 – 16:30',
    imageUrl: senateImg,
    vintageYear: '1888 Vintage Madras Survey Archive',
    architecturalStyle: 'Indo-Saracenic & Byzantine Vaults',
    audioGuideScript: "You are standing before the crown jewel of Madras Indo-Saracenic design. Notice how the four corner minarets mirror Mughal domes, while the soaring central hall utilizes Christian Byzantine brick-arch engineering.",
    soundscapeType: 'belfry',
    secretPerkTitle: 'Archive Vault Access',
    lat: 13.0642,
    lng: 80.2811,
  },
  {
    id: 'coffee-roasters',
    title: 'The 1920s Filter Coffee Roasters',
    category: 'Food Lore',
    categoryKey: 'food',
    zone: 'Triplicane',
    distance: '1.2 km away',
    duration: '25 min walk',
    xp: 75,
    description: 'Third-generation roasters grinding slow chicory blends in antique iron drums. Ask for the 80:20 plantation roast.',
    fullStory: 'Nestled in the bustling alleys of Triplicane, this family-run roastery has been crackling with freshly roasted peaberry beans since 1924. The aroma of slow-ground chicory defines morning routines for generations across the Coromandel coast.',
    openHours: '10:00 AM – 19:00 PM',
    imageUrl: coffeeImg,
    vintageYear: '1932 Triplicane Market Ledger',
    architecturalStyle: 'Madras Heritage Timber Shopfront',
    audioGuideScript: "Breathe in the deep, caramelized chicory fragrance. In this 100-year-old shop, the roasting drum turns exactly 42 revolutions per minute over seasoned tamarind wood coals.",
    soundscapeType: 'coffee',
    secretPerkTitle: 'Peaberry Secret Brew 20% Off',
    lat: 13.0583,
    lng: 80.2745,
  },
  {
    id: 'armenian-church',
    title: 'Armenian Church Bell Tower',
    category: 'Heritage',
    categoryKey: 'heritage',
    zone: 'George Town',
    distance: '2.1 km away',
    duration: '28 min walk',
    xp: 110,
    description: 'Housing six monumental bells cast in Whitechapel and Amsterdam. A hushed courtyard blanketed in frangipani blossoms.',
    fullStory: 'Founded in 1712 and rebuilt in 1772, the Armenian Church of St. Mary is an oasis of profound silence in the dense labyrinth of Armenian Street. Its iconic belfry houses six colossal bells weighing up to 150 kilograms each.',
    openHours: 'Sundays 09:00 AM',
    imageUrl: armenianImg,
    vintageYear: '1794 Armenian Heritage Chronicle',
    architecturalStyle: 'Armenian Colonial Baroque',
    audioGuideScript: "Step across the white threshold into a sanctuary of stillness. The six giant bells above you were cast in London and Amsterdam between 1754 and 1837.",
    soundscapeType: 'belfry',
    secretPerkTitle: 'Belfry Vault Key',
    lat: 13.0901,
    lng: 80.2882,
  },
  {
    id: 'rayars-mess',
    title: "Rayar's Mess Secret Ghee Dosa",
    category: 'Food Lore',
    categoryKey: 'food',
    zone: 'Mylapore',
    distance: '1.2 km away',
    duration: '20 min walk',
    xp: 85,
    description: 'The 70-year ritual of wood-fired cast iron crisps served on fresh banana leaves with emerald coriander chutney.',
    fullStory: "Operating out of a modest residential doorway in Mylapore since the 1950s, Rayar's Mess serves only a limited batch of fluffy melt-in-mouth idlis and golden ghee dosas each morning. Locals queue at dawn for the signature sambar and frothy buttermilk.",
    openHours: '07:00 – 11:30',
    imageUrl: dosaImg,
    vintageYear: '1954 Mylapore Heritage Food Map',
    architecturalStyle: 'Traditional Thinnai Courtyard',
    audioGuideScript: "Listen to the rhythmic sizzle of fresh rice-and-urad batter hitting seasoned 80-year-old cast iron skillets.",
    soundscapeType: 'coffee',
    secretPerkTitle: 'Double Podi Ghee Upgrade',
    lat: 13.0336,
    lng: 80.2697,
  },
  {
    id: 'kapaleeshwarar',
    title: 'Kapaleeshwarar Teppakulam & Tank',
    category: 'Heritage',
    categoryKey: 'heritage',
    zone: 'Mylapore',
    distance: '1.6 km away',
    duration: '22 min walk',
    xp: 120,
    description: 'Ancient stone tank surrounded by traditional agraharam streets, reflecting 7th-century Dravidian gopuram sculptures.',
    fullStory: "The sacred temple tank of Kapaleeshwarar Temple is the focal point of Mylapore's spiritual life. Fed by underground springs, it hosts the vibrant annual float festival where illuminated wooden barges glide across twilight reflections.",
    openHours: '05:30 – 21:30',
    imageUrl: kapaleeshwararImg,
    vintageYear: '1910 Madras Photographic Society',
    architecturalStyle: 'Classic Dravidian Granite Masonry',
    audioGuideScript: "The monumental granite steps descend into sacred waters aligned with ancient cosmological constellations.",
    soundscapeType: 'temple',
    secretPerkTitle: 'Sacred Prasadam Token',
    lat: 13.0334,
    lng: 80.2706,
  }
];

// Procedural Place Generator to dynamically create 1,000+ Chennai places
const categoriesList = [
  'Food', 'Shopping', 'Entertainment', 'Attractions',
  'Activities', 'Parks', 'Cafes', 'Restaurants',
  'Hidden Gems', 'Family Friendly', 'Heritage', 'Architecture'
];

const categoryKeys: Record<string, string> = {
  'Food': 'food',
  'Shopping': 'shopping',
  'Entertainment': 'entertainment',
  'Attractions': 'attraction',
  'Activities': 'activity',
  'Parks': 'park',
  'Cafes': 'food',
  'Restaurants': 'food',
  'Hidden Gems': 'heritage',
  'Family Friendly': 'heritage',
  'Heritage': 'heritage',
  'Architecture': 'architecture'
};

const zonesList = [
  'Mylapore', 'Chepauk', 'George Town', 'Triplicane', 'Royapuram',
  'Nungambakkam', 'T. Nagar', 'Adyar', 'Besant Nagar', 'Egmore',
  'Sowcarpet', 'Saidapet', 'Guindy', 'Alwarpet', 'Santhome'
];

const zoneCoords: Record<string, { lat: number; lng: number }> = {
  'Mylapore': { lat: 13.0334, lng: 80.2706 },
  'Chepauk': { lat: 13.0642, lng: 80.2811 },
  'George Town': { lat: 13.0901, lng: 80.2882 },
  'Triplicane': { lat: 13.0583, lng: 80.2745 },
  'Royapuram': { lat: 13.1112, lng: 80.2942 },
  'Nungambakkam': { lat: 13.0587, lng: 80.2452 },
  'T. Nagar': { lat: 13.0382, lng: 80.2324 },
  'Adyar': { lat: 13.0033, lng: 80.2550 },
  'Besant Nagar': { lat: 13.0003, lng: 80.2704 },
  'Egmore': { lat: 13.0782, lng: 80.2604 },
  'Sowcarpet': { lat: 13.0945, lng: 80.2764 },
  'Saidapet': { lat: 13.0182, lng: 80.2224 },
  'Guindy': { lat: 13.0084, lng: 80.2114 },
  'Alwarpet': { lat: 13.0312, lng: 80.2520 },
  'Santhome': { lat: 13.0322, lng: 80.2784 }
};

const modifiers = [
  'Golden', 'Sacred', 'Vintage', 'Ancient', 'Royal', 'Colonial', 'Shadow',
  'Sandalwood', 'Emerald', 'Silk', 'Peaberry', 'Ghee', 'Sunset', 'Breeze',
  'Chronicle', 'Victoria', 'Imperial', 'Monsoon', 'Neem', 'Indigo', 'Mylapore',
  'Coromandel', 'Carnatic', 'Chola', 'Pallava', 'Temple', 'Maritime', 'Curator',
  'Bazaar', 'Acoustic', 'Saffron', 'Turmeric', 'Coconut', 'Coral'
];

const nouns = [
  'Palace', 'Bazaar', 'Gardens', 'Vault', 'Mandapam', 'Sanctuary', 'Square',
  'Street', 'Alley', 'Corner', 'Chamber', 'Shed', 'Havelis', 'Gateway', 'Point',
  'View', 'Avenue', 'Library', 'Quarter', 'Hub', 'Mess', 'Stall', 'Bungalow',
  'Sanctum', 'Belfry', 'Tank', 'Roastery', 'Rest House', 'Arcade', 'Saloon'
];

const descriptors = [
  'Featuring fine handcrafted teak carvings, ancient terracotta roof tiles, and an open central courtyard.',
  'Known for its vibrant spice merchants, dynamic flower stringers, and historical ledger scrolls.',
  'An iconic architectural structure reflecting pre-independence design with grand high-vaulted brick archways.',
  'A sensory experience showcasing traditional wood-fired brass cauldrons and secret masala recipes.',
  'A peaceful haven beneath ancient banyan trees, offering a window into centuries of oral folk lore.',
  'A rare preserved structure with colonial stucco work and hand-painted Belgian glass panels.',
  'Famous among local gourmands for its strict slow-drip brewing techniques and legacy iron roasters.',
  'A stunning landscape where fresh oceanic winds mingle with the sound of distant temple chimes.',
  'Generations of families have gathered here under traditional lime-plaster arches for evening discourses.',
  'A secret enclave holding historic maritime shipping ledgers and brass navigational compass instruments.'
];

const soundscapesList = ['temple', 'coffee', 'waves', 'belfry'];

const stylesList = [
  'Classic Dravidian Granite Masonry', 'Indo-Saracenic & Byzantine Vaults',
  'Traditional Thinnai Courtyard', 'Madras Heritage Timber Shopfront',
  'Armenian Colonial Baroque', 'British Neo-Gothic Revival', 'Art Deco Stucco Relief',
  'Palladian Imperial Columns', 'Traditional Agraharam Vernacular'
];

function generate1000Places(): MasterSpot[] {
  const list: MasterSpot[] = [];
  
  // Use a pseudo-random seed generator so the dataset is perfectly stable and identical on every run!
  let seed = 42;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 1; i <= 1010; i++) {
    const cat = categoriesList[Math.floor(random() * categoriesList.length)];
    const zone = zonesList[Math.floor(random() * zonesList.length)];
    const modifier = modifiers[Math.floor(random() * modifiers.length)];
    const noun = nouns[Math.floor(random() * nouns.length)];
    
    const title = `${modifier} ${noun} of ${zone}`;
    const baseCoords = zoneCoords[zone] || { lat: 13.0642, lng: 80.2811 };
    
    // Spread coordinates slightly around the zone center
    const lat = baseCoords.lat + (random() - 0.5) * 0.024;
    const lng = baseCoords.lng + (random() - 0.5) * 0.024;
    
    const xp = Math.floor(random() * 5) * 10 + 60; // 60, 70, 80, 90, 100
    const rating = parseFloat((4.0 + random() * 0.9).toFixed(1));
    const vintageYear = `${Math.floor(1750 + random() * 190)} Archive Record`;
    const style = stylesList[Math.floor(random() * stylesList.length)];
    
    const imageOptions = [
      'https://images.unsplash.com/photo-1545235621-3f6b76649e78?q=80&w=600&auto=format&fit=crop', // coffee / cafe
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop', // structure
      'https://images.unsplash.com/photo-1596422846543-75c6fc18a593?q=80&w=600&auto=format&fit=crop', // market/bazaar
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop', // food
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop'  // park/nature
    ];
    
    let imgIdx = 1;
    if (cat.includes('Food') || cat.includes('Cafe') || cat.includes('Restaurant')) {
      imgIdx = random() > 0.5 ? 0 : 3;
    } else if (cat.includes('Shopping') || cat.includes('Bazaar')) {
      imgIdx = 2;
    } else if (cat.includes('Park') || cat.includes('Activity')) {
      imgIdx = 4;
    } else {
      imgIdx = 1;
    }
    const imageUrl = imageOptions[imgIdx];
    
    const desc = descriptors[Math.floor(random() * descriptors.length)];
    
    list.push({
      id: `generated-spot-${i}`,
      title,
      category: cat,
      categoryKey: categoryKeys[cat] || 'heritage',
      zone,
      distance: `${(0.4 + random() * 4.5).toFixed(1)} km away`,
      duration: `${Math.floor(10 + random() * 50)} min walk`,
      xp,
      description: `${desc} Extremely popular spot in ${zone}.`,
      fullStory: `${desc} Deep inside ${zone}, this historical spot has been a centerpiece of local commerce, heritage, or spiritual assemblies for generations. Under the Madras Presidency and subsequent eras, its structure survived several urban developments and remains intact as a living testament to regional heritage.`,
      openHours: `${Math.floor(6 + random() * 4)}:00 AM – ${Math.floor(20 + random() * 3)}:00 PM`,
      imageUrl,
      vintageYear,
      architecturalStyle: style,
      audioGuideScript: `Welcome to the historic ${title}. Observe the ${style} elements, especially the stucco plastering and native timber columns. This site tells a profound story of Chennai's dynamic social fabric.`,
      soundscapeType: soundscapesList[Math.floor(random() * soundscapesList.length)],
      secretPerkTitle: `${modifier} Special Counter Voucher`,
      lat,
      lng,
      rating
    });
  }
  
  return list;
}

export const KAOS_SPOTS: MasterSpot[] = [
  ...FLAGSHIP_SPOTS,
  ...generate1000Places()
];

export const KAOS_STAMPS: PassportStamp[] = [
  {
    id: 'stamp-senate',
    title: 'Senate House Guardian',
    zone: 'Chepauk',
    rarity: 'Rare',
    icon: '🏛️',
    xpValue: 150,
    description: 'Discovered Robert Chisholm’s Indo-Saracenic stained glass rosette.',
    unlocked: true,
  },
  {
    id: 'stamp-coffee',
    title: 'Triplicane Roastery Master',
    zone: 'Triplicane',
    rarity: 'Common',
    icon: '☕',
    xpValue: 100,
    description: 'Tasted the 1924 peaberry chicory brew.',
    unlocked: true,
  },
  {
    id: 'stamp-armenian',
    title: 'Belfry Seeker',
    zone: 'George Town',
    rarity: 'Legendary',
    icon: '🔔',
    xpValue: 250,
    description: 'Unlocks Whitechapel bell resonance frequency.',
    unlocked: false,
  },
  {
    id: 'stamp-rayars',
    title: 'Mylapore Dawn Taster',
    zone: 'Mylapore',
    rarity: 'Epic',
    icon: '🥘',
    xpValue: 180,
    description: 'Experienced wood-fired ghee roast at sunrise.',
    unlocked: true,
  },
  {
    id: 'stamp-teppakulam',
    title: 'Sacred Waters Navigator',
    zone: 'Mylapore',
    rarity: 'Rare',
    icon: '🪔',
    xpValue: 160,
    description: 'Completed the twilight tank circumambulation.',
    unlocked: true,
  }
];

export const KAOS_PERKS: SecretPerk[] = [
  {
    id: 'perk-peaberry-tasting',
    placeName: 'The 1920s Filter Coffee Roasters',
    zone: 'Triplicane',
    perkTitle: 'Complimentary Second Brass Tumbler',
    secretCode: 'KAOS-PEABERRY-1924',
    secretMenuDish: 'Jaggery Filter Decoction & Butter Bun',
    perkValue: '₹120 Value',
    status: 'available',
    imageUrl: coffeeImg,
  },
  {
    id: 'perk-senate-archive',
    placeName: 'Senate House',
    zone: 'Chepauk',
    perkTitle: 'Curator Ledger VIP Tour',
    secretCode: 'CHISHOLM-ARCHIVE-88',
    secretMenuDish: 'Access to 1879 Architectural Blueprints',
    perkValue: 'Exclusive Experience',
    status: 'locked',
    imageUrl: senateImg,
  },
  {
    id: 'perk-rayars-podi',
    placeName: "Rayar's Mess",
    zone: 'Mylapore',
    perkTitle: 'Secret Double Podi Ghee Upgrade',
    secretCode: 'RAYAR-GHEE-SECRET-54',
    secretMenuDish: 'Gunpowder Podi Crisped Butter Roast',
    perkValue: '₹80 Value',
    status: 'available',
    imageUrl: dosaImg,
  }
];

export const KAOS_LEADERS: TerritoryLeader[] = [
  { rank: 1, name: 'Aravind K.', xp: 4820, streak: 14, avatar: '👑' },
  { rank: 2, name: 'Divya Ramesh', xp: 3950, streak: 11, avatar: '🥈' },
  { rank: 3, name: 'Karthik V.', xp: 3410, streak: 9, avatar: '🥉' },
  { rank: 4, name: 'Usha Baskar', xp: 1420, streak: 5, avatar: '🛡️' },
  { rank: 5, name: 'Sanjay Nathan', xp: 1210, streak: 4, avatar: '🧭' }
];
