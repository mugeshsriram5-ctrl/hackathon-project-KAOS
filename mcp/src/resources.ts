import { runSql } from './sqlStore.js';

export const MCP_RESOURCES = [
  {
    uri: 'kaos://sql/schema',
    name: 'Relational Database Schema & Table Definitions',
    mimeType: 'application/json',
    description: 'Schema of mcp_spots, mcp_perks, mcp_lore, mcp_adventures, and mcp_query_audit tables',
  },
  {
    uri: 'kaos://analytics/zone-matrix',
    name: 'Live SQL Zone Density & XP Matrix',
    mimeType: 'application/json',
    description: 'Aggregated analytics generated on-the-fly via SQL GROUP BY',
  },
  {
    uri: 'kaos://lore/chennai-master-chronicle',
    name: 'Chennai Heritage & Architectural Survey Ledgers',
    mimeType: 'text/markdown',
    description: 'Compiled archival ledgers dating from 1700 to 1954',
  },
  {
    uri: 'kaos://perks/active-voucher-codes',
    name: 'Secret Culinary Perks & Upgrade Registry',
    mimeType: 'application/json',
    description: 'Available secret dish upgrades and vendor counter phrases',
  },
];

export function readResource(uri: string) {
  switch (uri) {
    case 'kaos://sql/schema':
      return {
        tables: ['mcp_spots', 'mcp_perks', 'mcp_lore', 'mcp_adventures', 'mcp_query_audit'],
        columns: {
          mcp_spots: ['id', 'title', 'category', 'zone', 'lat', 'lng', 'xp', 'architectural_style', 'open_hours', 'description', 'vintage_year', 'soundscape_type', 'secret_perk_title', 'checkins_count'],
          mcp_perks: ['id', 'place_name', 'zone', 'perk_title', 'secret_code', 'secret_menu_dish', 'perk_value', 'status'],
          mcp_lore: ['id', 'topic', 'zone', 'century', 'content', 'source_document'],
          mcp_adventures: ['id', 'title', 'zone', 'duration_mins', 'stops_count', 'total_xp', 'created_at'],
        },
      };

    case 'kaos://analytics/zone-matrix':
      return runSql(
        'SELECT zone, count(*) AS spots, sum(xp) AS xp_pool, sum(checkins_count) AS total_visits FROM mcp_spots GROUP BY zone'
      );

    case 'kaos://perks/active-voucher-codes':
      return runSql('SELECT * FROM mcp_perks WHERE status = "available"');

    case 'kaos://lore/chennai-master-chronicle':
      const loreRows = runSql('SELECT topic, zone, century, content FROM mcp_lore').data || [];
      return loreRows
        .map(
          (l: any) =>
            `### ${l.topic} (${l.zone} · ${l.century})\n${l.content}\n`
        )
        .join('\n');

    default:
      throw new Error(`Resource URI not found: ${uri}`);
  }
}
