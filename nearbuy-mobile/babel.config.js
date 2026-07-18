module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind removed — the app styles entirely with inline `style` props.
    // Keeping `jsxImportSource: 'nativewind'` broke function-form Pressable
    // styles on the new architecture, so we use plain babel-preset-expo.
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
