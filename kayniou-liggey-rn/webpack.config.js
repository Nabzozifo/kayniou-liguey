const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      // Disable web platform to avoid react-native-maps errors
      babel: {
        dangerouslyAddModulePathsToTranspile: ['react-native-maps'],
      },
    },
    argv
  );

  // Add resolution for react-native-maps on web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-maps': 'react-native-web',
  };

  return config;
};
