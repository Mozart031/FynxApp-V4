import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTask } from './widget-task';
import App from "./App";

registerWidgetTaskHandler(widgetTask);
registerRootComponent(App);
