// Inspirational phrases shown at every app open.
// Tone: cercano, honesto, valida sin juzgar, "cada cuerpo tiene su ritmo".

const BASE = [
  'Conocer tu cuerpo es tu superpoder.',
  'Cada cuerpo tiene su ritmo — el tuyo también.',
  'Tu ciclo no es un problema a resolver, es información sobre ti.',
  'Escucharte hoy es cuidarte mañana.',
  'No hay ciclo perfecto. Hay ciclos reales.',
  'Tu universo cambia mes a mes, y eso es hermoso.',
  'Registrar cómo te sientes ya es un acto de amor propio.',
  'Tu cuerpo lleva ritmo desde antes que aprendieras a contar.',
  'Los días bajos también cuentan. Están bien.',
  'Ningún cuerpo se parece a otro — el tuyo tiene el suyo.',
  'La información sobre ti misma no se le regala a nadie.',
  'Escucharte con cariño también es autocuidado.',
  'Descansar cuando el cuerpo pide, es sabiduría.',
  'Tu ritmo no compite con el de nadie.',
  'Hoy es un buen día para mirarte con ternura.',
  'Tu ciclo es una brújula, no un calendario perfecto.',
  'Aprender de ti es un viaje sin apuros.',
];

const BY_STAGE = {
  adolescente: [
    'Al principio todo es aprender. No tienes apuro.',
    'Tu ciclo se está armando. Cada cuerpo se toma su tiempo.',
    'Escucharte hoy te va a servir toda la vida.',
  ],
  buscando: [
    'Buscar también es cuidar. Vas a tu ritmo.',
    'Un mes no define nada. Sigue escuchándote.',
    'Tu paciencia es parte del proceso.',
  ],
  embarazo: [
    'Tu cuerpo está haciendo algo enorme, un día a la vez.',
    'Descansar es trabajo, ahora también.',
    'Cada semana trae algo nuevo — y algo tuyo.',
  ],
  menopausia: [
    'Nuevas etapas también son universos que descubrir.',
    'Los cambios de esta etapa son parte del camino.',
    'Tu experiencia es una brújula que otras aún no tienen.',
  ],
};

export function pickPhrase(stageId) {
  const pool = [...BASE, ...(BY_STAGE[stageId] || [])];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function phraseCount(stageId) {
  return BASE.length + (BY_STAGE[stageId]?.length || 0);
}
