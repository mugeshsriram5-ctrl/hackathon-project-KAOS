import alasql from 'alasql';
import { KAOS_SPOTS, KAOS_PERKS } from '../data/kaosData';
import { MasterSpot, RecommendedSpot } from '../types';

let STORAGE_KEY = 'kaos_sql_offline_cache';

export interface SqlQueryResult<T = any> {
  success: boolean;
  data: T[];
  columns?: string[];
  rowCount: number;
  error?: string;
  executionTimeMs: number;
}

export type SqlSyncState = 'synced' | 'syncing' | 'error';

export interface SqlSyncInfo {
  state: SqlSyncState;
  lastSyncedAt: Date | null;
  totalRecords: number;
  tablesCount: number;
  byteSize: number;
  message: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  zone: string;
  category: string;
  xpReward: number;
  icon: string;
  isCompleted: boolean;
  claimedAt: string;
  questDate: string;
  targetSpotId?: string;
}

export interface GlobalExplorer {
  id: string;
  rank: number;
  username: string;
  title: string;
  xp: number;
  streak: number;
  zone: string;
  avatar: string;
  isCurrentUser: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query_text: string;
  category: string;
  target_id?: string;
  target_title?: string;
  timestamp: string;
  searched_at: number;
}

export interface ExploredSpotRecord {
  id: string;
  spot_id: string;
  spot_title: string;
  category: string;
  architectural_style: string;
  zone: string;
  action_type: 'viewed' | 'audio_listened' | 'checked_in';
  timestamp: string;
  explored_at: number;
}

class KaosSqlDatabase {
  private isInitialized = false;
  private syncInfo: SqlSyncInfo = {
    state: 'synced',
    lastSyncedAt: null,
    totalRecords: 0,
    tablesCount: 9,
    byteSize: 0,
    message: 'Local SQL engine initialized',
  };
  private syncListeners: Set<(info: SqlSyncInfo) => void> = new Set();

