import alasql from 'alasql';
import { McpSpotRecord, McpPerkRecord, McpLoreRecord } from './types.js';

// Initialize in-memory Relational SQL Engine
export function initializeMcpSqlDatabase() {
  alasql(`
    CREATE TABLE IF NOT EXISTS mcp_spots (
      id STRING PRIMARY KEY,
      title STRING,
      category STRING,
      zone STRING,
      lat FLOAT,
      lng FLOAT,
      xp INT,
      architectural_style STRING,
      open_hours STRING,
      description STRING,
      vintage_year STRING,
      soundscape_type STRING,
      secret_perk_title STRING,
      checkins_count INT
    );

    CREATE TABLE IF NOT EXISTS mcp_perks (
      id STRING PRIMARY KEY,
      place_name STRING,
      zone STRING,
      perk_title STRING,
      secret_code STRING,
      secret_menu_dish STRING,
      perk_value STRING,
      status STRING
    );

    CREATE TABLE IF NOT EXISTS mcp_lore (
      id STRING PRIMARY KEY,
      topic STRING,
      zone STRING,
      century STRING,
      content STRING,
      source_document STRING
    );

    CREATE TABLE IF NOT EXISTS mcp_adventures (
      id STRING PRIMARY KEY,
      title STRING,
      zone STRING,
      duration_mins INT,
      stops_count INT,
      total_xp INT,
      created_at STRING
    );

    CREATE TABLE IF NOT EXISTS mcp_query_audit (
      id INT AUTO_INCREMENT,
      sql_text STRING,
      rows_returned INT,
      executed_at STRING
    );
  `);

  // Seed Spots
  const existingSpots = (alasql('SELECT COUNT(*) AS cnt FROM mcp_spots') as any)[0]?.cnt;
  if (!existingSpots || existingSpots === 0) {
    alasql.tables.mcp_spots.data = [
      {
        id: 'senate-house',
        title: 'Senate House Stained Glass & Brickwork',
        category: 'Architecture',
        zone: 'Chepauk',
        lat: 13.0642,
        lng: 80.2811,
        xp: 90,
        architectural_style: 'Indo-Saracenic & Byzantine Vaults',
        open_hours: '09:30 – 16:30',
        description: "Robert Chisholm's masterwork harmonising Byzantine stone vaults with Mughal sunshades.",
        vintage_year: '1888 Vintage Madras Survey Archive',
        soundscape_type: 'belfry',
        secret_perk_title: 'Archive Vault Access',
        checkins_count: 142,
      },
      {
        id: 'coffee-roasters',
        title: 'The 1920s Filter Coffee Roasters',
        category: 'Food Lore',
        zone: 'Triplicane',
        lat: 13.0583,
        lng: 80.2745,
        xp: 75,
        architectural_style: 'Madras Heritage Timber Shopfront',
        open_hours: '10:00 AM – 19:00 PM',
        description: 'Third-generation roasters grinding slow chicory blends in antique iron drums.',
        vintage_year: '1932 Triplicane Market Ledger',
        soundscape_type: 'coffee',
        secret_perk_title: 'Peaberry Secret Brew 20% Off',
        checkins_count: 289,
      },
      {
        id: 'armenian-church',
        title: 'Armenian Church Bell Tower',
        category: 'Heritage',
        zone: 'George Town',
        lat: 13.0901,
        lng: 80.2882,
        xp: 110,
        architectural_style: 'Armenian Colonial Baroque',
        open_hours: 'Sundays 09:00 AM',
        description: 'Housing six monumental bells cast in Whitechapel and Amsterdam.',
        vintage_year: '1794 Armenian Heritage Chronicle',
        soundscape_type: 'belfry',
        secret_perk_title: 'Belfry Vault Key',
        checkins_count: 94,
      },
      {
        id: 'rayars-mess',
        title: "Rayar's Mess Secret Ghee Dosa",
        category: 'Food Lore',
        zone: 'Mylapore',
        lat: 13.0336,
        lng: 80.2697,
        xp: 85,
        architectural_style: 'Traditional Thinnai Courtyard',
        open_hours: '07:00 – 11:30',
        description: 'The 70-year ritual of wood-fired cast iron crisps served on fresh banana leaves.',
        vintage_year: '1954 Mylapore Heritage Food Map',
        soundscape_type: 'coffee',
        secret_perk_title: 'Double Podi Ghee Upgrade',
        checkins_count: 412,
      },
      {
        id: 'kapaleeshwarar',
        title: 'Kapaleeshwarar Teppakulam & Tank',
        category: 'Heritage',
        zone: 'Mylapore',
        lat: 13.0334,
        lng: 80.2706,
        xp: 120,
        architectural_style: 'Classic Dravidian Granite Masonry',
        open_hours: '05:30 – 21:30',
        description: 'Ancient stone tank surrounded by traditional agraharam streets.',
        vintage_year: '1910 Madras Photographic Society',
        soundscape_type: 'temple',
        secret_perk_title: 'Sacred Prasadam Token',
        checkins_count: 531,
      },
    ];
  }

  // Seed Perks
  const existingPerks = (alasql('SELECT COUNT(*) AS cnt FROM mcp_perks') as any)[0]?.cnt;
  if (!existingPerks || existingPerks === 0) {
    alasql.tables.mcp_perks.data = [
      {
        id: 'perk-peaberry-tasting',
        place_name: 'The 1920s Filter Coffee Roasters',
        zone: 'Triplicane',
        perk_title: 'Complimentary Second Brass Tumbler',
        secret_code: 'KAOS-PEABERRY-1924',
        secret_menu_dish: 'Jaggery Filter Decoction & Butter Bun',
        perk_value: '₹120 Value',
        status: 'available',
      },
      {
        id: 'perk-senate-archive',
        place_name: 'Senate House',
        zone: 'Chepauk',
        perk_title: 'Curator Ledger VIP Tour',
        secret_code: 'CHISHOLM-ARCHIVE-88',
        secret_menu_dish: 'Access to 1879 Architectural Blueprints',
        perk_value: 'Exclusive Experience',
        status: 'locked',
      },
      {
        id: 'perk-rayars-podi',
        place_name: "Rayar's Mess",
        zone: 'Mylapore',
        perk_title: 'Secret Double Podi Ghee Upgrade',
        secret_code: 'RAYAR-GHEE-SECRET-54',
        secret_menu_dish: 'Gunpowder Podi Crisped Butter Roast',
        perk_value: '₹80 Value',
        status: 'available',
      },
    ];
  }

  // Seed Lore
  const existingLore = (alasql('SELECT COUNT(*) AS cnt FROM mcp_lore') as any)[0]?.cnt;
  if (!existingLore || existingLore === 0) {
    alasql.tables.mcp_lore.data = [
      {
        id: 'lore-chisholm',
        topic: 'Robert Chisholm & Indo-Saracenic Genesis',
        zone: 'Chepauk',
        century: '19th Century',
        content: 'In 1871, Robert Fellowes Chisholm designed Senate House by merging Islamic cusped arches and bulbous domes with Byzantine stone vaults, avoiding British neoclassical templates to adapt to tropical coastal Madras humidity.',
        source_document: 'Madras Public Works Department Archives Vol. IV (1875)',
      },
      {
        id: 'lore-peaberry',
        topic: 'The 1924 Triplicane Peaberry Blend',
        zone: 'Triplicane',
        century: '20th Century',
        content: 'Triplicane roasters introduced the 80:20 plantation roast, roasting peaberry beans over tamarind wood coals in cast iron cylinders to achieve caramelized notes that hold through heavy milk decoction.',
        source_document: 'Madras Coffee Guild Minutes of 1924',
      },
      {
        id: 'lore-belfry',
        topic: 'Armenian Belfry Whitechapel Bells',
        zone: 'George Town',
        century: '18th Century',
        content: 'The six colossal bells of the Armenian Church of St. Mary were cast in Whitechapel Foundry, London and Amsterdam between 1754 and 1837. Their distinctive resonance cuts across George Town street density.',
        source_document: 'Armenian Community Ledger Madraspatnam (1803)',
      },
      {
        id: 'lore-teppakulam',
        topic: 'Mylapore Agraharam Cosmological Alignment',
        zone: 'Mylapore',
        century: '7th Century CE / 16th Century Restoration',
        content: 'The concentric streets surrounding Kapaleeshwarar Teppakulam were laid out in accordance with Agama Shastras, creating natural wind tunnels from the Bay of Bengal into inner courtyards.',
        source_document: 'Archeological Survey of South India, Memoir 21',
      },
    ];
  }
}

// SQL Query Runner with Audit Logging
export function runSql(sqlStatement: string, params: any[] = []): any {
  try {
    const result = alasql(sqlStatement, params);
    try {
      alasql('INSERT INTO mcp_query_audit VALUES (?, ?, ?, ?)', [
        Date.now(),
        sqlStatement.trim().substring(0, 200),
        Array.isArray(result) ? result.length : 1,
        new Date().toISOString(),
      ]);
    } catch {}
    return { success: true, data: result, rowCount: Array.isArray(result) ? result.length : 1 };
  } catch (err: any) {
    return { success: false, error: err?.message || 'SQL execution failed', data: [] };
  }
}
