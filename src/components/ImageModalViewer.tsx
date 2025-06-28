import React, { useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import styles from './ImageModalViewerStyle';

interface ImageModalViewerProps {
  isVisible: boolean;
  imageUri: string;
  onClose: () => void;
}

const ImageModalViewer: React.FC<ImageModalViewerProps> = ({ isVisible, imageUri, onClose }) => {
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setLoadingImage(true); // reset when modal opens
    }
  }, [isVisible]);

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose} onBackButtonPress={onClose} style={styles.modal}>
      <View style={styles.imageView}>
        {loadingImage && (
          <ActivityIndicator size="large" color="black" style={styles.loader} />
        )}
        <Image
          resizeMode="contain"
          source={{ uri: imageUri }}
          style={styles.image}
          onLoadStart={() => setLoadingImage(true)}
          onLoadEnd={() => setLoadingImage(false)}
        />
      </View>
    </Modal>
  );
};

export default ImageModalViewer;


