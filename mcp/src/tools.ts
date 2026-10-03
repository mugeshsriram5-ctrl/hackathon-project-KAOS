import { runSql } from './sqlStore.js';

export const MCP_TOOL_SPECS = [
  {
    name: 'kaos_sql_query',
    description: 'Execute arbitrary SQL SELECT / INSERT / UPDATE / AGGREGATE queries on the relational KAOS database (tables: mcp_spots, mcp_perks, mcp_lore, mcp_adventures, mcp_query_audit).',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL statement (e.g., "SELECT zone, COUNT(*) AS total, SUM(xp) AS total_xp FROM mcp_spots GROUP BY zone ORDER BY total_xp DESC")',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'kaos_sql_analytics',
    description: 'Retrieve deep SQL analytical reports: zone breakdown, XP totals, top check-ins, and perk availability metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['zone_summary', 'top_visited', 'perk_distribution', 'full_audit'],
          description: 'Type of SQL analytical report to generate',
        },
      },
    },
  },
  {
    name: 'kaos_get_spots',
    description: 'Retrieve verified Chennai heritage spots with SQL filtering on zone, category, and minimum XP.',
    inputSchema: {
      type: 'object',
      properties: {
        zone: { type: 'string', description: 'Zone/Neighborhood filter (e.g., Mylapore, Chepauk, Triplicane, George Town)' },
        category: { type: 'string', description: 'Category filter (e.g., Architecture, Food Lore, Heritage)' },
        minXp: { type: 'number', description: 'Minimum XP threshold' },
      },
    },
  },
  {
    name: 'kaos_search_lore',
    description: 'Deep full-text search across historical documents and 1888 Survey records using SQL pattern matching.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or keyword' },
        zone: { type: 'string', description: 'Optional zone restriction' },
      },
      required: ['query'],
    },
  },
  {
    name: 'kaos_get_secret_perks',
    description: 'Query unlockable vendor perks, secret codes, and dish upgrades via SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        zone: { type: 'string', description: 'Zone filter' },
        status: { type: 'string', description: 'available | claimed | locked' },
      },
    },
  },
  {
    name: 'kaos_verify_geofence',
    description: 'Verify GPS coordinates against landmark coordinates and update check-in counts in SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        spotId: { type: 'string', description: 'Target spot ID' },
        userLat: { type: 'number', description: 'User latitude' },
        userLng: { type: 'number', description: 'User longitude' },
      },
      required: ['spotId', 'userLat', 'userLng'],
    },
  },
  {
    name: 'kaos_synthesize_expedition',
    description: 'Synthesize an intelligent walking expedition by querying optimal spot sequences via SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        startingPoint: { type: 'string', description: 'Starting neighborhood or spot' },
        durationMinutes: { type: 'number', description: 'Duration in minutes' },
        focusCategory: { type: 'string', description: 'Optional category preference' },
      },
      required: ['startingPoint', 'durationMinutes'],
    },
  },
];

