import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, Alert } from 'react-native';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigation } from '../../../App';
import Geolocation, { GeoCoordinates } from 'react-native-geolocation-service';
import MapView from 'react-native-maps'; 

type CameraScreenProps = NativeStackScreenProps<RootStackNavigation, 'Camera'>

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
    requestLocationPermission()
  }, [])
  
  useEffect(()=>{
    getCurrentLocation();
  },[])

  const requestLocationPermission = async () => {
    let permission;
    if (Platform.OS === 'android') {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    } else if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    }

    if (!permission) {
      console.error('Permission type is undefined');
      return false;
    }
    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Permission Required',
        'Please enable location permission in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ]
      );
      return false;
    }

    return false;
  };

  useEffect(() => { requestCameraPermission() }, [])

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

    const status = await check(permission);

    if (status === RESULTS.GRANTED) {
      console.log('Camera permission already granted');
    } else {
      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        console.log('Camera permission granted');
      } else {
        Alert.alert('Permission Denied', 'Camera access is required to take pictures.');
      }
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
          console.error('Location error:', error);
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
      console.error('Location error:', error);
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
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Camera error', response.errorMessage || 'Unknown error');
      } else if (response.assets && response.assets.length > 0){
        console.log('Image captured:', response.assets[0]);
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
        console.log(`Upload progress: ${progress.toFixed(2)}%`);
      });

      // Wait for upload to complete
      await task;
      const downloadUrl = await reference.getDownloadURL();
      console.log('Image uploaded successfully. Download URL:', downloadUrl);

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
      console.log('Saving to Firestore...');
      const docRef = await firestore()
        .collection('photos')
        .add(photoDocument);

      console.log('Document saved with ID:', docRef.id);

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
      console.error('Upload error:', error);
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
          <Image source={{ uri: capturedUri }} style={styles.preview} />
          
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
              <Ionicons name="refresh" size={28} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, paddingLeft: 8 }}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={uploadToFirebaseAndFirestore} 
              style={[styles.uploadButton, uploading && styles.uploadingButton]}
              disabled={uploading || !location}
            >
              <Ionicons 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  locationOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  controlContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#000',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  retryText: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: 'rgba(0, 255, 0, 0.9)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  move: {
    backgroundColor: '#1e90ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    position: 'absolute',
    bottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  retakeButton: {
    backgroundColor: '#ff4757',
    padding: 12,
    borderRadius: 30,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 30,
    // left: 30,
    // right: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    //backgroundColor:"red",
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#2ed573',
    padding: 12,
    borderRadius: 30,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  uploadingButton: {
    backgroundColor: '#95a5a6',
  },
});