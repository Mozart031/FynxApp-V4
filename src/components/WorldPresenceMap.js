/**
 * WorldPresenceMap — Mapa mundial real con puntos sobre países activos.
 * - Continentes dibujados como polígonos SVG reconocibles
 * - Punto pequeño sobre cada país activo
 * - Número encima si hay más de 1 usuario
 * - Al tocar muestra país + cantidad
 */
import React from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import Svg, { Polygon, Ellipse, G, Line } from "react-native-svg";

const LIME = "#00FF00";
const MONO = Platform.OS === "ios" ? "Courier" : "monospace";

// Coordenadas en canvas 320x170 (lon: -180→180, lat: 80→-60)
// x = (lon + 180) / 360 * 320,  y = (80 - lat) / 140 * 170
const COUNTRY_MAP = {
  DO: { x: 89,  y: 56,  name: "Rep. Dominicana", flag: "🇩🇴" },
  US: { x: 63,  y: 42,  name: "Estados Unidos",  flag: "🇺🇸" },
  CA: { x: 60,  y: 28,  name: "Canadá",          flag: "🇨🇦" },
  MX: { x: 54,  y: 55,  name: "México",          flag: "🇲🇽" },
  CO: { x: 80,  y: 65,  name: "Colombia",        flag: "🇨🇴" },
  VE: { x: 86,  y: 61,  name: "Venezuela",       flag: "🇻🇪" },
  PE: { x: 78,  y: 78,  name: "Perú",            flag: "🇵🇪" },
  AR: { x: 87,  y: 110, name: "Argentina",       flag: "🇦🇷" },
  CL: { x: 80,  y: 105, name: "Chile",           flag: "🇨🇱" },
  BR: { x: 99,  y: 82,  name: "Brasil",          flag: "🇧🇷" },
  ES: { x: 149, y: 41,  name: "España",          flag: "🇪🇸" },
  PT: { x: 145, y: 43,  name: "Portugal",        flag: "🇵🇹" },
  FR: { x: 155, y: 38,  name: "Francia",         flag: "🇫🇷" },
  GB: { x: 151, y: 34,  name: "Reino Unido",     flag: "🇬🇧" },
  DE: { x: 159, y: 35,  name: "Alemania",        flag: "🇩🇪" },
  IT: { x: 161, y: 40,  name: "Italia",          flag: "🇮🇹" },
  PR: { x: 87,  y: 54,  name: "Puerto Rico",     flag: "🇵🇷" },
  CU: { x: 78,  y: 52,  name: "Cuba",            flag: "🇨🇺" },
  GT: { x: 62,  y: 57,  name: "Guatemala",       flag: "🇬🇹" },
  PA: { x: 72,  y: 62,  name: "Panamá",          flag: "🇵🇦" },
  EC: { x: 75,  y: 71,  name: "Ecuador",         flag: "🇪🇨" },
  BO: { x: 87,  y: 89,  name: "Bolivia",         flag: "🇧🇴" },
  UY: { x: 97,  y: 108, name: "Uruguay",         flag: "🇺🇾" },
  IN: { x: 236, y: 58,  name: "India",           flag: "🇮🇳" },
  CN: { x: 265, y: 42,  name: "China",           flag: "🇨🇳" },
  JP: { x: 302, y: 40,  name: "Japón",           flag: "🇯🇵" },
  AU: { x: 286, y: 116, name: "Australia",       flag: "🇦🇺" },
  NG: { x: 162, y: 72,  name: "Nigeria",         flag: "🇳🇬" },
  ZA: { x: 170, y: 112, name: "Sudáfrica",       flag: "🇿🇦" },
  NL: { x: 157, y: 33,  name: "Países Bajos",   flag: "🇳🇱" },
};

const W = 320;
const H = 170;

