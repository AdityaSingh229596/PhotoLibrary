import { StyleSheet, Text, Touchable, View,TouchableOpacity } from 'react-native'
import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackNavigation } from '../../../App'
// import { RouteProp } from '@react-navigation/native';

type CameraScreenProps = {
  navigation: NativeStackNavigationProp<RootStackNavigation, 'Camera'>;
//   route: RouteProp<RootStackNavigation, 'Camera'>;
};

const CameraScreen:React.FC<CameraScreenProps> = ({ navigation }) => {
  return (
    <View>
      <Text>CameraScreen</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('Map');
        }}
        style={{
          backgroundColor: 'blue',
          padding: 10,
          marginTop: 20,
        }}
        >
        <Text style={{ color: 'white' }}>Go to Map</Text>
        </TouchableOpacity>
    </View>
  )
}

export default CameraScreen

const styles = StyleSheet.create({})