export function executeTool(name: string, args: any) {
  switch (name) {
    case 'kaos_sql_query': {
      const sql = args.sql;
      if (!sql) throw new Error('Missing "sql" argument');
      return runSql(sql);
    }

    case 'kaos_sql_analytics': {
      const metric = args.metric || 'zone_summary';
      if (metric === 'zone_summary') {
        return runSql(
          'SELECT zone, COUNT(*) AS spot_count, SUM(xp) AS cumulative_xp, AVG(xp) AS avg_xp FROM mcp_spots GROUP BY zone ORDER BY cumulative_xp DESC'
        );
      } else if (metric === 'top_visited') {
        return runSql(
          'SELECT title, zone, xp, checkins_count FROM mcp_spots ORDER BY checkins_count DESC'
        );
      } else if (metric === 'perk_distribution') {
        return runSql(
          'SELECT zone, COUNT(*) AS perk_count, status FROM mcp_perks GROUP BY zone, status'
        );
      } else {
        return runSql('SELECT * FROM mcp_query_audit ORDER BY executed_at DESC LIMIT 20');
      }
    }

    case 'kaos_get_spots': {
      let query = 'SELECT * FROM mcp_spots WHERE 1=1';
      const params: any[] = [];
      if (args.zone) {
        query += ` AND LOWER(zone) = LOWER('${args.zone.replace(/'/g, "''")}')`;
      }
      if (args.category) {
        query += ` AND LOWER(category) = LOWER('${args.category.replace(/'/g, "''")}')`;
      }
      if (args.minXp) {
        query += ` AND xp >= ${Number(args.minXp)}`;
      }
      query += ' ORDER BY xp DESC';
      return runSql(query, params);
    }

    case 'kaos_search_lore': {
      const q = (args.query || '').replace(/'/g, "''").toLowerCase();
      let query = `SELECT * FROM mcp_lore WHERE (LOWER(topic) LIKE '%${q}%' OR LOWER(content) LIKE '%${q}%')`;
      if (args.zone) {
        query += ` AND LOWER(zone) = LOWER('${args.zone.replace(/'/g, "''")}')`;
      }
      return runSql(query);
    }

    case 'kaos_get_secret_perks': {
      let query = 'SELECT * FROM mcp_perks WHERE 1=1';
      if (args.zone) {
        query += ` AND LOWER(zone) = LOWER('${args.zone.replace(/'/g, "''")}')`;
      }
      if (args.status) {
        query += ` AND status = '${args.status}'`;
      }
      return runSql(query);
    }

    case 'kaos_verify_geofence': {
      const spotRes = runSql(`SELECT * FROM mcp_spots WHERE id = '${args.spotId.replace(/'/g, "''")}'`);
      const spot = spotRes.data?.[0];
      if (!spot) return { verified: false, message: 'Spot not found in SQL registry' };

      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371e3;
      const φ1 = toRad(args.userLat);
      const φ2 = toRad(spot.lat);
      const Δφ = toRad(spot.lat - args.userLat);
      const Δλ = toRad(spot.lng - args.userLng);

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = Math.round(R * c);

      const isInside = distanceMeters <= 250;
      if (isInside) {
        runSql(`UPDATE mcp_spots SET checkins_count = checkins_count + 1 WHERE id = '${spot.id}'`);
      }

      return {
        verified: isInside,
        distanceMeters,
        spotTitle: spot.title,
        xpAwarded: isInside ? spot.xp : 0,
        message: isInside
          ? `Beacon Verified! +${spot.xp} XP awarded. Check-ins incremented to ${spot.checkins_count + 1}.`
          : `Beacon is ${distanceMeters}m away. Proximity threshold is 250m.`,
      };
    }

    case 'kaos_synthesize_expedition': {
      let sql = 'SELECT * FROM mcp_spots';
      if (args.focusCategory) {
        sql += ` WHERE LOWER(category) = LOWER('${args.focusCategory.replace(/'/g, "''")}')`;
      }
      sql += ' ORDER BY xp DESC LIMIT 4';
      const spotsResult = runSql(sql);
      const stops = (spotsResult.data || []).map((s: any, idx: number) => ({
        step: idx + 1,
        time: `${7 + Math.floor(idx * 0.75)}:${(idx * 45) % 60 === 0 ? '00' : '30'} AM`,
        spot: s.title,
        zone: s.zone,
        style: s.architectural_style,
        soundscape: s.soundscape_type,
        xp: s.xp,
      }));

      return {
        expeditionTitle: `Coromandel Heritage Circuit: ${args.startingPoint}`,
        targetDuration: `${args.durationMinutes} Minutes`,
        stops,
        totalCumulativeXp: stops.reduce((acc: number, c: any) => acc + c.xp, 0),
        generatedVia: 'SQL Relational Optimizer',
      };
    }

    default:
      throw new Error(`Unknown MCP Tool: ${name}`);
  }
}
