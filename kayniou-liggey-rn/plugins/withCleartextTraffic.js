const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Plugin Expo pour activer le trafic HTTP cleartext (non crypté)
 * Nécessaire pour se connecter au backend EC2 via HTTP
 */
const withCleartextTraffic = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ajouter android:usesCleartextTraffic="true"
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    console.log('✅ Plugin cleartext traffic appliqué - HTTP autorisé');

    return config;
  });
};

module.exports = withCleartextTraffic;
