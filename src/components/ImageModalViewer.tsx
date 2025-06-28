import React, { useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import { Image } from 'react-native';
import {
  Box,
  Spinner,
} from '@gluestack-ui/themed';

interface ImageModalViewerProps {
  isVisible: boolean;
  imageUri: string;
  onClose: () => void;
}

const ImageModalViewer: React.FC<ImageModalViewerProps> = ({ isVisible, imageUri, onClose }) => {
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setLoadingImage(true);
    }
  }, [isVisible]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
    >
      <Box
        w="90%"
        h="50%"
        bg="$backgroundLight0"
        borderRadius="$lg"
        overflow="hidden"
        justifyContent="center"
        alignItems="center"
      >
        {loadingImage && (
          <Spinner size="large" color="$textDark800" />
        )}
        <Image
          source={{ uri: imageUri }}
          resizeMode="contain"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
          onLoadStart={() => setLoadingImage(true)}
          onLoadEnd={() => setLoadingImage(false)}
        />
      </Box>
    </Modal>
  );
};

export default ImageModalViewer;
