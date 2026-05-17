import Constants from "expo-constants";

const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function queryGemini(prompt, base64Data = null, systemInstruction = "", mimeType = "image/jpeg") {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const contents = [{
    parts: [
      { text: prompt }
    ]
  }];

  if (base64Data) {
    contents[0].parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  const body = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
