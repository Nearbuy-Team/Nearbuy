// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
// NativeWind's `withNativeWind` wrapper removed — styling is inline only.
const config = getDefaultConfig(__dirname);

module.exports = config;
