import React from 'react';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { ColorValue, ImageSourcePropType, View, ViewProps } from 'react-native';
import { cardStyle } from './styles';
import { Box } from '../box';
import { ImageBackground } from '../image-background';
import { VStack } from '../vstack';
import { Text } from '../text';

type ICardProps = ViewProps &
  VariantProps<typeof cardStyle> & { className?: string };

const Card = React.forwardRef<React.ComponentRef<typeof View>, ICardProps>(
  function Card(
    { className, size = 'md', variant = 'elevated', ...props },
    ref
  ) {
    return (
      <View
        className={cardStyle({ size, variant, class: className })}
        {...props}
        ref={ref}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };


export type ImageCard = {
  title: string;
  backgroundImage: ImageSourcePropType | undefined;
  overlayOpacity: number;
  textColor?: ColorValue;
  onClick?: () => void;
};


function ImageCard ({
  title,
  backgroundImage,
  overlayOpacity = 0.5, // 기본 투명도 0.5 (50%)
  textColor,
  children, // 자식 컴포넌트를 받을 수 있도록 추가
  onClick,
}: React.PropsWithChildren<{
  title: string;
  backgroundImage: ImageSourcePropType | undefined;
  overlayOpacity: number;
  textColor?: ColorValue;
  onClick?: () => void;
}>) {
  return (
    <Box className="rounded-xl overflow-hidden" onTouchEnd={onClick}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        className="flex-1 justify-start h-52"
      >
        {/* 반투명 오버레이 */}
        <Box
          className="absolute top-0 left-0 right-0 bottom-0 bg-gray-800"
          style={{ opacity: overlayOpacity }}
        />

        {/* 컨텐츠 (제목 및 자식 컴포넌트) */}
        <VStack className="p-6 gap-2 z-1">
          <Text className="font-nanum-square-extra-bold text-title">
            {title}
          </Text>
          {children}
        </VStack>
      </ImageBackground>
    </Box>
  );
};

export {ImageCard}