# Miluna 🌙

**Mi luna, mi ciclo, mi universo.**

Miluna es un calendario menstrual **gratuito, privado y educativo** para Android
(y también iOS). Todo lo que registras vive SOLO en tu teléfono — sin cuentas,
sin servidores, sin sincronización.

## Filosofía

- **Cada cuerpo es distinto.** La app se adapta a la usuaria, no al revés.
- **Cero datos afuera.** Sin login, sin cloud, sin tracking.
- **Lenguaje honesto en español chileno neutro.** Nunca "esto es lo normal",
  siempre "esto es lo común, cada cuerpo tiene su ritmo".

## Stack

- React Native + Expo (managed workflow, SDK 51)
- SQLite local vía `expo-sqlite`
- Navegación: `@react-navigation/*` (stack + tabs)
- Notificaciones locales: `expo-notifications`
- SVG (órbita lunar, fondo estrellado): `react-native-svg`
- Fechas: `date-fns` en español

## Estructura

```
src/
  theme/            # colores, espaciados, tipografía
  db/               # SQLite: init + repositorios
  contexts/         # UserContext (etapa, edad, onboarding)
  services/         # notifications, adsPlaceholder
  utils/            # cyclePredictions, dateHelpers, stageContent
  components/       # StarryBackground, OrbitCycle, UI (Card/Chip/Buttons)
  navigation/       # RootNavigator (onboarding vs tabs)
  screens/
    onboarding/     # OnboardingScreen (edad + etapa)
    calendar/       # CalendarScreen (mes + órbita + marcar regla)
    daily/          # DailyScreen (¿cómo te sientes hoy?)
    learn/          # LearnScreen + LearnDetailScreen (7 secciones)
    universe/       # UniverseScreen (estadísticas personales)
    settings/       # SettingsScreen (etapa, recordatorios, export/borrar)
    HomeScreen.js   # Inicio con órbita y accesos rápidos
```

## Cómo lo pruebo en mi teléfono

1. Instala Node 18+ y `npm i -g expo-cli` (opcional, `npx` sirve).
2. Instala la app **Expo Go** en tu Android desde Google Play.
3. En este proyecto:
   ```bash
   npm install
   npx expo start
   ```
4. Escanea el QR desde Expo Go. La app carga sobre Expo Go — cero build.

> Los recordatorios (notificaciones) requieren un build real (Expo Go
> tiene limitaciones). Para probarlos usa un **development build** con EAS.

## Build para Play Store (cuando esté listo)

```bash
npm i -g eas-cli
eas login
eas build:configure         # rellenar projectId en app.json → extra.eas.projectId
eas build --platform android --profile preview      # APK de prueba
eas build --platform android --profile production   # AAB para Play Store
```

## Publicidad (futuro)

La app **no muestra publicidad**. La estructura para AdMob está preparada en
`src/services/adsPlaceholder.js`. Para activarla:

1. `npx expo install react-native-google-mobile-ads`
2. Añadir plugin config con los App IDs en `app.json`.
3. Cambiar `app.json → extra.adMobEnabled` a `true`.
4. Reemplazar el contenido del placeholder con los componentes reales.

## Privacidad

Miluna no recolecta datos personales. No usa cuentas, contraseñas ni email.
Todo lo que anotas se guarda en la base SQLite local del teléfono, cifrada
por el sistema operativo. Nada se envía a ningún servidor. La app puede
exportar tus datos a JSON (compartir por tu app favorita) y borrarlos por
completo desde Ajustes.
