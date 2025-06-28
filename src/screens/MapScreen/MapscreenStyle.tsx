import { StyleSheet } from "react-native";

const getStyle = ({ width,height }: { width: number; height: number }) => StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        height: height,
        width: width,
    },
    map: {
        height: height-80,
        width: width,
    },
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
      loadingText: {
        fontSize: 16,
        fontWeight: '500',
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
})

export default getStyle;