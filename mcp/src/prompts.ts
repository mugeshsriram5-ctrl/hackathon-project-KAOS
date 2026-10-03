export const MCP_PROMPTS = [
  {
    name: 'architect_walking_trail',
    description: 'Synthesizes an intelligent walking trail leveraging SQL landmarks and real acoustic coordinates',
    arguments: [
      { name: 'startingPoint', description: 'Neighborhood or landmark', required: true },
      { name: 'durationMinutes', description: 'Duration in minutes', required: true },
      { name: 'interests', description: 'Interests (e.g. Coffee, Dravidian, Colonial)', required: false },
    ],
  },
  {
    name: 'sql_data_curator',
    description: 'Generates analytical SQL queries to investigate heritage spot density, check-in heatmaps, and secret perk status',
    arguments: [
      { name: 'zone', description: 'Focus neighborhood zone', required: false },
    ],
  },
  {
    name: 'decode_architectural_style',
    description: 'Deep architectural dissection comparing Indo-Saracenic, Dravidian granite, and colonial baroque styles in Madras',
    arguments: [
      { name: 'buildingName', description: 'Target heritage monument', required: true },
    ],
  },
];
