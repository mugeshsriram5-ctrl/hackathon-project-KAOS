import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { KAOS_SPOTS } from '../data/kaosData';
import { MasterSpot } from '../types';
import { DailyQuests } from '../components/DailyQuests';
import { ArCompassWidget } from '../components/ArCompassWidget';
import { ArDiscoveryOverlay } from '../components/ArDiscoveryOverlay';
import { GeoProximityNotifier } from '../components/GeoProximityNotifier';
import { ActivityFeed } from '../components/ActivityFeed';

interface ExploreScreenProps {
  onSpotSelected: (spot: MasterSpot) => void;
  onAwardXp: (amount: number, reason: string) => void;
  onShowToast: (msg: string) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onSpotSelected,
  onAwardXp,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'archive'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [visibleLimit, setVisibleLimit] = useState(16);
  const [isArVisionOpen, setIsArVisionOpen] = useState(false);

  // Controlled map state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.0642,
    lng: 80.2811,
  });
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [infoWindowSpot, setInfoWindowSpot] = useState<MasterSpot | null>(null);
  const [hasMapError, setHasMapError] = useState(false);

  React.useEffect(() => {
    const handleQuota = () => setHasMapError(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const categories = [
    'All', 'Heritage', 'Architecture', 'Food Lore', 'Attractions', 
    'Cafes', 'Restaurants', 'Hidden Gems', 'Shopping', 
    'Entertainment', 'Activities', 'Parks', 'Family Friendly'
  ];

  // Perform instant indexing of Chennai's 1,000+ places
  const filteredSpots = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cat = selectedCategory.toLowerCase();

    return KAOS_SPOTS.filter((spot) => {
      const matchesCat =
        selectedCategory === 'All' ||
        spot.category.toLowerCase().includes(cat) ||
        (spot.categoryKey && spot.categoryKey.toLowerCase().includes(cat));

      const matchesQuery =
        !q ||
        spot.title.toLowerCase().includes(q) ||
        spot.zone.toLowerCase().includes(q) ||
        spot.description.toLowerCase().includes(q) ||
        (spot.architecturalStyle && spot.architecturalStyle.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  const paginatedSpots = useMemo(() => {
    return filteredSpots.slice(0, visibleLimit);
  }, [filteredSpots, visibleLimit]);

  const mapMarkers = useMemo(() => {
    return filteredSpots.slice(0, 100);
  }, [filteredSpots]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleLimit(16);
    setInfoWindowSpot(null);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleLimit(16);
    setInfoWindowSpot(null);
  };

  return (
    <div className="space-y-6 pb-24 p-4 md:p-8 max-w-6xl mx-auto font-sans">
      {/* Sub-Tabs Selector Header */}
      <div className="flex items-center justify-between border-b border-[#26242C] pb-4 gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#1C1A1F] border border-[#26242C] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveSubTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'discover'
                ? 'bg-[#F05423] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            <span>Discover</span>
          </button>

          <button
            onClick={() => setActiveSubTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'archive'
                ? 'bg-[#F05423] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">travel_explore</span>
            <span>Places Archive</span>
          </button>
        </div>

        {activeSubTab === 'archive' ? (
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#F05423]/10 border border-[#F05423]/30 text-[#F05423] font-bold">
            1,000+ Landmarked Beacons
          </span>
        ) : (
          <button
            onClick={() => setIsArVisionOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#F05423]/10 border border-[#F05423]/30 text-[#F05423] text-xs font-bold hover:bg-[#F05423] hover:text-white transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px] animate-pulse">radar</span>
            <span>AR Vision</span>
          </button>
        )}
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      {activeSubTab === 'discover' ? (
        /* DISCOVER SUBTAB */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Discovery Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Explorer Telemetry Card with Swipe Navigation */}
            <motion.div 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x > threshold) {
                  const currentIndex = KAOS_SPOTS.findIndex(s => s.id === 'senate-house');
                  const prevIndex = (currentIndex - 1 + KAOS_SPOTS.length) % KAOS_SPOTS.length;
                  onSpotSelected(KAOS_SPOTS[prevIndex]);
                  onShowToast(`Cycle Detected: Scanning ${KAOS_SPOTS[prevIndex].title}`);
                } else if (info.offset.x < -threshold) {
                  const currentIndex = KAOS_SPOTS.findIndex(s => s.id === 'senate-house');
                  const nextIndex = (currentIndex + 1) % KAOS_SPOTS.length;
                  onSpotSelected(KAOS_SPOTS[nextIndex]);
                  onShowToast(`Cycle Detected: Scanning ${KAOS_SPOTS[nextIndex].title}`);
                }
              }}
              whileTap={{ scale: 0.98, cursor: 'grabbing' }}
              className="lg:col-span-12 bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[180px] cursor-grab relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#F05423]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">
                  <span className="text-[#F05423]">Chennai Sector</span>
                  <span aria-hidden="true">·</span>
                  <span>Acoustic Geofence Active</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400 animate-pulse">Swipe to Cycle Beacons</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                  Every street corner holds a century of whispers.
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Explore hidden Indo-Saracenic vaulted corridors, century-old wood-fired coffee roasteries, and sacred temple tanks aligned with ancient cosmology.
                </p>
              </div>
              
              {/* Visual swipe indicators */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-white">chevron_left</span>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-white">chevron_right</span>
              </div>
            </motion.div>

            {/* Live Social Grid Activity */}
            <div className="lg:col-span-12">
              <ActivityFeed />
            </div>

            {/* Daily Quests Segment */}
            <div className="lg:col-span-12">
              <DailyQuests
                onAwardXp={onAwardXp}
                onSpotSelected={onSpotSelected}
                onShowToast={onShowToast}
              />
            </div>

            {/* AR Heritage Compass Radar Widget */}
            <div className="lg:col-span-12">
              <ArCompassWidget
                onSpotSelected={onSpotSelected}
                onShowToast={onShowToast}
              />
            </div>

            {/* Geolocation Proximity Notifier & Background Radar */}
            <div className="lg:col-span-12">
              <GeoProximityNotifier
                onSpotSelected={onSpotSelected}
                onShowToast={onShowToast}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVE SUBTAB */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Toggle and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#26242C] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Landmark Archives Index</h3>
              <p className="text-[11px] text-zinc-400">Search Chennai coffee ledgers, architectural blueprints, and temples</p>
            </div>

            {/* List/Map Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1C1A1F] border border-[#26242C] rounded-xl self-start md:self-auto shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#F05423] text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_list</span>
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'map'
                    ? 'bg-[#F05423] text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">map</span>
                <span>Map View</span>
              </button>
            </div>
          </div>

          {/* Search Input and Categories */}
          <div className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-zinc-500 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search 1,000+ places by name, neighborhood, or keywords..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#1C1A1F] border border-[#26242C] rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F05423] transition-colors"
              />
            </div>

            {/* Categories pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#F05423] text-white font-bold'
                      : 'bg-[#1C1A1F] border border-[#26242C] text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid / Map */}
          {viewMode === 'list' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {paginatedSpots.map((spot) => (
                    <motion.div
                      key={spot.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSpotSelected(spot)}
                      className="bg-[#1C1A1F] border border-[#26242C] hover:border-[#F05423]/50 rounded-2xl overflow-hidden cursor-pointer transition-all group flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        <div className="relative h-36 w-full bg-[#121114]">
                          <img
                            src={spot.imageUrl}
                            alt={spot.title}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                          />
                          <span className="absolute top-2 left-2 bg-black/70 text-[#F05423] font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#F05423]/30">
                            {spot.zone}
                          </span>
                        </div>
                        <div className="p-3 space-y-1">
                          <h4 className="font-bold text-xs text-white group-hover:text-[#F05423] transition-colors line-clamp-1">
                            {spot.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {spot.description}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 pt-0 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{spot.category}</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
                          <span className="text-amber-400 font-bold">+{spot.xp} XP</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More Button */}
              {visibleLimit < filteredSpots.length && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleLimit((prev) => prev + 16)}
                    className="px-6 py-2.5 rounded-xl bg-[#1C1A1F] border border-[#26242C] hover:border-zinc-600 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    Load More Places ({filteredSpots.length - visibleLimit} Remaining)
                  </button>
                </div>
              )}
            </div>
          ) : hasMapError ? (
            <div className="h-[500px] rounded-2xl overflow-hidden border border-kaos-orange/40 bg-[#0E0C12] p-4 flex flex-col justify-between shadow-2xl relative">
              <div className="absolute inset-0 bg-[radial-gradient(#00E5FF_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
              
              <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-xs font-mono">
                <span className="text-kaos-teal font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-kaos-teal animate-ping" />
                  SECTOR RADAR EXPLORATION MATRIX
                </span>
                <button
                  onClick={() => setHasMapError(false)}
                  className="px-2.5 py-1 rounded-lg bg-kaos-orange/20 hover:bg-kaos-orange/30 border border-kaos-orange/40 text-kaos-orange text-[10px] font-bold cursor-pointer"
                >
                  Retry Google Maps
                </button>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[380px] p-1 scrollbar-thin">
                {filteredSpots.slice(0, 15).map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => onSpotSelected(spot)}
                    className="p-3 rounded-xl bg-black/60 border border-white/10 hover:border-kaos-orange/60 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-kaos-teal font-bold">{spot.zone}</span>
                        <span className="text-amber-400 font-bold">+{spot.xp} XP</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-kaos-orange transition-colors mt-1 line-clamp-1">
                        {spot.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {spot.description}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                      <span>{spot.category}</span>
                      <span className="text-kaos-orange font-bold">Inspect Details →</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 text-[10px] text-zinc-400 font-mono text-center bg-black/40 py-1 rounded-lg">
                Click any sector landmark to open complete archival dossier & audio guide
              </div>
            </div>
          ) : (
            <div className="h-[500px] rounded-2xl overflow-hidden border border-[#26242C]">
              <Map
                center={mapCenter}
                zoom={mapZoom}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                className="w-full h-full"
              >
                {mapMarkers.map((spot) => (
                  <AdvancedMarker
                    key={spot.id}
                    position={{ lat: spot.lat || 13.0642, lng: spot.lng || 80.2811 }}
                    onClick={() => setInfoWindowSpot(spot)}
                  >
                    <Pin background="#F05423" borderColor="#ffffff" glyphColor="#ffffff" />
                  </AdvancedMarker>
                ))}

                {infoWindowSpot && (
                  <InfoWindow
                    position={{ lat: infoWindowSpot.lat || 13.0642, lng: infoWindowSpot.lng || 80.2811 }}
                    onCloseClick={() => setInfoWindowSpot(null)}
                  >
                    <div className="p-2 text-zinc-900 max-w-xs space-y-1 font-sans">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#F05423]">
                        {infoWindowSpot.zone}
                      </span>
                      <h4 className="font-bold text-xs">{infoWindowSpot.title}</h4>
                      <p className="text-[11px] text-zinc-600 line-clamp-2">{infoWindowSpot.description}</p>
                      <button
                        onClick={() => onSpotSelected(infoWindowSpot)}
                        className="mt-1 w-full py-1 bg-[#F05423] text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        View Place Details
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          )}
        </div>
      )}
      {/* AR Vision Discovery Overlay */}
      {isArVisionOpen && (
        <ArDiscoveryOverlay 
          onClose={() => setIsArVisionOpen(false)}
          onSpotSelected={(spot) => {
            setIsArVisionOpen(false);
            onSpotSelected(spot);
          }}
        />
      )}
    </div>
  );
};
