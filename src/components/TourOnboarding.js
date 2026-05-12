import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F } from '../constants/themes';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const TOUR_STEPS = [
  {
    id: 'score',
    title: { es: 'Fynx Score', en: 'Fynx Score' },
    desc: {
      es: 'Este es tu resumen vital. Mantén tu Score por encima de 80 para una salud financiera óptima.',
      en: 'This is your vital summary. Keep your Score above 80 for optimal financial health.'
    },
    top: 140, // Aprox position for HeroBalance
    left: 20,
    arrow: 'up',
    align: 'flex-start'
  },
  {
    id: 'tars',
    title: { es: 'TARS IA', en: 'TARS AI' },
    desc: {
      es: 'Tu asesor personal de inteligencia artificial. Pregúntale cualquier cosa o pídele que analice tus gastos.',
      en: 'Your personal AI advisor. Ask anything or have it analyze your expenses.'
    },
    top: 60, // Aprox position for header TARS button
    right: 20,
    arrow: 'up',
    align: 'flex-end'
  },
  {
    id: 'add',
    title: { es: 'Registro Rápido', en: 'Quick Add' },
    desc: {
      es: 'Registra cada centavo aquí para no perder el control. Tu estrategia de Fynx Elite depende de tus datos.',
      en: 'Log every penny here to stay in control. Your Fynx Elite strategy depends on your data.'
    },
    bottom: Platform.OS === 'ios' ? 120 : 100, // Aprox position for bottom tab '+'
    align: 'center',
    arrow: 'down'
  }
];

export function TourOnboarding({ visible, onComplete, targets = {} }) {
  const [step, setStep] = useState(0);
  const { lang } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [step, visible]);

  if (!visible) return null;

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Pointer/Tooltip Card */}
        <Animated.View 
          style={[
            styles.cardWrapper,
            currentStep.id === 'score' && targets.score ? { top: targets.score.y + (targets.score.h / 2), left: 20 } :
            currentStep.id === 'tars' && targets.tars ? { top: targets.tars.y + targets.tars.h + 10, right: 20 } :
            {
              ...(currentStep.top !== undefined && !targets[currentStep.id] && { top: currentStep.top }),
              ...(currentStep.bottom !== undefined && !targets[currentStep.id] && { bottom: currentStep.bottom }),
              ...(currentStep.left !== undefined && !targets[currentStep.id] && { left: currentStep.left }),
              ...(currentStep.right !== undefined && !targets[currentStep.id] && { right: currentStep.right }),
            },
            { alignItems: currentStep.align, opacity: fadeAnim }
          ]}
        >
          {currentStep.arrow === 'up' && (
            <Ionicons name="caret-up" size={40} color={C.gold} style={{ marginBottom: -15, marginLeft: currentStep.align === 'flex-end' ? 160 : currentStep.align === 'flex-start' ? 20 : 0 }} />
          )}

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.title}>{currentStep.title[lang]}</Text>
              <Text style={styles.stepCounter}>{step + 1} / {TOUR_STEPS.length}</Text>
            </View>
            
            <Text style={styles.desc}>{currentStep.desc[lang]}</Text>
            
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipBtn}>{lang === 'en' ? 'Skip' : 'Saltar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>{isLast ? (lang === 'en' ? 'Finish' : 'Finalizar') : (lang === 'en' ? 'Next' : 'Siguiente')} →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {currentStep.arrow === 'down' && (
            <Ionicons name="caret-down" size={40} color={C.gold} style={{ marginTop: -15 }} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardWrapper: {
    position: 'absolute',
    width: width * 0.85,
  },
  card: {
    backgroundColor: C.card2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.gold + '50',
    width: '100%',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: C.gold,
  },
  stepCounter: {
    fontSize: 12,
    color: C.t3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700'
  },
  desc: {
    fontSize: 13,
    color: C.t2,
    lineHeight: 20,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    fontSize: 13,
    color: C.t3,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: C.gold + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gold,
  },
  nextText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.gold,
  }
});
