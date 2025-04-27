module.exports = {
  presets: ['babel-preset-expo'],

  plugins: [
    ['react-native-worklets-core/plugin'],
    ['react-native-reanimated/plugin'], // ← 꼭 있어야 함
  ],
}