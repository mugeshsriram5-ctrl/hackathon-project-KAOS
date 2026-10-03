import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MarkerClusterer, Cluster, ClusterStats } from '@googlemaps/markerclusterer';
import { MasterSpot } from '../types';

interface ClusteredSpotsMarkersProps {
  spots: MasterSpot[];
  selectedSpotId?: string;
  onSpotClick: (spot: MasterSpot) => void;
}

export const ClusteredSpotsMarkers: React.FC<ClusteredSpotsMarkersProps> = ({
  spots,
  selectedSpotId,
  onSpotClick,
}) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});

  // Initialize MarkerClusterer with customized Cyber-Heritage cluster renderer
  const clusterer = useMemo(() => {
    if (!map) return null;

    return new MarkerClusterer({
      map,
      renderer: {
        render({ count, position }: Cluster, stats: ClusterStats, targetMap: google.maps.Map) {
          const AdvancedMarkerElement = (window as any).google?.maps?.marker?.AdvancedMarkerElement;
          
          if (AdvancedMarkerElement) {
            const isHighDensity = count >= 10;
            const container = document.createElement('div');
            container.className = 'kaos-cluster-marker group cursor-pointer';

            // High-contrast cyber-heritage cluster styling
            container.style.cssText = `
              background: ${
                isHighDensity
                  ? 'linear-gradient(135deg, #F05423 0%, #FF8A00 100%)'
                  : 'linear-gradient(135deg, #00E5FF 0%, #0088FF 100%)'
              };
              color: #ffffff;
              font-family: 'Space Grotesk', monospace, sans-serif;
              font-weight: 800;
              font-size: ${count >= 100 ? '11px' : '13px'};
              width: ${count >= 100 ? '46px' : isHighDensity ? '42px' : '36px'};
              height: ${count >= 100 ? '46px' : isHighDensity ? '42px' : '36px'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2.5px solid #ffffff;
              box-shadow: 0 4px 18px ${
                isHighDensity ? 'rgba(240, 84, 35, 0.65)' : 'rgba(0, 229, 255, 0.65)'
              };
              transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
              transform: scale(1);
              user-select: none;
            `;

            container.onmouseenter = () => {
              container.style.transform = 'scale(1.15)';
            };
            container.onmouseleave = () => {
              container.style.transform = 'scale(1)';
            };

            container.textContent = String(count);
            container.title = `${count} Heritage Spots clustered in this sector. Click to zoom.`;

            return new AdvancedMarkerElement({
              map: targetMap,
              position,
              content: container,
              zIndex: 1000 + count,
            });
          }

          // Fallback to legacy marker if AdvancedMarkerElement is not initialized
          return new (window as any).google.maps.Marker({
            position,
            label: {
              text: String(count),
              color: '#ffffff',
              fontWeight: 'bold',
            },
            map: targetMap,
          });
        },
      },
    });
  }, [map]);

  // Maintain reference callback pattern for AdvancedMarker instances
  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    setMarkers((prev) => {
      if ((marker && prev[key]) || (!marker && !prev[key])) return prev;

      if (marker) {
        return { ...prev, [key]: marker };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  // Synchronize the clusterer whenever the marker set updates
  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));

    return () => {
      clusterer.clearMarkers();
    };
  }, [clusterer, markers]);

  return (
    <>
      {spots.map((spot) => (
        <AdvancedMarker
          key={spot.id}
          ref={(marker) => setMarkerRef(marker as any, spot.id)}
          position={{ lat: spot.lat || 13.0642, lng: spot.lng || 80.2811 }}
          onClick={() => onSpotClick(spot)}
          title={spot.title}
        >
          <Pin
            background={spot.id === selectedSpotId ? '#F05423' : '#10B981'}
            borderColor="#ffffff"
            glyphColor="#ffffff"
            scale={spot.id === selectedSpotId ? 1.15 : 0.95}
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export default ClusteredSpotsMarkers;
