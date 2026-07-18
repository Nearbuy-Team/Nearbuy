/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        volt: '#CCFF00',
        teal: '#008080',
        purple: '#9B5DE5',
        ink: '#111317',
        subtle: '#84888F',
        muted: '#9A9EA6',
        surface: '#FFFFFF',
        canvas: '#F6F6F4',
        chip: '#F3F3F1',
        track: '#EEEEEC',
      },
      fontFamily: {
        manrope: ['Manrope_400Regular'],
        'manrope-medium': ['Manrope_500Medium'],
        'manrope-semibold': ['Manrope_600SemiBold'],
        'manrope-bold': ['Manrope_700Bold'],
        'manrope-extrabold': ['Manrope_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
