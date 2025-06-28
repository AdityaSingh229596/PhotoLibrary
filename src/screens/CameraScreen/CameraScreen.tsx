import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView, StatusBar, Image, Alert, ActivityIndicator } from 'react-native';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { PERMISSIONS, RESULTS, openSettings, requestMultiple } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import MapView from 'react-native-maps';
import styles from './CameraScreenStyle';
import { RootStackNavigation } from '../../navigation/RootNavigation';

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
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      {capturedUri ? (
        <View style={styles.previewContainer}>
          {uploading ? <ActivityIndicator size="large" color="white" style={{ flex: 1 }} /> :
            <Image source={{ uri: capturedUri }} style={styles.preview} />}
          {/* Location info overlay */}
          {location && (
            <View style={styles.locationOverlay}>
              <Text style={styles.locationText}>
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={retakePhoto} style={styles.retakeButton}>
              <IoniconComponent name="refresh" size={28} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, paddingLeft: 8 }}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={uploadToFirebaseAndFirestore}
              style={[styles.uploadButton, uploading && styles.uploadingButton]}
              disabled={uploading || !location}
            >
              <IoniconComponent
                name={uploading ? "hourglass-outline" : "cloud-upload-outline"}
                size={28}
                color="#fff"
              />
              <Text style={{ color: '#fff', fontSize: 16, paddingLeft: 8 }}>
                {uploading ? 'Uploading...' : 'Save Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.controlContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Getting location...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={getCurrentLocation} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                Location Ready: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleLaunchCamera} style={styles.captureButton}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Map")} style={styles.move}>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: "center" }}>Move to map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CameraScreen;

