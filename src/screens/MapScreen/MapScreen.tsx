import { Alert, Button, StyleSheet, Text, useWindowDimensions, View, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackNavigation } from '../../../App';
import { check, RESULTS, request, PERMISSIONS } from 'react-native-permissions';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import getStyle from './MapscreenStyle';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';

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
  const [photos, setPhotos] = useState<PhotoDocument[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const mapRef = useRef<MapView | null>(null);

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
        console.log('Photo document:', doc.id, data);

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
      console.error('Error fetching photos:', error);
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
      console.error('Permission error:', error);
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
          console.error('Location error:', error);
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
      console.error('Location error:', error);
      Alert.alert('Error', `Location error: ${error.message}`);
      setLoading(false);
    }
  };

  const retryLocation = () => {
    setLoading(true);
    getCurrentLocation();
  };

  const refreshPhotos = () => {
    fetchPhotosFromFirestore();
  };

  const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'Unknown date';
  };

  // Custom marker component for photos
  const PhotoMarker = ({ photo }: { photo: PhotoDocument }) => {
    console.log('Rendering photo marker:1111111', photo.id, photo.imageUrl);
    return (
      <View style={markerStyles.container}>
        <Image
          source={{ uri: 'https://picsum.photos/200/300' }}
          style={[markerStyles.image, { backgroundColor: '#ccc' }]}
          onError={(e) => console.warn('❌ Image failed:', photo.imageUrl, e.nativeEvent.error)}
          onLoad={() => console.log('✅ Image loaded:', photo.imageUrl)}
        />
        <View style={markerStyles.pointer} />
      </View>
    );
  }

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
        {/* Current location marker */}
        {/* {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          />
        )} */}

        {/* Photo markers */}
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.location.latitude,
              longitude: photo.location.longitude,
            }}
            tracksViewChanges={false} // Improve performance
            image={{ uri: 'https://firebasestorage.googleapis.com/v0/b/photolibrary-cdbe6.firebasestorage.app/o/images%2Fphoto_1751076336832_rn_image_picker_lib_temp_576f4a72-2abd-4cca-a4f2-6d996adf6da7.jpg?alt=media&token=3e5c5364-c8a3-413a-9bd4-7f37ed1814cd' }} 

          >
          
            {/* <PhotoMarker photo={photo} />
            <Callout style={calloutStyles.container}>
              <View style={calloutStyles.content}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={calloutStyles.image}
                  resizeMode="cover"
                />
                <View style={calloutStyles.textContainer}>
                  <Text style={calloutStyles.title}>📸 Photo</Text>
                  <Text style={calloutStyles.date}>
                    {formatDate(photo.uploadedAt)}
                  </Text>
                  <Text style={calloutStyles.coordinates}>
                    📍 {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
                  </Text>
                  <Text style={calloutStyles.fileName}>
                    {photo.fileName}
                  </Text>
                </View>
              </View>
            </Callout> */}
          </Marker>
        ))}
      </MapView>

      {/* Loading overlay for location */}
      {loading && (
        <View style={overlayStyles.loadingContainer}>
          <Text style={overlayStyles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Loading overlay for photos */}
      {loadingPhotos && (
        <View style={overlayStyles.photosLoadingContainer}>
          <Text style={overlayStyles.loadingText}>Loading photos...</Text>
        </View>
      )}

      {/* Error container for location */}
      {!loading && !location && (
        <View style={overlayStyles.errorContainer}>
          <Text style={overlayStyles.errorText}>Unable to get your location</Text>
          <Button title="Retry" onPress={retryLocation} />
        </View>
      )}

      {/* Photos info and refresh button */}
      {/* <View style={overlayStyles.infoContainer}>
        <Text style={overlayStyles.infoText}>
          📸 {photos.length} photos on map
        </Text>
        <TouchableOpacity onPress={refreshPhotos} style={overlayStyles.refreshButton}>
          <Text style={overlayStyles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View> */}

      {/* Show all photos button */}
      {photos.length > 0 && (
        <TouchableOpacity
          style={overlayStyles.showAllButton}
          onPress={() => {
            if (mapRef.current && photos.length > 0) {
              // Calculate bounds to show all photos
              const coordinates = photos.map(photo => ({
                latitude: photo.location.latitude,
                longitude: photo.location.longitude,
              }));

              // Add current location if available
              if (location) {
                coordinates.push({
                  latitude: location.latitude,
                  longitude: location.longitude,
                });
              }

              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
        >

          <Text style={overlayStyles.showAllText}>Show All Photos</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default MapScreen;

// Styles for custom markers
const markerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    //backgroundColor:"red"
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    //backgroundColor:"green"
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
  },
});

// Styles for callouts
const calloutStyles = StyleSheet.create({
  container: {
    width: 250,
    minHeight: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  coordinates: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  fileName: {
    fontSize: 10,
    color: '#aaa',
    fontStyle: 'italic',
  },
});

// Styles for overlays
const overlayStyles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  photosLoadingContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 150, 255, 0.9)',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: 'red',
  },
  infoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
  showAllButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  showAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});