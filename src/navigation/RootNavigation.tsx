
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import CameraScreen from '../screens/CameraScreen/CameraScreen'
import MapScreen from '../screens/MapScreen/MapScreen'

export type RootStackNavigation = {
  Camera: undefined,
  Map: undefined,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigation

