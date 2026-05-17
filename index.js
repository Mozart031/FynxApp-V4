import { registerRootComponent } from "expo";
import App from "./App";

let RNWidget = null;
try {
  RNWidget = require('react-native-android-widget');
} catch (e) {
  console.warn("[Fynx] react-native-android-widget missing in Expo Go");
}

if (RNWidget && RNWidget.registerWidgetTaskHandler) {
  const { widgetTask } = require('./widget-task');
  RNWidget.registerWidgetTaskHandler(widgetTask);
}

registerRootComponent(App);
