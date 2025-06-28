
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import CameraScreen from '../screens/CameraScreen/CameraScreen'
import MapScreen from '../screens/MapScreen/MapScreen'
import PhotoGalleryScreen from '../screens/GallaryScreen/GalleryScreen'

export type RootStackNavigation = {
  Camera: undefined,
  Map: undefined,
  Gallery: undefined,
}

const RootNavigation = () => {

  const Stack = createNativeStackNavigator<RootStackNavigation>()

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Camera'
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name={'Camera'} component={CameraScreen} />
        <Stack.Screen name={'Map'} options={{
          headerShown: true,
          title: 'Map',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
          },
        }} component={MapScreen} />
        <Stack.Screen name={'Gallery'} options={{
          headerShown: true,
          title: 'Photo Gallery',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
          },
        }} component={PhotoGalleryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigation

