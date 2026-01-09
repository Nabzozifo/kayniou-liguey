import * as Location from 'expo-location';
import { AppState } from 'react-native';
import api from './api';

class LocationService {
  constructor() {
    this.isUpdating = false;
    this.lastUpdateTime = 0;
    this.UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between updates
    this.appStateSubscription = null;
    this.userId = null;
    this.userType = null;
  }

  /**
   * Initialize the location service
   * @param {string} userId - The user ID
   * @param {string} userType - 'client' or 'worker'
   */
  initialize(userId, userType) {
    console.log('📍 Initializing location service for:', userType, userId);
    this.userId = userId;
    this.userType = userType;

    // Update location immediately on initialization
    this.updateLocation();

    // Setup AppState listener to update when app comes to foreground
    this.setupAppStateListener();
  }

  /**
   * Setup listener for app state changes
   */
  setupAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, updating location...');
        this.updateLocation();
      }
    });
  }

  /**
   * Update the user's location
   */
  async updateLocation() {
    // Prevent multiple simultaneous updates
    if (this.isUpdating) {
      console.log('⏳ Location update already in progress, skipping...');
      return;
    }

    // Check if enough time has passed since last update
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      console.log('⏰ Not enough time passed since last update, skipping...');
      return;
    }

    if (!this.userId || !this.userType) {
      console.log('⚠️ User not initialized, cannot update location');
      return;
    }

    this.isUpdating = true;

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        this.isUpdating = false;
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log('📍 Got current position:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Update location on backend
      const endpoint = this.userType === 'worker'
        ? `/worker-profile/${this.userId}/location`
        : `/client-profile/${this.userId}/location`;

      const response = await api.put(endpoint, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (response.data.success) {
        console.log(`✅ Location updated successfully for ${this.userType}`);
        this.lastUpdateTime = now;
      } else {
        console.log('⚠️ Location update failed:', response.data.message);
      }
    } catch (error) {
      console.error('❌ Error updating location:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Cleanup the service
   */
  cleanup() {
    console.log('🧹 Cleaning up location service');
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.userId = null;
    this.userType = null;
  }

  /**
   * Force update location (bypass time check)
   */
  async forceUpdate() {
    this.lastUpdateTime = 0;
    await this.updateLocation();
  }
}

// Export singleton instance
export default new LocationService();
