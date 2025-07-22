import React, { useEffect, useRef, useState } from 'react';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { PERMISSIONS, RESULTS, openSettings, requestMultiple } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import MapView from 'react-native-maps';
import { RootStackNavigation } from '../../navigation/RootNavigation';
import { SafeAreaView, StatusBar, Alert } from 'react-native';
import {
  Box,
  Text,
  Image,
  Spinner,
  Pressable,
} from '@gluestack-ui/themed';
import { Platform } from 'react-native';

type CameraScreenProps = NativeStackScreenProps<RootStackNavigation, 'Camera'>
const IoniconComponent = Ionicons as unknown as React.ComponentType<any>;

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface PhotoDocument {
  imageUrl: string;
  location: LocationData;
  uploadedAt: any;
  fileName: string;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestAllPermissions();
  }, []);

  const requestAllPermissions = async () => {
    const permissions = Platform.select({
      android: [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION],
      ios: [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.LOCATION_WHEN_IN_USE],
    });

    if (!permissions) return;

    const statuses = await requestMultiple(permissions);

    const cameraStatus = statuses[PERMISSIONS.ANDROID.CAMERA] || statuses[PERMISSIONS.IOS.CAMERA];
    const locationStatus =
      statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] || statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE];

    // Camera
    if (cameraStatus !== RESULTS.GRANTED) {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to take pictures.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { openSettings(); } },
        ]
      );
    }

    // Location
    if (locationStatus === RESULTS.GRANTED) {
      getCurrentLocation();
    } else if (locationStatus === RESULTS.BLOCKED) {
      Alert.alert(
        'Location Permission',
        'Please enable location access in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { openSettings(); } },
        ]
      );
    } else {
      Alert.alert('Location Permission Denied', 'Cannot get location without permission.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          setLoading(false);
          console.log('Location obtained:', position.coords);
        },
        (error) => {
          // console.error('Location error:', error);
          setError(`Location error: ${error.message}`);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    } catch (error: any) {
      // console.error('Location error:', error);
      Alert.alert('Error', `Location error: ${error.message}`);
      setLoading(false);
    }
  };

  const handleLaunchCamera = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      saveToPhotos: true,
      cameraType: 'back',
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        //console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Camera error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets.length > 0) {
        //console.log('Image captured:', response.assets[0]);
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setCapturedUri(imageUri);
        }
      }
    });
  };

  const retakePhoto = () => {
    setCapturedUri(null);
  };

  const uploadToFirebaseAndFirestore = async () => {
    if (!capturedUri) {
      Alert.alert('Error', 'No image to upload');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available. Please ensure location services are enabled.');
      return;
    }

    setUploading(true);

    try {
      // Upload image to Firebase Storage
      const filename = `photo_${Date.now()}_${capturedUri.substring(capturedUri.lastIndexOf('/') + 1)}`;
      const reference = storage().ref(`images/${filename}`);

      console.log('Starting upload to Firebase Storage...');
      const task = reference.putFile(capturedUri);

      // Monitor upload progress
      task.on('state_changed', taskSnapshot => {
        const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        //console.log(`Upload progress: ${progress.toFixed(2)}%`);
      });

      // Wait for upload to complete
      await task;
      const downloadUrl = await reference.getDownloadURL();
      //console.log('Image uploaded successfully. Download URL:', downloadUrl);

      // Prepare location data
      const locationData: LocationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        timestamp: Date.now(),
      };

      // Prepare document data for Firestore
      const photoDocument: PhotoDocument = {
        imageUrl: downloadUrl,
        location: locationData,
        uploadedAt: firestore.Timestamp.now(),
        fileName: filename,
      };

      // Save to Firestore
      //console.log('Saving to Firestore...');
      const docRef = await firestore()
        .collection('photos')
        .add(photoDocument);

      //console.log('Document saved with ID:', docRef.id);

      Alert.alert(
        'Upload Complete!',
        `Image and location saved successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCapturedUri(null); // Clear the captured image
            }
          }
        ]
      );

    } catch (error: any) {
      //console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        `Error: ${error.message || 'Unknown error occurred'}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      {capturedUri ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          {/* {uploading ? (
          <Spinner size="large" color="$white" />
        ) : ( */}
          {uploading && <Spinner size="large" color="$white" />}
          <Image source={{ uri: capturedUri }} alt="Preview" h="80%" w="100%" resizeMode="contain" />
          {/* )} */}

          {/* Location Overlay */}
          {location && (
            <Box
              position="absolute"
              top="$4"
              left="50%"
              transform={[{ translateX: -100 }]} // approx half width
              bg="$backgroundDark950"
              px="$4"
              py="$2"
              justifyContent="center"
              alignItems="center"
              borderRadius="$lg"
              zIndex={10}
            >
              <Text color="$white" size="sm" textAlign="center">
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </Box>
          )}
          {/* Action Buttons */}
          <Box flexDirection="row" mt="$4" justifyContent="space-around" width="100%" px="$4" zIndex={10}>
            <Pressable
              onPress={retakePhoto}
              bg="$red600"
              p="$3"
              borderRadius="$md"
              flexDirection="row"
              alignItems="center"
            >
              <IoniconComponent name="refresh" size={24} color="#fff" />
              <Text color="$white" ml="$2">Retake</Text>
            </Pressable>

            <Pressable
              onPress={uploadToFirebaseAndFirestore}
              bg={uploading ? "$coolGray600" : "$green600"}
              p="$3"
              borderRadius="$md"
              flexDirection="row"
              alignItems="center"
              disabled={uploading || !location}
              opacity={uploading || !location ? 0.6 : 1}
            >
              <IoniconComponent name={uploading ? "hourglass-outline" : "cloud-upload-outline"} size={24} color="#fff" />
              <Text color="$white" ml="$2">{uploading ? 'Uploading...' : 'Save Photo'}</Text>
            </Pressable>
          </Box>
        </Box>
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center" px="$4">
          {loading && (
            <Box mb="$4">
              <Text color="$white">Getting location...</Text>
            </Box>
          )}

          {error && (
            <Box alignItems="center" mb="$4">
              <Text color="$red500">{error}</Text>
              <Pressable onPress={getCurrentLocation} mt="$2" px="$4" py="$2" bg="$amber600" borderRadius="$md">
                <Text color="$white">Retry</Text>
              </Pressable>
            </Box>
          )}

          {location && (
            <Box mb="$8">
              <Text color="$white">
                Location Ready: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </Box>
          )}

          <Pressable onPress={handleLaunchCamera} bg="$blue600" px="$6" py="$3" borderRadius="$lg" mb="$8">
            <Text color="$white">Open Camera</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Map')} bg="$indigo700" px="$6" py="$3" borderRadius="$lg">
            <Text color="$white" textAlign="center">Move to Map</Text>
          </Pressable>
          <Pressable
            position="absolute"
            bottom="$6"
            right="$6"
            bg="$blue600"
            px="$4"
            py="$3"
            borderRadius="$full"
            elevation={5}
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.3}
            shadowRadius={4}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Text color="$white" fontWeight="bold" fontSize="$md">
              🖼️ Gallery
            </Text>
          </Pressable>
        </Box>
      )}
    </SafeAreaView>
  );
};

export default CameraScreen;

