
import React from 'react'
import RootNavigation from './src/navigation/RootNavigation';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

const App = () => {
  return (
    <GluestackUIProvider config={config}>
      <RootNavigation></RootNavigation>
    </GluestackUIProvider>
  );
}

export default App

