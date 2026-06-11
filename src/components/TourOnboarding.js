import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { C, F } from '../constants/themes';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const TOUR_STEPS = [
  {
    id: 'tars_intro',
    title: { es: 'SISTEMA INICIADO', en: 'SYSTEM INITIATED' },
    desc: {
      es: 'Saludos. Soy TARS, tu Inteligencia Artificial Financiera.\n\nFynx no es solo una hoja de cálculo, es un sistema de supervivencia. Mi objetivo es guiarte desde cero hacia la libertad financiera absoluta.',
      en: 'Greetings. I am TARS, your Financial Artificial Intelligence.\n\nFynx is not just a spreadsheet, it is a survival system. My goal is to guide you from zero to absolute financial freedom.'
    },
    align: 'center'
  },
  {
    id: 'score',
    title: { es: 'BARRA DE VIDA: SCORE', en: 'LIFE BAR: SCORE' },
    desc: {
      es: 'Mira hacia arriba. Ese es tu Score de Salud Financiera.\n\nFunciona como la "barra de vida" en un videojuego. Sube si ahorras y gastas menos de lo que ganas. Baja peligrosamente si te excedes. ¡Mantenlo siempre en zona Dorada!',
      en: 'Look up. That is your Financial Health Score.\n\nIt works like a "health bar" in a video game. It goes up if you save and spend less than you earn. It drops dangerously if you overspend. Always keep it in the Gold zone!'
    },
    top: 130,
    arrow: 'up',
    align: 'center',
    arrowOffset: 0
  },
  {
    id: 'add',
    title: { es: 'TU ARMA PRINCIPAL', en: 'YOUR MAIN WEAPON' },
    desc: {
      es: 'El botón (+). Úsalo todos los días.\n\nLa regla de oro: Registra CADA centavo que gastes o ganes en el momento en que ocurre. No confíes en tu memoria. Si controlas el flujo, controlas tu vida.',
      en: 'The (+) button. Use it every day.\n\nThe golden rule: Log EVERY penny you spend or earn the moment it happens. Do not trust your memory. If you control the flow, you control your life.'
    },
    bottom: Platform.OS === 'ios' ? 150 : 135,
    align: 'center',
    arrow: 'down',
    arrowOffset: 0
  },
  {
    id: 'estrategia',
    title: { es: 'PLANIFICACIÓN TÁCTICA', en: 'TACTICAL PLANNING' },
    desc: {
      es: 'Aquí construimos el futuro.\n\nEn esta pestaña podrás crear Metas de Ahorro (como un fondo de emergencia o un auto) y añadir tus Deudas para que yo pueda calcular un plan matemático para destruirlas.',
      en: 'Here we build the future.\n\nIn this tab you can create Savings Goals (like an emergency fund or a car) and add your Debts so I can calculate a mathematical plan to destroy them.'
    },
    bottom: Platform.OS === 'ios' ? 150 : 135,
    align: 'center',
    arrow: 'down',
    arrowOffset: -(width * 0.25)
  },
  {
    id: 'chat',
    title: { es: 'MI NÚCLEO DE IA', en: 'MY AI CORE' },
    desc: {
      es: 'En el botón central del chat podrás hablar conmigo 24/7.\n\nPregúntame cosas como: "¿Puedo permitirme comprar una pizza hoy?" o "Ayúdame a reducir mis gastos". Analizaré tus números y te daré la respuesta brutalmente honesta.',
      en: 'In the center chat button you can talk to me 24/7.\n\nAsk me things like: "Can I afford a pizza today?" or "Help me reduce my expenses". I will analyze your numbers and give you the brutally honest answer.'
    },
    bottom: Platform.OS === 'ios' ? 150 : 135,
    align: 'center',
    arrow: 'down',
    arrowOffset: (width * 0.15)
  },
  {
    id: 'perfil',
    title: { es: 'ESTATUS Y CONTROL', en: 'STATUS & CONTROL' },
    desc: {
      es: 'Finalmente, tu perfil.\n\nAquí ganarás medallas por tus logros financieros, podrás ver reportes semanales profundos, y personalizar el Widget de la pantalla de inicio de tu teléfono.',
      en: 'Finally, your profile.\n\nHere you will earn badges for your financial achievements, view deep weekly reports, and customize your phone\'s Home Screen Widget.'
    },
    bottom: Platform.OS === 'ios' ? 150 : 135,
    align: 'center',
    arrow: 'down',
    arrowOffset: (width * 0.35)
  },
  {
    id: 'end',
    title: { es: 'MISIÓN INICIADA', en: 'MISSION STARTED' },
    desc: {
      es: 'Tu supervivencia financiera depende de la disciplina.\n\nEmpieza ahora mismo registrando tu primer gasto o ingreso con el botón (+). Estaré vigilando tus números. Fin de la transmisión.',
      en: 'Your financial survival depends on discipline.\n\nStart right now by logging your first expense or income with the (+) button. I will be watching your numbers. End of transmission.'
    },
    align: 'center'
  }
];

