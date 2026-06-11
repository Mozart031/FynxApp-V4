import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryGemini } from '../services/gemini';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';

const CACHE_KEY = '@fynx_ai_greeting_v1';

export function useAIGreetings() {
  const { appState, derived } = useFinance();
  const { lang } = useLanguage();
  
  const [greetings, setGreetings] = useState({
    homeGreeting: null,
    fabPrompt: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchOrGenerateGreetings() {
      if (!appState?.user?.name) {
        if (isMounted) setGreetings(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      
      try {
        const cachedDataStr = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedDataStr) {
          const cachedData = JSON.parse(cachedDataStr);
          if (cachedData.date === today && cachedData.lang === lang) {
            if (isMounted) {
              setGreetings({
                homeGreeting: cachedData.homeGreeting,
                fabPrompt: cachedData.fabPrompt,
                isLoading: false
              });
            }
            return;
          }
        }

        // If not cached or different day/lang, generate via Gemini
        const userName = appState.user.name || "Usuario";
        const streak = appState.streakDays?.length || 0;
        const score = derived?.sc || 0;
        
        const systemInstruction = `You are TARS, the elite financial AI assistant for the app Fynx Elite. 
You must speak in ${lang === 'en' ? 'English' : 'Spanish'}. 
Your tone should be highly analytical, direct, but encouraging and conversational. 
You are speaking to the user named "${userName}".`;

        const prompt = `Based on the user's current status:
- Financial Score: ${score}/100
- Consistency Streak: ${streak} days

Generate two short, conversational, and highly contextual strings:
1. "homeGreeting": A brief analytical greeting for the home screen. Max 2 sentences. Example: "¡Qué tal tu día, ${userName}! Tu ritmo de quema bajó, si sigues así lograrás tu meta."
2. "fabPrompt": A very short question/prompt for the transaction entry modal. Max 5-7 words. Example: "¿Qué ingresaremos esta vez?" or "¿Qué movimiento registramos hoy?"

Return EXACTLY a JSON object with these two keys, and no other text or markdown formatting.
{"homeGreeting": "...", "fabPrompt": "..."}`;

        const response = await queryGemini(prompt, null, systemInstruction);
        const match = response.match(/\{[\s\S]*\}/);
        
        if (match) {
          const data = JSON.parse(match[0]);
          if (data.homeGreeting && data.fabPrompt) {
            const newCache = {
              date: today,
              lang: lang,
              homeGreeting: data.homeGreeting,
              fabPrompt: data.fabPrompt
            };
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
            
            if (isMounted) {
              setGreetings({
                homeGreeting: data.homeGreeting,
                fabPrompt: data.fabPrompt,
                isLoading: false
              });
            }
            return;
          }
        }
        
        // Fallback if parsing failed
        throw new Error("Invalid Gemini response format for greetings");
        
      } catch (error) {
        console.warn("Error generating AI greetings:", error);
        if (isMounted) {
          setGreetings({
            homeGreeting: null, // We'll let UI components use their static fallbacks
            fabPrompt: null,
            isLoading: false
          });
        }
      }
    }

    fetchOrGenerateGreetings();

    return () => {
      isMounted = false;
    };
  }, [appState?.user?.name, derived?.sc, appState?.streakDays?.length, lang]);

  return greetings;
}
