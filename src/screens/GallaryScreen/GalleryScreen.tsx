import React, { useEffect, useState } from 'react';
import { FlatList, Alert, Dimensions } from 'react-native';
import { Box, Text, Spinner, Image } from '@gluestack-ui/themed';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemSize = width / numColumns - 20;

interface PhotoDocument {
  id: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  uploadedAt: any;
  fileName?: string;
}

const PhotoGalleryScreen = () => {
  const [photos, setPhotos] = useState<PhotoDocument[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);

  const fetchPhotosFromFirestore = async () => {
    try {
      setLoadingPhotos(true);
      console.log('Fetching photos from Firestore...');

      const photosCollection = await firestore()
        .collection('photos')
        .orderBy('uploadedAt', 'desc')
        .get();

      const photosData: PhotoDocument[] = [];

      photosCollection.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl && data.location) {
          photosData.push({
            id: doc.id,
            imageUrl: data.imageUrl,
            location: data.location,
            uploadedAt: data.uploadedAt,
            fileName: data.fileName || 'Unknown',
          });
        }
      });

      setPhotos(photosData);
      console.log(`Loaded ${photosData.length} photos from Firestore`);
    } catch (error) {
      Alert.alert('Error', 'Failed to load photos from database');
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    fetchPhotosFromFirestore();
  }, []);

  const renderPhoto = ({ item }: { item: PhotoDocument }) => (
    <Box
      width={itemSize}
      m="$2"
      bg="$backgroundLight50"
      borderRadius="$lg"
      overflow="hidden"
      elevation={2}
    >
      <Image
        source={{ uri: item.imageUrl }}
        alt={item.fileName}
        width={itemSize}
        height={itemSize}
        resizeMode="cover"
      />
      <Box px="$2" py="$2" bg="$backgroundLight100">
        <Text size="sm" color="$textDark800">
          📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
        <Text size="xs" color="$textDark400" mt="$1" numberOfLines={1}>
          {item.fileName}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box flex={1} bg="$backgroundLight0" p="$3">
      {loadingPhotos ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$blue600" />
        </Box>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        />
      )}
    </Box>
  );
};

export default PhotoGalleryScreen;