export function TourOnboarding({ visible, onComplete, targets = {}, setTab }) {
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

      // Change tab based on the current step
      if (setTab) {
        const currentStepId = TOUR_STEPS[step]?.id;
        if (currentStepId === 'tars_intro' || currentStepId === 'score' || currentStepId === 'add' || currentStepId === 'end') {
          setTab('home');
        } else if (currentStepId === 'estrategia') {
          setTab('estrategia');
        } else if (currentStepId === 'perfil') {
          setTab('perfil');
        } else if (currentStepId === 'chat') {
          setTab('chat');
        }
      }
    } else {
      setStep(0); // reset when closed
    }
  }, [step, visible, setTab]);

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
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

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
            <Ionicons name="caret-up" size={40} color={C.mint} style={{ marginBottom: -15, marginLeft: currentStep.arrowOffset || 0, zIndex: 10 }} />
          )}

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={styles.iconContainer}>
                <Ionicons name="hardware-chip-outline" size={24} color={C.mint} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.tarsPrefix}>TARS {'>'} SYS</Text>
                <Text style={styles.title}>{currentStep.title[lang]}</Text>
              </View>
              <Text style={styles.stepCounter}>{step + 1}/{TOUR_STEPS.length}</Text>
            </View>
            
            <Text style={styles.desc}>{currentStep.desc[lang]}</Text>
            
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipBtn}>{lang === 'en' ? 'ABORT' : 'ABORTAR'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>{isLast ? (lang === 'en' ? 'INITIATE' : 'INICIAR') : (lang === 'en' ? 'NEXT' : 'SIGUIENTE')} {'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {currentStep.arrow === 'down' && (
            <Ionicons name="caret-down" size={40} color={C.mint} style={{ marginTop: -15, marginLeft: currentStep.arrowOffset || 0, zIndex: 10 }} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardWrapper: {
    position: 'absolute',
    width: 280,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border2,
    width: '100%',
    shadowColor: C.mint,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.mint + "15",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.mint + "40",
  },
  tarsPrefix: {
    fontFamily: F.monoB,
    fontSize: 10,
    color: C.mint,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: F.monoB,
    color: C.t1,
    letterSpacing: 1,
  },
  stepCounter: {
    fontSize: 12,
    color: C.mint,
    fontFamily: F.monoB,
  },
  desc: {
    fontSize: 14,
    color: C.t2,
    lineHeight: 22,
    fontFamily: F.sans,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    fontSize: 12,
    color: C.t4,
    fontFamily: F.monoB,
    letterSpacing: 1,
  },
  nextBtn: {
    backgroundColor: C.mint + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.mint,
  },
  nextText: {
    fontSize: 12,
    fontFamily: F.monoB,
    color: C.mint,
    letterSpacing: 1,
  }
});
