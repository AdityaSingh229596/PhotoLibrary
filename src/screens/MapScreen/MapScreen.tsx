import { Alert, Button, Text, useWindowDimensions, View, Image, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { check, RESULTS, request, PERMISSIONS } from 'react-native-permissions';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import getStyle from './MapscreenStyle';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import ImageModalViewer from '../../components/ImageModalViewer';
import { RootStackNavigation } from '../../navigation/RootNavigation';

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
  const { width, height } = useWindowDimensions()
  const styles = getStyle({ width, height });
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);

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
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        zoomControlEnabled={true}
        zoomEnabled={true}
        zoomTapEnabled={true}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Photo markers */}
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.location.latitude,
              longitude: photo.location.longitude,
            }}
            tracksViewChanges={false}
          >
            <Callout onPress={() => {
              handleMarkerPress(photo);
            }
            }>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                📸 Click here to Photo
              </Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay for location */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Loading overlay for photos */}
      {loadingPhotos && (
        <View style={styles.photosLoadingContainer}>
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      )}

      {/* Error container for location */}
      {!loading && !location && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to get your location</Text>
          <Button title="Retry" onPress={retryLocation} />
        </View>
      )}

      <ImageModalViewer
        isVisible={isModalVisible}
        imageUri={image}
        onClose={toggleModal}
      />

    </View>
  )
}

export default MapScreen;