  public init(userId?: string) {
    if (userId) {
      STORAGE_KEY = `kaos_sql_cache_${userId}`;
      this.isInitialized = false; // Force re-init for new user
    }
    if (this.isInitialized) return;

    try {
      // 1. Create relational tables
      alasql(`
        CREATE TABLE IF NOT EXISTS spots (
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
          checkins_count INT,
          is_favorite BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS adventures (
          id STRING PRIMARY KEY,
          title STRING,
          zone STRING,
          duration_mins INT,
          distance_km FLOAT,
          total_xp INT,
          difficulty STRING,
          completed BOOLEAN,
          progress_percent INT,
          stops_count INT,
          created_at STRING
        );

        CREATE TABLE IF NOT EXISTS explorer_progress (
          id STRING PRIMARY KEY,
          user_id STRING,
          xp INT,
          level INT,
          streak INT,
          stamps_count INT,
          perks_claimed_count INT,
          current_zone STRING,
          updated_at STRING
        );

        CREATE TABLE IF NOT EXISTS passport_stamps (
          id STRING PRIMARY KEY,
          spot_id STRING,
          spot_title STRING,
          zone STRING,
          stamped_at STRING,
          xp_awarded INT,
          photo_snapshot STRING
        );

        CREATE TABLE IF NOT EXISTS secret_perks (
          id STRING PRIMARY KEY,
          spot_id STRING,
          place_name STRING,
          zone STRING,
          perk_title STRING,
          secret_code STRING,
          secret_menu_dish STRING,
          perk_value STRING,
          status STRING,
          claimed_at STRING
        );

        CREATE TABLE IF NOT EXISTS daily_quests (
          id STRING PRIMARY KEY,
          title STRING,
          description STRING,
          zone STRING,
          category STRING,
          xp_reward INT,
          icon STRING,
          is_completed BOOLEAN,
          claimed_at STRING,
          quest_date STRING,
          target_spot_id STRING
        );

        CREATE TABLE IF NOT EXISTS global_explorers (
          id STRING PRIMARY KEY,
          username STRING,
          title STRING,
          xp INT,
          streak INT,
          zone STRING,
          avatar STRING,
          is_current_user BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS sql_query_history (
          id INT AUTO_INCREMENT,
          query_text STRING,
          rows_count INT,
          executed_at STRING
        );

        CREATE TABLE IF NOT EXISTS search_history (
          id STRING PRIMARY KEY,
          query_text STRING,
          category STRING,
          target_id STRING,
          target_title STRING,
          timestamp STRING,
          searched_at INT
        );

        CREATE TABLE IF NOT EXISTS explored_history (
          id STRING PRIMARY KEY,
          spot_id STRING,
          spot_title STRING,
          category STRING,
          architectural_style STRING,
          zone STRING,
          action_type STRING,
          timestamp STRING,
          explored_at INT
        );
      `);

      // 2. Restore cached data if available in localStorage
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.spots) alasql.tables.spots.data = parsed.spots;
          if (parsed.adventures) alasql.tables.adventures.data = parsed.adventures;
          if (parsed.explorer_progress) alasql.tables.explorer_progress.data = parsed.explorer_progress;
          if (parsed.passport_stamps) alasql.tables.passport_stamps.data = parsed.passport_stamps;
          if (parsed.secret_perks) alasql.tables.secret_perks.data = parsed.secret_perks;
          if (parsed.daily_quests) alasql.tables.daily_quests.data = parsed.daily_quests;
          if (parsed.global_explorers) alasql.tables.global_explorers.data = parsed.global_explorers;
          if (parsed.search_history) alasql.tables.search_history.data = parsed.search_history;
          if (parsed.explored_history) alasql.tables.explored_history.data = parsed.explored_history;
        } catch {}
      }

      // 3. Seed initial spots if table is empty
      const spotCount = (alasql('SELECT COUNT(*) AS cnt FROM spots') as any)[0]?.cnt;
      if (!spotCount || spotCount === 0) {
        alasql.tables.spots.data = KAOS_SPOTS.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          zone: s.zone,
          lat: s.lat ?? 13.0642,
          lng: s.lng ?? 80.2811,
          xp: s.xp,
          architectural_style: s.architecturalStyle,
          open_hours: s.openHours,
          description: s.description,
          vintage_year: s.vintageYear,
          soundscape_type: s.soundscapeType,
          secret_perk_title: s.secretPerkTitle || '',
          checkins_count: Math.floor(Math.random() * 45) + 12,
          is_favorite: false,
        }));
      }

      // 4. Seed secret perks if empty
      const perkCount = (alasql('SELECT COUNT(*) AS cnt FROM secret_perks') as any)[0]?.cnt;
      if (!perkCount || perkCount === 0) {
        alasql.tables.secret_perks.data = KAOS_PERKS.map((p) => ({
          id: p.id,
          spot_id: (p as any).spotId || '',
          place_name: p.placeName,
          zone: p.zone,
          perk_title: p.perkTitle,
          secret_code: p.secretCode,
          secret_menu_dish: p.secretMenuDish,
          perk_value: p.perkValue,
          status: p.status,
          claimed_at: (p as any).claimedAt || '',
        }));
      }

      // 5. Seed explorer progress if empty
      const progCount = (alasql('SELECT COUNT(*) AS cnt FROM explorer_progress') as any)[0]?.cnt;
      if (!progCount || progCount === 0) {
        const savedXp = parseInt(localStorage.getItem('kaos_user_xp') || '1420', 10);
        alasql.tables.explorer_progress.data = [
          {
            id: 'current_user',
            user_id: 'cartographer_01',
            xp: savedXp,
            level: Math.floor(savedXp / 300) + 1,
            streak: 5,
            stamps_count: 3,
            perks_claimed_count: 1,
            current_zone: 'Mylapore',
            updated_at: new Date().toISOString(),
          },
        ];
      }

      // 6. Seed sample adventures if empty
      const advCount = (alasql('SELECT COUNT(*) AS cnt FROM adventures') as any)[0]?.cnt;
      if (!advCount || advCount === 0) {
        alasql.tables.adventures.data = [
          {
            id: 'adv-mylapore-dawn',
            title: 'Mylapore Temple Tank & Coffee Trail',
            zone: 'Mylapore',
            duration_mins: 90,
            distance_km: 2.8,
            total_xp: 320,
            difficulty: 'Moderate',
            completed: false,
            progress_percent: 65,
            stops_count: 4,
            created_at: new Date().toISOString(),
          },
          {
            id: 'adv-colonial-vaults',
            title: 'Indo-Saracenic Vaults of Chepauk',
            zone: 'Chepauk',
            duration_mins: 120,
            distance_km: 3.5,
            total_xp: 410,
            difficulty: 'Challenging',
            completed: true,
            progress_percent: 100,
            stops_count: 5,
            created_at: new Date().toISOString(),
          },
        ];
      }

      // 7. Seed global explorers leaderboard if empty
      const expCount = (alasql('SELECT COUNT(*) AS cnt FROM global_explorers') as any)[0]?.cnt;
      if (!expCount || expCount === 0) {
        const savedUserXp = parseInt(localStorage.getItem('kaos_user_xp') || '1420', 10);
        alasql.tables.global_explorers.data = [
          { id: 'exp-1', username: 'Aravind K.', title: 'Apex Cartographer', xp: 4820, streak: 14, zone: 'Mylapore', avatar: '👑', is_current_user: false },
          { id: 'exp-2', username: 'Divya Ramesh', title: 'Heritage Chronicler', xp: 3950, streak: 11, zone: 'George Town', avatar: '🥈', is_current_user: false },
          { id: 'exp-3', username: 'Karthik V.', title: 'Indo-Saracenic Scout', xp: 3410, streak: 9, zone: 'Chepauk', avatar: '🥉', is_current_user: false },
          { id: 'exp-4', username: 'Meera Sundaram', title: 'Acoustic Geofence Ranger', xp: 2890, streak: 8, zone: 'Triplicane', avatar: '🎧', is_current_user: false },
          { id: 'exp-5', username: 'Vikramaditya S.', title: 'Colonial Vaults Guide', xp: 2450, streak: 7, zone: 'Fort St. George', avatar: '📜', is_current_user: false },
          { id: 'exp-6', username: 'Ananya Rao', title: 'Temple Tank Navigant', xp: 2100, streak: 6, zone: 'Mylapore', avatar: '🏛️', is_current_user: false },
          { id: 'exp-7', username: 'Siddharth Nair', title: 'Coromandel Trailblazer', xp: 1780, streak: 5, zone: 'Royapuram', avatar: '🧭', is_current_user: false },
          { id: 'exp-8', username: 'Usha Baskar', title: 'Master Cartographer (You)', xp: savedUserXp, streak: 5, zone: 'Mylapore', avatar: '🛡️', is_current_user: true },
          { id: 'exp-9', username: 'Sanjay Nathan', title: 'Urban Archaeologist', xp: 1210, streak: 4, zone: 'Triplicane', avatar: '🔍', is_current_user: false },
          { id: 'exp-10', username: 'Preethi Balaji', title: 'Roastery & Filter Scout', xp: 1050, streak: 3, zone: 'George Town', avatar: '☕', is_current_user: false },
          { id: 'exp-11', username: 'Gautham Menon', title: 'Vault Scribe', xp: 940, streak: 3, zone: 'Chepauk', avatar: '🗝️', is_current_user: false },
          { id: 'exp-12', username: 'Tara Swaminathan', title: 'Novice Pathbuilder', xp: 820, streak: 2, zone: 'Mylapore', avatar: '🗺️', is_current_user: false },
        ];
      }

      // 8. Seed search history if empty
      const searchCount = (alasql('SELECT COUNT(*) AS cnt FROM search_history') as any)[0]?.cnt;
      if (!searchCount || searchCount === 0) {
        alasql.tables.search_history.data = [
          {
            id: 'sh-1',
            query: 'Senate House Rosette',
            category: 'Landmarks',
            target_id: 'spot-1',
            target_title: 'Senate House Rosette',
            timestamp: '15m ago',
            searched_at: Date.now() - 1000 * 60 * 15,
          },
          {
            id: 'sh-2',
            query: 'Rayar’s Cafe',
            category: 'Secret Perks',
            target_id: 'perk-1',
            target_title: 'Rayar’s Mess Ghee Podi Idli',
            timestamp: '1h ago',
            searched_at: Date.now() - 1000 * 60 * 60,
          },
          {
            id: 'sh-3',
            query: 'Walking Trails',
            category: 'Navigation',
            target_id: 'nav-adventures',
            target_title: 'Walking Trails & Quests',
            timestamp: 'Yesterday',
            searched_at: Date.now() - 1000 * 60 * 60 * 24,
          },
        ];
      }

      // 9. Seed initial explored history if empty
      const expHistCount = (alasql('SELECT COUNT(*) AS cnt FROM explored_history') as any)[0]?.cnt;
      if (!expHistCount || expHistCount === 0) {
        alasql.tables.explored_history.data = [
          {
            id: 'eh-1',
            spot_id: 'senate-house',
            spot_title: 'Senate House',
            category: 'Architecture',
            architectural_style: 'Indo-Saracenic',
            zone: 'Chepauk',
            action_type: 'checked_in',
            timestamp: 'Yesterday',
            explored_at: Date.now() - 1000 * 60 * 60 * 24,
          },
          {
            id: 'eh-2',
            spot_id: 'kapaleeshwarar-temple',
            spot_title: 'Kapaleeshwarar Temple',
            category: 'Architecture',
            architectural_style: 'Dravidian Temple',
            zone: 'Mylapore',
            action_type: 'viewed',
            timestamp: '2 days ago',
            explored_at: Date.now() - 1000 * 60 * 60 * 48,
          },
          {
            id: 'eh-3',
            spot_id: 'rayars-mess',
            spot_title: "Rayar's Mess",
            category: 'Food Lore',
            architectural_style: 'Traditional South Indian Roastery',
            zone: 'Mylapore',
            action_type: 'audio_listened',
            timestamp: '3 days ago',
            explored_at: Date.now() - 1000 * 60 * 60 * 72,
          },
        ];
      }

      this.isInitialized = true;
      this.persist();
    } catch (err) {
      console.error('Failed to init SQL database:', err);
    }
  }

  // Persist memory tables to browser localStorage for offline durability
  public persist() {
    this.notifySync({
      ...this.syncInfo,
      state: 'syncing',
      message: 'Persisting to offline SQL cache...',
    });

    try {
      const dump = {
        spots: alasql.tables.spots?.data || [],
        adventures: alasql.tables.adventures?.data || [],
        explorer_progress: alasql.tables.explorer_progress?.data || [],
        passport_stamps: alasql.tables.passport_stamps?.data || [],
        secret_perks: alasql.tables.secret_perks?.data || [],
        daily_quests: alasql.tables.daily_quests?.data || [],
        global_explorers: alasql.tables.global_explorers?.data || [],
        search_history: alasql.tables.search_history?.data || [],
        explored_history: alasql.tables.explored_history?.data || [],
      };
      const json = JSON.stringify(dump);
      localStorage.setItem(STORAGE_KEY, json);

      const total =
        (dump.spots?.length || 0) +
        (dump.adventures?.length || 0) +
        (dump.explorer_progress?.length || 0) +
        (dump.passport_stamps?.length || 0) +
        (dump.secret_perks?.length || 0) +
        (dump.daily_quests?.length || 0) +
        (dump.global_explorers?.length || 0) +
        (dump.search_history?.length || 0) +
        (dump.explored_history?.length || 0);

      this.syncInfo = {
        state: 'synced',
        lastSyncedAt: new Date(),
        totalRecords: total,
        tablesCount: 9,
        byteSize: new Blob([json]).size,
        message: 'All records persisted offline',
      };
      this.notifySync(this.syncInfo);
    } catch (e: any) {
      console.warn('Storage quota limit reached while persisting SQL tables', e);
      this.syncInfo = {
        ...this.syncInfo,
        state: 'error',
        message: e?.message || 'Storage error while persisting',
      };
      this.notifySync(this.syncInfo);
    }
  }

  public getSyncInfo(): SqlSyncInfo {
    return { ...this.syncInfo };
  }

  public subscribeSync(listener: (info: SqlSyncInfo) => void): () => void {
    this.syncListeners.add(listener);
    listener(this.syncInfo);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifySync(info: SqlSyncInfo) {
    this.syncInfo = info;
    this.syncListeners.forEach((listener) => {
      try {
        listener(info);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kaos-sql-sync-change', { detail: info }));
    }
  }

  // Raw SQL Query Engine
  public query<T = any>(sql: string, params: any[] = []): SqlQueryResult<T> {
    this.init();
    const start = performance.now();
    try {
      const rows = alasql(sql, params);
      const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;
      const isArray = Array.isArray(rows);
      const data = isArray ? (rows as T[]) : ([rows] as T[]);

      // Extract columns
      const columns = data.length > 0 && typeof data[0] === 'object' && data[0] !== null
        ? Object.keys(data[0] as any)
        : [];

      // Record query in history
      try {
        alasql('INSERT INTO sql_query_history VALUES (?, ?, ?, ?)', [
          Date.now(),
          sql.trim().substring(0, 150),
          data.length,
          new Date().toLocaleTimeString(),
        ]);
      } catch {}

      // Persist if query was a mutation
      const upper = sql.trim().toUpperCase();
      if (
        upper.startsWith('INSERT') ||
        upper.startsWith('UPDATE') ||
        upper.startsWith('DELETE')
      ) {
        this.persist();
      }

      return {
        success: true,
        data,
        columns,
        rowCount: data.length,
        executionTimeMs,
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        rowCount: 0,
        error: err?.message || 'SQL execution failed',
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
      };
    }
  }

  // High-Level ORM / SQL Helpers
  public getSpots(zone?: string, category?: string) {
    let sql = 'SELECT * FROM spots WHERE 1=1';
    if (zone && zone !== 'All') {
      sql += ` AND LOWER(zone) = '${zone.toLowerCase()}'`;
    }
    if (category && category !== 'All') {
      sql += ` AND LOWER(category) = '${category.toLowerCase()}'`;
    }
    sql += ' ORDER BY xp DESC';
    return this.query(sql).data;
  }

  public recordCheckin(spotId: string, xpEarned: number) {
    this.query(`UPDATE spots SET checkins_count = checkins_count + 1 WHERE id = '${spotId}'`);

    const spot = this.query(`SELECT title, zone FROM spots WHERE id = '${spotId}'`).data[0];
    if (spot) {
      this.query(`
        INSERT INTO passport_stamps VALUES (
          'stamp-${Date.now()}',
          '${spotId}',
          '${spot.title.replace(/'/g, "''")}',
          '${spot.zone}',
          '${new Date().toISOString()}',
          ${xpEarned},
          ''
        )
      `);
    }

    this.query(`
      UPDATE explorer_progress
      SET xp = xp + ${xpEarned},
          stamps_count = stamps_count + 1,
          updated_at = '${new Date().toISOString()}'
      WHERE id = 'current_user'
    `);

    // Synchronize global_explorers current user record
    const stats = this.getExplorerStats();
    alasql(`UPDATE global_explorers SET xp = ? WHERE is_current_user = TRUE`, [stats.xp]);

    this.persist();
  }

  public setExplorerProgress(progress: { xp: number; level: number; streak: number; stamps_count: number; perks_claimed_count: number }) {
    this.init();
    try {
      alasql(`
        UPDATE explorer_progress
        SET xp = ?, level = ?, streak = ?, stamps_count = ?, perks_claimed_count = ?, updated_at = ?
        WHERE id = 'current_user'
      `, [progress.xp, progress.level, progress.streak, progress.stamps_count, progress.perks_claimed_count, new Date().toISOString()]);
      this.persist();
    } catch (err) {
      console.warn('Failed to set explorer progress:', err);
    }
  }

  public setPassportStamps(stamps: any[]) {
    this.init();
    try {
      if (Array.isArray(stamps)) {
        alasql.tables.passport_stamps.data = stamps;
        this.persist();
      }
    } catch (err) {
      console.warn('Failed to set passport stamps:', err);
    }
  }

  public getPassportStamps() {
    this.init();
    try {
      return (alasql('SELECT * FROM passport_stamps') as any[]) || [];
    } catch {
      return [];
    }
  }

  public claimPerk(perkId: string) {
    this.query(`
      UPDATE secret_perks
      SET status = 'claimed', claimed_at = '${new Date().toISOString()}'
      WHERE id = '${perkId}'
    `);
    this.query(`
      UPDATE explorer_progress
      SET perks_claimed_count = perks_claimed_count + 1
      WHERE id = 'current_user'
    `);
    this.persist();
  }

  // --- SQL-Powered Favorites & Custom Trails Helpers ---
  public toggleSaveSpot(spotId: string): boolean {
    return this.toggleSavePlace(spotId);
  }

  public toggleSavePlace(spotId: string): boolean {
    this.init();
    try {
      const rows = (alasql('SELECT is_favorite FROM spots WHERE id = ?', [spotId]) as any[]) || [];
      const currentStatus = rows[0] ? Boolean(rows[0].is_favorite) : false;
      const newStatus = !currentStatus;
      
      alasql('UPDATE spots SET is_favorite = ? WHERE id = ?', [newStatus, spotId]);
      this.persist();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('kaos-spot-saved-change', { detail: { spotId, isSaved: newStatus } })
        );
      }
      return newStatus;
    } catch (err) {
      console.warn('Failed to toggle save place:', err);
      return false;
    }
  }

  public isSpotSaved(spotId: string): boolean {
    this.init();
    try {
      const rows = (alasql('SELECT is_favorite FROM spots WHERE id = ?', [spotId]) as any[]) || [];
      return rows[0] ? Boolean(rows[0].is_favorite) : false;
    } catch {
      return false;
    }
  }

  public getSavedPlaces(): MasterSpot[] {
    this.init();
    try {
      const rows = (alasql('SELECT * FROM spots WHERE is_favorite = TRUE') as any[]) || [];
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        categoryKey: (r.category || '').toLowerCase().replace(/\s+/g, ''),
        zone: r.zone,
        distance: r.distance || '1.2 km away',
        duration: r.duration || '20 min walk',
        xp: Number(r.xp || 75),
        description: r.description,
        fullStory: r.fullStory || r.description,
        openHours: r.open_hours || '09:00 AM - 18:00 PM',
        imageUrl: r.imageUrl || 'https://images.unsplash.com/photo-1545235621-3f6b76649e78?q=80&w=600&auto=format&fit=crop',
        vintageYear: r.vintage_year,
        architecturalStyle: r.architectural_style,
        audioGuideScript: r.audio_guide_script || `Welcome to ${r.title}.`,
        soundscapeType: r.soundscape_type || 'temple',
        secretPerkTitle: r.secret_perk_title,
        lat: Number(r.lat || 13.0642),
        lng: Number(r.lng || 80.2811),
        rating: Number(r.rating || 4.2),
      }));
    } catch {
      return [];
    }
  }

  public createCustomTrail(
    title: string,
    zone: string,
    durationMins: number,
    distanceKm: number,
    stopsCount: number,
    xp: number
  ): void {
    this.init();
    try {
      const id = 'adv-' + Date.now();
      // Insert custom walk in adventures table
      alasql('INSERT INTO adventures VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        id,
        title,
        zone,
        durationMins,
        distanceKm,
        xp,
        'Moderate',
        true, // completed
        100, // progress %
        stopsCount,
        new Date().toISOString(),
      ]);
      this.persist();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kaos-adventures-updated'));
      }
    } catch (err) {
      console.warn('Failed to create custom trail:', err);
    }
  }

  // Daily Quests Feature: Fetch 3 exploration objectives from SQL
  public getDailyQuests(forceNew: boolean = false): DailyQuest[] {
    this.init();
    const today = new Date().toISOString().split('T')[0];

    if (!forceNew) {
      const existing = alasql(`SELECT * FROM daily_quests WHERE quest_date = ?`, [today]);
      if (Array.isArray(existing) && existing.length >= 3) {
        return existing.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          zone: r.zone,
          category: r.category,
          xpReward: Number(r.xp_reward) || 150,
          icon: r.icon,
          isCompleted: Boolean(r.is_completed),
          claimedAt: r.claimed_at || '',
          questDate: r.quest_date,
          targetSpotId: r.target_spot_id || '',
        }));
      }
    }

    // Synthesize 3 random exploration objectives from spots, secret_perks, and adventures
    alasql(`DELETE FROM daily_quests WHERE quest_date = ?`, [today]);

    const allSpots: any[] = alasql(`SELECT * FROM spots`) || [];
    const allPerks: any[] = alasql(`SELECT * FROM secret_perks`) || [];
    const allAdventures: any[] = alasql(`SELECT * FROM adventures`) || [];

    const shuffledSpots = [...allSpots].sort(() => Math.random() - 0.5);
    const shuffledPerks = [...allPerks].sort(() => Math.random() - 0.5);
    const shuffledAdventures = [...allAdventures].sort(() => Math.random() - 0.5);

    const s1 = shuffledSpots[0] || { id: 'senate-house', title: 'Senate House', zone: 'Chepauk', architectural_style: 'Indo-Saracenic' };
    const p1 = shuffledPerks[0] || { spot_id: 'rayars-mess', place_name: "Rayar's Mess", zone: 'Mylapore', perk_title: 'Crisp Ghee Vadai Secret Roast' };
    const a1 = shuffledAdventures[0] || { id: 'adv-mylapore-dawn', title: 'Mylapore Temple Tank & Coffee Trail', zone: 'Mylapore', distance_km: 2.8, difficulty: 'Moderate' };

    const questsToInsert: DailyQuest[] = [
      {
        id: `quest-${today}-spot-${Date.now()}`,
        title: `Survey ${s1.title}`,
        description: `Inspect the ${s1.architectural_style || 'historic'} details in ${s1.zone} and synchronize your beacon telemetry.`,
        zone: s1.zone || 'Central',
        category: 'Landmark Mission',
        xpReward: 160,
        icon: 'explore',
        isCompleted: false,
        claimedAt: '',
        questDate: today,
        targetSpotId: s1.id,
      },
      {
        id: `quest-${today}-perk-${Date.now() + 1}`,
        title: `Counter Lore: ${p1.place_name}`,
        description: `Whisper the secret code at ${p1.place_name} (${p1.zone}) to claim the ${p1.perk_title}.`,
        zone: p1.zone || 'Mylapore',
        category: 'Secret Counter Perk',
        xpReward: 130,
        icon: 'redeem',
        isCompleted: false,
        claimedAt: '',
        questDate: today,
        targetSpotId: p1.spot_id || '',
      },
      {
        id: `quest-${today}-trail-${Date.now() + 2}`,
        title: `Embark: ${a1.title}`,
        description: `Complete the ${a1.distance_km} km ${a1.difficulty} expedition through ${a1.zone} historical corridors.`,
        zone: a1.zone || 'Mylapore',
        category: 'Walking Expedition',
        xpReward: 200,
        icon: 'hiking',
        isCompleted: false,
        claimedAt: '',
        questDate: today,
        targetSpotId: '',
      },
    ];

    questsToInsert.forEach((q) => {
      alasql(
        `INSERT INTO daily_quests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.id,
          q.title,
          q.description,
          q.zone,
          q.category,
          q.xpReward,
          q.icon,
          q.isCompleted,
          q.claimedAt,
          q.questDate,
          q.targetSpotId || '',
        ]
      );
    });

    this.persist();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kaos-daily-quests-updated'));
    }
    return questsToInsert;
  }

  public completeDailyQuest(questId: string): { success: boolean; xpAwarded: number; questTitle: string } {
    this.init();
    const rows = alasql(`SELECT * FROM daily_quests WHERE id = ?`, [questId]) as any[];
    const quest = rows && rows[0];
    if (!quest) {
      return { success: false, xpAwarded: 0, questTitle: '' };
    }
    if (quest.is_completed) {
      return { success: false, xpAwarded: 0, questTitle: quest.title };
    }

    const now = new Date().toISOString();
    alasql(`UPDATE daily_quests SET is_completed = TRUE, claimed_at = ? WHERE id = ?`, [now, questId]);

    // Update explorer progress table
    alasql(
      `UPDATE explorer_progress SET xp = xp + ?, updated_at = ? WHERE id = 'current_user'`,
      [quest.xp_reward, now]
    );

    // Sync global_explorers table
    const stats = this.getExplorerStats();
    alasql(`UPDATE global_explorers SET xp = ? WHERE is_current_user = TRUE`, [stats.xp]);

    this.persist();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kaos-daily-quests-updated'));
    }

    return {
      success: true,
      xpAwarded: Number(quest.xp_reward) || 150,
      questTitle: quest.title,
    };
  }

  // Global Explorers Leaderboard Feature
  public getGlobalExplorers(limit: number = 10, zone?: string): GlobalExplorer[] {
    this.init();
    // Synchronize current user XP from explorer_progress or localStorage
    const explorer = this.getExplorerStats();
    if (explorer?.xp) {
      alasql(`UPDATE global_explorers SET xp = ?, streak = ? WHERE is_current_user = TRUE`, [
        explorer.xp,
        explorer.streak || 5,
      ]);
    }

    let sql = `SELECT * FROM global_explorers`;
    const params: any[] = [];
    if (zone && zone !== 'All') {
      sql += ` WHERE LOWER(zone) = LOWER(?)`;
      params.push(zone);
    }
    sql += ` ORDER BY xp DESC LIMIT ?`;
    params.push(limit);

    const rows = (alasql(sql, params) as any[]) || [];
    return rows.map((r, index) => ({
      id: r.id,
      rank: index + 1,
      username: r.username,
      title: r.title,
      xp: Number(r.xp),
      streak: Number(r.streak),
      zone: r.zone,
      avatar: r.avatar,
      isCurrentUser: Boolean(r.is_current_user),
    }));
  }

  public getExplorerStats() {
    return (
      this.query('SELECT * FROM explorer_progress WHERE id = "current_user"').data[0] || {
        xp: 1420,
        level: 5,
        streak: 5,
        stamps_count: 3,
        perks_claimed_count: 1,
      }
    );
  }

  public getTableStats() {
    this.init();
    return [
      { name: 'spots', rows: (alasql('SELECT COUNT(*) AS c FROM spots') as any)[0]?.c || 0, desc: 'Verified Heritage & Architectural Landmarks' },
      { name: 'adventures', rows: (alasql('SELECT COUNT(*) AS c FROM adventures') as any)[0]?.c || 0, desc: 'Curated Walking Trails & Quests' },
      { name: 'explorer_progress', rows: (alasql('SELECT COUNT(*) AS c FROM explorer_progress') as any)[0]?.c || 0, desc: 'XP, Streak & Cartographer Rank' },
      { name: 'passport_stamps', rows: (alasql('SELECT COUNT(*) AS c FROM passport_stamps') as any)[0]?.c || 0, desc: 'Beacon Check-Ins & Physical Stamps' },
      { name: 'secret_perks', rows: (alasql('SELECT COUNT(*) AS c FROM secret_perks') as any)[0]?.c || 0, desc: 'Secret Menu Dishes & Voucher Codes' },
      { name: 'daily_quests', rows: (alasql('SELECT COUNT(*) AS c FROM daily_quests') as any)[0]?.c || 0, desc: 'Active Daily Exploration Objectives' },
      { name: 'global_explorers', rows: (alasql('SELECT COUNT(*) AS c FROM global_explorers') as any)[0]?.c || 0, desc: 'Global Cartographer Leaderboard & XP Ranks' },
      { name: 'search_history', rows: (alasql('SELECT COUNT(*) AS c FROM search_history') as any)[0]?.c || 0, desc: 'Command Palette Query History & Telemetry' },
      { name: 'explored_history', rows: (alasql('SELECT COUNT(*) AS c FROM explored_history') as any)[0]?.c || 0, desc: 'Explored Locations & Tag Telemetry' },
    ];
  }

  // Export full relational database snapshot as JSON object
  public exportDatabaseJson() {
    this.init();
    const dump = {
      exportedAt: new Date().toISOString(),
      app: 'KAOS Heritage Cartography',
      version: '1.0.0',
      storageEngine: 'AlaSQL Relational Engine',
      storageKey: STORAGE_KEY,
      metadata: {
        totalRecords: 0,
        exportedBy: 'current_user',
        tablesCount: 9,
      },
      tables: {
        spots: (alasql.tables.spots?.data || []).map((s: any) => ({ ...s })),
        adventures: (alasql.tables.adventures?.data || []).map((a: any) => ({ ...a })),
        explorer_progress: (alasql.tables.explorer_progress?.data || []).map((e: any) => ({ ...e })),
        passport_stamps: (alasql.tables.passport_stamps?.data || []).map((p: any) => ({ ...p })),
        secret_perks: (alasql.tables.secret_perks?.data || []).map((sp: any) => ({ ...sp })),
        daily_quests: (alasql.tables.daily_quests?.data || []).map((q: any) => ({ ...q })),
        global_explorers: (alasql.tables.global_explorers?.data || []).map((ge: any) => ({ ...ge })),
        search_history: (alasql.tables.search_history?.data || []).map((sh: any) => ({ ...sh })),
        explored_history: (alasql.tables.explored_history?.data || []).map((eh: any) => ({ ...eh })),
        sql_query_history: (alasql.tables.sql_query_history?.data || []).map((h: any) => ({ ...h })),
      },
    };

    dump.metadata.totalRecords =
      dump.tables.spots.length +
      dump.tables.adventures.length +
      dump.tables.explorer_progress.length +
      dump.tables.passport_stamps.length +
      dump.tables.secret_perks.length +
      dump.tables.daily_quests.length +
      dump.tables.global_explorers.length +
      dump.tables.search_history.length +
      dump.tables.explored_history.length;

    return dump;
  }

  // Generate downloadable JSON file and trigger browser download
  public downloadBackupFile(): { filename: string; sizeBytes: number; recordsCount: number } {
    const backupData = this.exportDatabaseJson();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `kaos_sql_backup_${dateStr}.json`;

    if (typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return {
      filename,
      sizeBytes: blob.size,
      recordsCount: backupData.metadata.totalRecords,
    };
  }

  // Restore database tables from imported backup JSON object
  public restoreDatabaseJson(backup: any): { success: boolean; message: string; recordsRestored: number } {
    this.init();
    try {
      if (!backup || typeof backup !== 'object' || !backup.tables) {
        throw new Error('Invalid KAOS SQL backup file format');
      }

      let restoredCount = 0;
      if (Array.isArray(backup.tables.spots)) {
        alasql.tables.spots.data = backup.tables.spots;
        restoredCount += backup.tables.spots.length;
      }
      if (Array.isArray(backup.tables.adventures)) {
        alasql.tables.adventures.data = backup.tables.adventures;
        restoredCount += backup.tables.adventures.length;
      }
      if (Array.isArray(backup.tables.explorer_progress)) {
        alasql.tables.explorer_progress.data = backup.tables.explorer_progress;
        restoredCount += backup.tables.explorer_progress.length;
      }
      if (Array.isArray(backup.tables.passport_stamps)) {
        alasql.tables.passport_stamps.data = backup.tables.passport_stamps;
        restoredCount += backup.tables.passport_stamps.length;
      }
      if (Array.isArray(backup.tables.secret_perks)) {
        alasql.tables.secret_perks.data = backup.tables.secret_perks;
        restoredCount += backup.tables.secret_perks.length;
      }
      if (Array.isArray(backup.tables.daily_quests)) {
        alasql.tables.daily_quests.data = backup.tables.daily_quests;
        restoredCount += backup.tables.daily_quests.length;
      }
      if (Array.isArray(backup.tables.global_explorers)) {
        alasql.tables.global_explorers.data = backup.tables.global_explorers;
        restoredCount += backup.tables.global_explorers.length;
      }
      if (Array.isArray(backup.tables.search_history)) {
        alasql.tables.search_history.data = backup.tables.search_history;
        restoredCount += backup.tables.search_history.length;
      }
      if (Array.isArray(backup.tables.explored_history)) {
        alasql.tables.explored_history.data = backup.tables.explored_history;
        restoredCount += backup.tables.explored_history.length;
      }
      if (Array.isArray(backup.tables.sql_query_history)) {
        alasql.tables.sql_query_history.data = backup.tables.sql_query_history;
      }

      this.persist();
      return {
        success: true,
        message: `Successfully restored ${restoredCount} database records from backup!`,
        recordsRestored: restoredCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to restore database from backup file',
        recordsRestored: 0,
      };
    }
  }

  // --- SQL-Powered Search History Methods ---
  public recordSearch(query: string, target?: { id?: string; title?: string; category?: string }): void {
    this.init();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    try {
      const now = Date.now();
      const existing = alasql('SELECT id FROM search_history WHERE LOWER(query_text) = ?', [cleanQuery.toLowerCase()]) as any[];

      if (existing && existing.length > 0) {
        alasql(
          'UPDATE search_history SET searched_at = ?, timestamp = ?, target_id = COALESCE(?, target_id), target_title = COALESCE(?, target_title), category = COALESCE(?, category) WHERE id = ?',
          [
            now,
            'Just now',
            target?.id || null,
            target?.title || null,
            target?.category || null,
            existing[0].id,
          ]
        );
      } else {
        const id = 'sh-' + now + '-' + Math.random().toString(36).substring(2, 6);
        alasql('INSERT INTO search_history VALUES (?, ?, ?, ?, ?, ?, ?)', [
          id,
          cleanQuery,
          target?.category || 'Search',
          target?.id || '',
          target?.title || cleanQuery,
          'Just now',
          now,
        ]);
      }

      // Maintain only top 25 recent searches
      const allRows = alasql('SELECT id FROM search_history ORDER BY searched_at DESC') as any[];
      if (allRows.length > 25) {
        const toDelete = allRows.slice(25);
        toDelete.forEach((r) => {
          alasql('DELETE FROM search_history WHERE id = ?', [r.id]);
        });
      }

      this.persist();
    } catch (err) {
      console.warn('Error recording search in SQL:', err);
    }
  }

  public getRecentSearches(limit: number = 6): SearchHistoryItem[] {
    this.init();
    try {
      const rows = (alasql(`SELECT * FROM search_history ORDER BY searched_at DESC LIMIT ${limit}`) as any[]) || [];
      return rows.map((r: any) => ({
        id: r.id,
        query_text: r.query_text,
        category: r.category || 'Search',
        target_id: r.target_id,
        target_title: r.target_title,
        timestamp: r.timestamp || 'Recent',
        searched_at: Number(r.searched_at || 0),
      }));
    } catch {
      return [];
    }
  }

  public deleteSearchHistoryItem(id: string): void {
    this.init();
    try {
      alasql('DELETE FROM search_history WHERE id = ?', [id]);
      this.persist();
    } catch (err) {
      console.warn('Failed to delete search item:', err);
    }
  }

  public clearSearchHistory(): void {
    this.init();
    try {
      alasql('DELETE FROM search_history');
      this.persist();
    } catch (err) {
      console.warn('Failed to clear search history:', err);
    }
  }

  // --- SQL-Powered Explored History & Recommendation Engine ---
  public recordSpotExplored(
    spot: MasterSpot,
    actionType: 'viewed' | 'audio_listened' | 'checked_in' = 'viewed'
  ): void {
    this.init();
    try {
      const now = Date.now();
      const existing = (alasql('SELECT id FROM explored_history WHERE spot_id = ?', [spot.id]) as any[]) || [];

      if (existing && existing.length > 0) {
        alasql(
          'UPDATE explored_history SET explored_at = ?, timestamp = ?, action_type = ? WHERE spot_id = ?',
          [now, 'Just now', actionType, spot.id]
        );
      } else {
        const id = 'eh-' + now + '-' + Math.random().toString(36).substring(2, 6);
        alasql('INSERT INTO explored_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
          id,
          spot.id,
          spot.title,
          spot.category,
          spot.architecturalStyle || 'Heritage',
          spot.zone,
          actionType,
          'Just now',
          now,
        ]);
      }

      this.persist();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('kaos-spot-explored', { detail: { spot, actionType } })
        );
      }
    } catch (err) {
      console.warn('Error recording spot explored:', err);
    }
  }

  public getExploredHistory(): ExploredSpotRecord[] {
    this.init();
    try {
      const rows = (alasql('SELECT * FROM explored_history ORDER BY explored_at DESC') as any[]) || [];
      return rows.map((r: any) => ({
        id: r.id,
        spot_id: r.spot_id,
        spot_title: r.spot_title,
        category: r.category,
        architectural_style: r.architectural_style,
        zone: r.zone,
        action_type: r.action_type,
        timestamp: r.timestamp,
        explored_at: Number(r.explored_at || 0),
      }));
    } catch {
      return [];
    }
  }

  public getExploredTagsSummary() {
    this.init();
    const history = this.getExploredHistory();
    const styleCounts: Record<string, number> = {};
    const zoneCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    history.forEach((h) => {
      if (h.architectural_style) {
        styleCounts[h.architectural_style] = (styleCounts[h.architectural_style] || 0) + 1;
      }
      if (h.zone) {
        zoneCounts[h.zone] = (zoneCounts[h.zone] || 0) + 1;
      }
      if (h.category) {
        categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
      }
    });

    const topStyles = Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    const topZones = Object.entries(zoneCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    return {
      topStyles,
      topZones,
      topCategories,
      totalExplored: history.length,
    };
  }

  public getRecommendedSpots(limit: number = 4): RecommendedSpot[] {
    this.init();
    const summary = this.getExploredTagsSummary();
    const exploredHistory = this.getExploredHistory();
    const exploredSpotIds = new Set(exploredHistory.map((h) => h.spot_id));

    const scored = KAOS_SPOTS.map((spot) => {
      let score = 52;
      const matchedTags: string[] = [];
      let primaryReason = '';

      const spotStyle = (spot.architecturalStyle || '').toLowerCase();
      const spotZone = (spot.zone || '').toLowerCase();
      const spotCat = (spot.category || '').toLowerCase();

      // 1. Architectural Style Match (High Weight: +26 pts)
      const matchingStyle = summary.topStyles.find(
        (s) => spotStyle.includes(s.tag.toLowerCase()) || s.tag.toLowerCase().includes(spotStyle)
      );
      if (matchingStyle) {
        score += 26;
        matchedTags.push(spot.architecturalStyle);
        primaryReason = `Matches your interest in ${spot.architecturalStyle} architecture`;
      }

      // 2. Zone/Sector Match (Medium Weight: +18 pts)
      const matchingZone = summary.topZones.find(
        (z) => spotZone === z.tag.toLowerCase()
      );
      if (matchingZone) {
        score += 18;
        matchedTags.push(`${spot.zone} Sector`);
        if (!primaryReason) {
          primaryReason = `Popular in your frequently explored sector: ${spot.zone}`;
        }
      }

      // 3. Category Match (Medium Weight: +14 pts)
      const matchingCat = summary.topCategories.find(
        (c) => spotCat.includes(c.tag.toLowerCase()) || c.tag.toLowerCase().includes(spotCat)
      );
      if (matchingCat) {
        score += 14;
        matchedTags.push(spot.category);
        if (!primaryReason) {
          primaryReason = `Aligns with your ${spot.category} exploration trail`;
        }
      }

      // 4. Spot check-in popularity & XP depth (+2 to +6 pts)
      score += Math.min(6, Math.floor(spot.xp / 45));

      // 5. Exploration status & novelty
      const isAlreadyExplored = exploredSpotIds.has(spot.id);
      if (isAlreadyExplored) {
        score -= 6; // Slight novelty bias to prioritize unvisited spots
        if (!primaryReason) {
          primaryReason = `Explored spot · High affinity revisited`;
        }
      } else {
        score += 4;
        if (!primaryReason) {
          primaryReason = `Curated Coromandel architectural highlight`;
        }
      }

      // Find if related to a specific explored landmark
      const sourceExplored = exploredHistory.find(
        (eh) =>
          eh.spot_id !== spot.id &&
          (eh.architectural_style?.toLowerCase() === spotStyle || eh.zone?.toLowerCase() === spotZone)
      );
      if (sourceExplored && !isAlreadyExplored) {
        primaryReason = `Because you explored ${sourceExplored.spot_title}`;
      }

      const matchScore = Math.max(76, Math.min(99, Math.round(score)));

      return {
        spot,
        matchScore,
        matchReason: primaryReason,
        matchedTags: matchedTags.length > 0 ? matchedTags : [spot.architecturalStyle || spot.zone],
      };
    });

    // Sort descending by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  }

  public clearExploredHistory(): void {
    this.init();
    try {
      alasql('DELETE FROM explored_history');
      this.persist();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kaos-spot-explored'));
      }
    } catch (err) {
      console.warn('Failed to clear explored history:', err);
    }
  }

  public getProfile(): { level: number; xp: number; streak: number } {
    try {
      const saved = localStorage.getItem('kaos_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { level: 1, xp: 120, streak: 3 };
  }

  public saveProfile(level: number, xp: number, streak: number): void {
    try {
      localStorage.setItem('kaos_user_profile', JSON.stringify({ level, xp, streak }));
    } catch {}
  }
  public reset() {
    try {
      const tables = [
        'spots', 'adventures', 'explorer_progress', 'passport_stamps',
        'secret_perks', 'daily_quests', 'global_explorers',
        'sql_query_history', 'search_history', 'explored_history'
      ];
      tables.forEach(t => {
        try { alasql(`DROP TABLE IF EXISTS ${t}`); } catch {}
      });
      this.isInitialized = false;
    } catch (err) {
      console.error('SQL reset error:', err);
    }
  }
}

export const sqlDb = new KaosSqlDatabase();
