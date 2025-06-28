import { Alert, useWindowDimensions } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { check, RESULTS, request, PERMISSIONS } from 'react-native-permissions';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import ImageModalViewer from '../../components/ImageModalViewer';
import { RootStackNavigation } from '../../navigation/RootNavigation';
import {
  Box,
  Text,
  Pressable,
  Spinner
} from '@gluestack-ui/themed';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface PhotoDocument {
  id: string;
  imageUrl: string;
  location: LocationData;
  uploadedAt: any; // FirebaseFirestore.Timestamp
  fileName: string;
}

type MapScreenProps = {
  navigation: NativeStackNavigationProp<RootStackNavigation, 'Map'>
}

const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<PhotoDocument[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const mapRef = useRef<MapView | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState('');

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  useEffect(() => {
    requestLocationPermission();
    fetchPhotosFromFirestore();
  }, []);

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
        //console.log('Photo document:', doc.id, data);

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
      //console.error('Error fetching photos:', error);
      Alert.alert('Error', 'Failed to load photos from database');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      let permission;

      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      } else {
        permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      }

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to show your position on the map.');
          setLoading(false);
        }
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Location permission is blocked. Please enable it in device settings.',
          [
            { text: 'OK', onPress: () => setLoading(false) }
          ]
        );
      } else {
        Alert.alert('Permission Error', 'Unable to check location permission.');
        setLoading(false);
      }
    } catch (error) {
      //console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request location permission.');
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(position.coords);
          setLoading(false);

          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }, 1000);
          }
        },
        (error) => {
          //console.error('Location error:', error);
          Alert.alert('Error', `Location error: ${error.message}`);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      )
    } catch (error: any) {
      //console.error('Location error:', error);
      Alert.alert('Error', `Location error: ${error.message}`);
      setLoading(false);
    }
  };

  const retryLocation = () => {
    setLoading(true);
    getCurrentLocation();
  };

  const handleMarkerPress = (photo: PhotoDocument) => {
    //console.log('Marker pressed:', photo);
    setImage(photo.imageUrl);
    toggleModal();
  };


  return (
    <Box flex={1}>
    <MapView
      provider={PROVIDER_GOOGLE}
      ref={mapRef}
      zoomControlEnabled
      zoomEnabled
      zoomTapEnabled
      style={{ flex: 1, width: '100%', height: '100%' }}
      initialRegion={{
        latitude: location?.latitude || 37.78825,
        longitude: location?.longitude || -122.4324,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {photos.map((photo) => (
        <Marker
          key={photo.id}
          coordinate={{
            latitude: photo.location.latitude,
            longitude: photo.location.longitude,
          }}
          tracksViewChanges={false}
        >
          <Callout onPress={() => handleMarkerPress(photo)}>
            <Text fontWeight="bold" fontSize="$md">
              📸 Click here to Photo
            </Text>
          </Callout>
        </Marker>
      ))}
    </MapView>

    {/* Location Loading Overlay */}
    {loading && (
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform={[{ translateX: -100 }, { translateY: -20 }]}
        bg="$backgroundDark950"
        px="$4"
        py="$3"
        borderRadius="$md"
        zIndex={10}
      >
        <Text color="$white">Getting your location...</Text>
      </Box>
    )}

    {/* Photos Loading Overlay */}
    {loadingPhotos && (
      <Box
        position="absolute"
        bottom="$12"
        left="50%"
        transform={[{ translateX: -100 }]}
        bg="$backgroundDark950"
        px="$4"
        py="$3"
        borderRadius="$md"
        zIndex={10}
      >
        <Text color="$white">Loading photos...</Text>
      </Box>
    )}

    {/* Error Message */}
    {!loading && !location && (
      <Box
        position="absolute"
        bottom="$20"
        left="50%"
        transform={[{ translateX: -140 }]}
        bg="$backgroundDark950"
        px="$4"
        py="$3"
        borderRadius="$md"
        zIndex={10}
      >
        <Text color="$red500" mb="$2">Unable to get your location</Text>
        <Pressable
          onPress={retryLocation}
          bg="$amber600"
          px="$4"
          py="$2"
          borderRadius="$sm"
          alignItems="center"
        >
          <Text color="$white">Retry</Text>
        </Pressable>
      </Box>
    )}

    {/* Image Modal Viewer */}
    <ImageModalViewer
      isVisible={isModalVisible}
      imageUri={image}
      onClose={toggleModal}
    />
  </Box>
  )
}

export default MapScreen;
