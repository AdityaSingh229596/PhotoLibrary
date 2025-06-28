import { StyleSheet } from "react-native";

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

  export default styles;