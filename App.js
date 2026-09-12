import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./screens/HomeScreen";
import ScanScreen from "./screens/ScanScreen";
import PatientListScreen from "./screens/PatientListScreen";
import ReviewEditScreen from "./screens/ReviewEditScreen";
import PatientDetailScreen from "./screens/PatientDetailScreen";

const Stack = createStackNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0B0F1A",
    card: "#0B0F1A",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#0B0F1A" },
            ...TransitionPresets.SlideFromRightIOS,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="PatientList" component={PatientListScreen} />
          <Stack.Screen name="ReviewEdit" component={ReviewEditScreen} />
          <Stack.Screen
            name="PatientDetail"
            component={PatientDetailScreen}
          />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider >
  );
}