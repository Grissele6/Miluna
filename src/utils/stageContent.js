// Tone-adaptive strings by life stage.
// Chilean Spanish, close and honest. We never say "esto es lo normal";
// we say "esto es lo común, cada cuerpo tiene su ritmo".

export const STAGES = [
  { id: 'adolescente', label: 'Adolescente', hint: 'Recién partiendo o con reglas irregulares' },
  { id: 'adulta', label: 'Adulta', hint: 'Ciclos ya conocidos' },
  { id: 'buscando', label: 'Buscando embarazo', hint: 'Quieres quedar embarazada' },
  { id: 'embarazo', label: 'Embarazo', hint: 'Estás esperando' },
  { id: 'menopausia', label: 'Menopausia', hint: 'Ciclos que cambian o desaparecen' },
];

export const stageCopy = {
  adolescente: {
    welcome: 'Bienvenida a tu universo. Al principio los ciclos pueden ser irregulares — es súper común.',
    homeSubtitle: 'Estás aprendiendo a conocer tu cuerpo. Sin apuros.',
    predictionCaveat: 'Cuando recién comienzas, las predicciones son solo una guía. Tu cuerpo va encontrando su ritmo.',
    universeIntro: 'Estos son TUS datos. Cada cuerpo tiene su propio ritmo, y el tuyo se está descubriendo.',
    periodWord: 'regla',
  },
  adulta: {
    welcome: 'Bienvenida a tu universo. Aquí llevas tu ciclo a tu manera.',
    homeSubtitle: 'Tu ciclo, tus datos, tu cuerpo.',
    predictionCaveat: 'Las predicciones se basan en TUS datos. Ningún ciclo es idéntico al de otra persona.',
    universeIntro: 'Estos son TUS datos. Cada cuerpo tiene su propio ritmo, y el tuyo tiene el suyo.',
    periodWord: 'regla',
  },
  buscando: {
    welcome: 'Bienvenida. Vamos a mirar juntas tu ventana fértil.',
    homeSubtitle: 'Tu ciclo y tus días de mayor probabilidad, siempre estimados.',
    predictionCaveat: 'La ventana fértil es una estimación en base a TU ciclo. El embarazo depende de muchos factores — paciencia y cariño.',
    universeIntro: 'Estos son TUS datos. Buscar embarazo es un proceso; que sea con calma.',
    periodWord: 'regla',
  },
  embarazo: {
    welcome: 'Bienvenida. Durante el embarazo tu ciclo pausa — puedes seguir registrando cómo te sientes.',
    homeSubtitle: 'Un espacio para escuchar cómo te sientes cada día.',
    predictionCaveat: 'Durante el embarazo la predicción de regla no aplica. Registra síntomas y ánimo si te sirve.',
    universeIntro: 'Estos son TUS datos de este tiempo. Cada embarazo se siente distinto.',
    periodWord: 'sangrado',
  },
  menopausia: {
    welcome: 'Bienvenida. Los cambios del ciclo en esta etapa son parte del camino.',
    homeSubtitle: 'Tu ciclo puede cambiar mucho — anota lo que quieras recordar.',
    predictionCaveat: 'En perimenopausia y menopausia las predicciones pueden fallar bastante. Es lo común.',
    universeIntro: 'Estos son TUS datos. En esta etapa cada cuerpo cambia a su ritmo.',
    periodWord: 'sangrado',
  },
};

export function copyFor(stageId) {
  return stageCopy[stageId] || stageCopy.adulta;
}

export const CONTRACEPTIVE_DISCLAIMER =
  'Miluna es una guía informativa. No sirve como método anticonceptivo ni reemplaza atención médica.';

export const PROBABILITY_DISCLAIMER =
  'Probabilidad estimada. Ningún día del ciclo es 100% seguro — este cálculo no reemplaza métodos anticonceptivos.';

export const PREGNANCY_BLEEDING_MESSAGE =
  'Cualquier sangrado durante el embarazo merece mirarse con calma. Puede ser algo leve — pero conviene contárselo a tu matrona o médico. No estás sola.';

export const MOODS = [
  { id: 'feliz', label: 'Feliz', emoji: '🙂' },
  { id: 'tranquila', label: 'Tranquila', emoji: '😌' },
  { id: 'sensible', label: 'Sensible', emoji: '🥺' },
  { id: 'irritable', label: 'Irritable', emoji: '😤' },
  { id: 'triste', label: 'Triste', emoji: '😔' },
  { id: 'ansiosa', label: 'Ansiosa', emoji: '😰' },
  { id: 'energica', label: 'Enérgica', emoji: '⚡' },
  { id: 'cansada', label: 'Cansada', emoji: '😴' },
];

export const FLOW_LEVELS = [
  { id: 'none', label: 'Sin flujo' },
  { id: 'light', label: 'Ligero' },
  { id: 'medium', label: 'Medio' },
  { id: 'heavy', label: 'Abundante' },
];

export const FLOW_TYPES = [
  { id: 'rojo_brillante', label: 'Rojo brillante' },
  { id: 'rojo_oscuro', label: 'Rojo oscuro' },
  { id: 'cafe', label: 'Café' },
  { id: 'rosa', label: 'Rosa / manchado' },
  { id: 'con_coagulos', label: 'Con coágulos' },
  { id: 'otro', label: 'Otro' },
];

export const SYMPTOMS = [
  { id: 'colicos', label: 'Cólicos' },
  { id: 'dolor_cabeza', label: 'Dolor de cabeza' },
  { id: 'senos_sensibles', label: 'Senos sensibles' },
  { id: 'acne', label: 'Acné' },
  { id: 'hinchazon', label: 'Hinchazón' },
  { id: 'antojos', label: 'Antojos' },
  { id: 'nauseas', label: 'Náuseas' },
  { id: 'insomnio', label: 'Insomnio' },
  { id: 'dolor_espalda', label: 'Dolor de espalda' },
  { id: 'diarrea', label: 'Diarrea' },
  { id: 'estrenimiento', label: 'Estreñimiento' },
];

export const ENERGY_LEVELS = [
  { id: 1, label: 'Muy baja' },
  { id: 2, label: 'Baja' },
  { id: 3, label: 'Media' },
  { id: 4, label: 'Alta' },
  { id: 5, label: 'Muy alta' },
];

export const CONTRACEPTIVE_METHODS = [
  { id: 'preservativo', label: 'Preservativo' },
  { id: 'pastilla', label: 'Pastilla' },
  { id: 'diu', label: 'DIU' },
  { id: 'inyeccion', label: 'Inyección' },
  { id: 'implante', label: 'Implante' },
  { id: 'otro', label: 'Otro' },
  { id: 'ninguno', label: 'Ninguno' },
];
