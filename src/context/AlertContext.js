import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Easing, Modal } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../constants/themes";
import { useLanguage } from "./LanguageContext";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const { t } = useLanguage();
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    type: "info" // info, warning, error, success
  });
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (title, message, buttons = [], type = "info") => {
    // If no buttons, add a default OK button
    if (buttons.length === 0) {
      buttons = [{ text: t?.aceptar || "Aceptar", onPress: hideAlert }];
    } else {
      // Map onPress to automatically hide the alert if not handled
      buttons = buttons.map(b => ({
        ...b,
        onPress: () => {
          if (b.onPress) b.onPress();
          hideAlert();
        }
      }));
    }

    setAlertConfig({ visible: true, title, message, buttons, type });
    
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true })
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
    });
  };

  const renderIcon = () => {
    switch (alertConfig.type) {
      case "warning": return <Ionicons name="warning" size={32} color={GOLD} />;
      case "error": return <Ionicons name="close-circle" size={32} color="#FF4A4A" />;
      case "success": return <Ionicons name="checkmark-circle" size={32} color="#00FF9D" />;
      default: return <Ionicons name="information-circle" size={32} color={GOLD} />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      
      <Modal transparent visible={alertConfig.visible} animationType="none">
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconContainer}>{renderIcon()}</View>
            <Text style={styles.title}>{alertConfig.title}</Text>
            <Text style={styles.message}>{alertConfig.message}</Text>
            
            <View style={styles.buttonContainer}>
              {alertConfig.buttons.map((btn, index) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.button, 
                      isDestructive ? styles.btnDestructive : (isCancel ? styles.btnCancel : styles.btnPrimary),
                      alertConfig.buttons.length > 2 ? { width: "100%", marginBottom: 8 } : { flex: 1, marginHorizontal: 4 }
                    ]}
                    onPress={btn.onPress}
                  >
                    <Text style={[
                      styles.btnText,
                      isDestructive ? { color: "#FFFFFF" } : (isCancel ? { color: "#A0A0A0" } : { color: "#000000" })
                    ]}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useEliteAlert() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  alertBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "rgba(15,15,15,0.9)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(212,175,55,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: F.sansM,
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontFamily: F.sans,
    fontSize: 15,
    color: "#A0A0A0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: GOLD,
  },
  btnCancel: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btnDestructive: {
    backgroundColor: "#FF4A4A",
  },
  btnText: {
    fontFamily: F.sansM,
    fontSize: 15,
    fontWeight: "600",
  }
});
