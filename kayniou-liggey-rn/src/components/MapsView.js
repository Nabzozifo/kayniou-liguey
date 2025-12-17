import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Check if Google Maps API key is configured
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
const USE_GOOGLE_MAPS = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

/**
 * MapsView Component
 * Uses Google Maps when API key is available, falls back to OpenStreetMap otherwise
 *
 * Props:
 * - region: { latitude, longitude, latitudeDelta, longitudeDelta }
 * - markers: [{ id, coordinate: { latitude, longitude }, title, description }]
 * - onMarkerPress: (marker) => void
 * - style: ViewStyle
 */
const MapsView = ({ region, markers = [], onMarkerPress, style }) => {
  const webViewRef = useRef(null);

  useEffect(() => {
    if (!USE_GOOGLE_MAPS && webViewRef.current) {
      // Update map center when region changes
      const script = `
        if (map) {
          map.setView([${region.latitude}, ${region.longitude}], 13);
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [region]);

  if (USE_GOOGLE_MAPS) {
    // Use Google Maps
    return (
      <MapView
        style={[styles.map, style]}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress && onMarkerPress(marker)}
          />
        ))}
      </MapView>
    );
  }

  // Use OpenStreetMap as fallback
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${region.latitude}, ${region.longitude}], 13);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Add markers
          ${markers.map((marker, index) => `
            L.marker([${marker.coordinate.latitude}, ${marker.coordinate.longitude}])
              .addTo(map)
              .bindPopup('<b>${marker.title || ''}</b><br>${marker.description || ''}')
              .on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerPress',
                  markerId: '${marker.id}',
                  index: ${index}
                }));
              });
          `).join('\n')}

          // Add current location marker (blue dot)
          var currentLocationMarker = L.circleMarker([${region.latitude}, ${region.longitude}], {
            color: '#4285F4',
            fillColor: '#4285F4',
            fillOpacity: 0.8,
            radius: 8
          }).addTo(map);

          // Listen for updates from React Native
          window.updateMarkers = function(newMarkers) {
            // Clear existing markers
            map.eachLayer(function(layer) {
              if (layer instanceof L.Marker) {
                map.removeLayer(layer);
              }
            });

            // Add new markers
            newMarkers.forEach(function(marker) {
              L.marker([marker.coordinate.latitude, marker.coordinate.longitude])
                .addTo(map)
                .bindPopup('<b>' + (marker.title || '') + '</b><br>' + (marker.description || ''));
            });
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerPress' && onMarkerPress) {
              const marker = markers[data.index];
              onMarkerPress(marker);
            }
          } catch (error) {
            console.error('Error parsing WebView message:', error);
          }
        }}
      />
      {!USE_GOOGLE_MAPS && (
        <View style={styles.osmBadge}>
          <Text style={styles.osmBadgeText}>OpenStreetMap</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  osmBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  osmBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
});

export default MapsView;
