import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface BrandMarkProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandMark({ size = 32, style }: BrandMarkProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="Nearbuy"
      source={require('../assets/brand-icon-master.png')}
      style={[{ width: size, height: size, borderRadius: Math.max(7, size * 0.22) }, style]}
    />
  );
}
