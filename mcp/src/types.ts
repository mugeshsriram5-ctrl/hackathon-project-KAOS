export interface McpSpotRecord {
  id: string;
  title: string;
  category: string;
  zone: string;
  lat: number;
  lng: number;
  xp: number;
  architectural_style: string;
  open_hours: string;
  description: string;
  vintage_year: string;
  soundscape_type: string;
  secret_perk_title: string;
  checkins_count: number;
}

export interface McpPerkRecord {
  id: string;
  place_name: string;
  zone: string;
  perk_title: string;
  secret_code: string;
  secret_menu_dish: string;
  perk_value: string;
  status: string;
}

export interface McpLoreRecord {
  id: string;
  topic: string;
  zone: string;
  century: string;
  content: string;
  source_document: string;
}

export interface McpTrailStep {
  step: number;
  time: string;
  spot: string;
  zone: string;
  action: string;
  soundscape: string;
  xp: number;
}