export function WorldPresenceMap({ countries = {}, countryList = [] }) {
  const maxCount = Math.max(...Object.values(countries), 1);
  const totalCountries = Object.keys(countries).filter(c => COUNTRY_MAP[c]).length;

  const handleDotPress = (cc, count) => {
    const info = COUNTRY_MAP[cc];
    if (!info) return;
    Alert.alert(
      `${info.flag} ${info.name}`,
      count === 1
        ? "1 usuario activo"
        : `${count} usuarios activos`,
      [{ text: "OK" }]
    );
  };

  return (
    <View>
      <Text style={{ fontFamily: MONO, color: LIME, fontSize: 8, opacity: 0.5, letterSpacing: 1, marginBottom: 6 }}>
        {`[ GEOGRAPHIC_PRESENCE — ${totalCountries} NACION${totalCountries !== 1 ? "ES" : ""} ACTIVA${totalCountries !== 1 ? "S" : ""} ]`}
      </Text>

      {/* Mapa + dots en el mismo contenedor */}
      <View style={{ width: W, height: H, position: "relative", alignSelf: "center" }}>

        {/* SVG: continentes */}
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
          {/* Grid sutil */}
          {[0,1,2,3,4].map(i => (
            <Line key={`h${i}`} x1={0} y1={i*H/4} x2={W} y2={i*H/4} stroke={LIME} strokeWidth={0.3} opacity={0.1}/>
          ))}
          {[0,1,2,3,4,5,6].map(i => (
            <Line key={`v${i}`} x1={i*W/6} y1={0} x2={i*W/6} y2={H} stroke={LIME} strokeWidth={0.3} opacity={0.1}/>
          ))}

          {/* Norte América */}
          <Polygon
            points="10,24 40,5 72,5 112,20 112,40 95,52 90,68 82,80 75,80 70,75 60,72 55,58 48,44 28,32"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.35}
          />
          {/* Central América */}
          <Polygon
            points="75,80 82,80 90,68 90,78 84,86 76,84"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.5} strokeOpacity={0.3}
          />
          {/* Groenlandia */}
          <Ellipse cx={132} cy={10} rx={18} ry={10} fill={LIME} fillOpacity={0.06} stroke={LIME} strokeWidth={0.5} strokeOpacity={0.25}/>
          {/* Sur América */}
          <Polygon
            points="80,86 96,78 118,84 125,100 120,125 106,148 90,152 78,144 75,122 76,100"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.35}
          />
          {/* Europa */}
          <Polygon
            points="140,20 168,12 180,22 176,36 160,40 148,37 140,27"
            fill={LIME} fillOpacity={0.09} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.4}
          />
          {/* África */}
          <Polygon
            points="144,42 178,32 194,44 198,78 192,110 178,126 162,126 148,110 140,78 140,50"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.35}
          />
          {/* Oriente Medio */}
          <Polygon
            points="178,32 218,26 228,44 212,56 196,50 192,44"
            fill={LIME} fillOpacity={0.06} stroke={LIME} strokeWidth={0.5} strokeOpacity={0.28}
          />
          {/* Asia */}
          <Polygon
            points="178,22 218,10 272,5 318,14 318,46 305,70 285,82 258,82 236,70 218,56 228,44 218,26 180,32 178,22"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.35}
          />
          {/* Asia sur/SE */}
          <Polygon
            points="218,56 236,70 250,80 258,82 285,82 285,96 268,102 248,94 228,78 218,68"
            fill={LIME} fillOpacity={0.06} stroke={LIME} strokeWidth={0.5} strokeOpacity={0.28}
          />
          {/* Australia */}
          <Polygon
            points="262,110 294,102 314,112 316,132 295,142 268,136 255,122"
            fill={LIME} fillOpacity={0.07} stroke={LIME} strokeWidth={0.8} strokeOpacity={0.35}
          />
          {/* Japón */}
          <Ellipse cx={308} cy={44} rx={4} ry={9} fill={LIME} fillOpacity={0.08} stroke={LIME} strokeWidth={0.5} strokeOpacity={0.3}/>
        </Svg>

        {/* Dots sobre países — absolute positioned */}
        {Object.entries(countries).map(([cc, count]) => {
          const pos = COUNTRY_MAP[cc];
          if (!pos) return null;
          const dotSize = count > 1 ? 9 : 6;
          return (
            <TouchableOpacity
              key={cc}
              onPress={() => handleDotPress(cc, count)}
              style={{
                position: "absolute",
                left: pos.x - dotSize / 2,
                top: pos.y - dotSize / 2,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: LIME,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: LIME,
                shadowOpacity: 0.9,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              {count > 1 && (
                <Text style={{ fontSize: 5, color: "#000", fontWeight: "900", fontFamily: MONO }}>
                  {count > 9 ? "9+" : count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Leyenda inferior */}
      {countryList.length === 0 && (
        <Text style={{ fontFamily: MONO, color: LIME + "40", fontSize: 8, textAlign: "center", marginTop: 4 }}>
          [ SIN DATOS — los puntos aparecen al sincronizarse los usuarios ]
        </Text>
      )}
    </View>
  );
}
