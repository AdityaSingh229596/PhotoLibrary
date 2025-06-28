import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageView: {
      height:300,
      width: 300,
      backgroundColor: 'white',
      borderRadius: 10,
      overflow: 'hidden',
    },
    image: {
      height: '100%',
      width: '100%',
    },
    loader: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      alignSelf: 'center',
    },
  });

export default styles;