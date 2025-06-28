
import { StyleSheet } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import CameraScreen from './src/screens/CameraScreen/CameraScreen'
import MapScreen from './src/screens/MapScreen/MapScreen'

export type RootStackNavigation = {
  Camera: undefined,
  Map: undefined,
}

const App = () => {

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App

