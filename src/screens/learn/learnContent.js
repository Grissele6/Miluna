// New v2 structure: 8 categories → each with short articles.
// Content is placeholder; only structure and titles are stable.

export const LEARN_CATEGORIES = [
  {
    id: 'ciclo',
    title: 'Mi ciclo',
    emoji: '🩸',
    summary: 'Cómo funciona tu ciclo, fase a fase.',
    articles: [
      { id: 'primera-regla', title: 'Mi primera regla' },
      { id: 'fases', title: 'Las fases del ciclo' },
      { id: 'flujo-vaginal', title: 'El flujo vaginal y sus cambios' },
      { id: 'cada-cuerpo', title: 'Cada cuerpo es distinto' },
    ],
  },
  {
    id: 'productos',
    title: 'Productos',
    emoji: '🧺',
    summary: 'Toallitas, tampones y copa menstrual.',
    articles: [
      { id: 'toallitas', title: 'Toallitas: cómo elegir y cambiar' },
      { id: 'tampones', title: 'Tampones: uso seguro y mitos' },
      { id: 'copa', title: 'Copa menstrual: primera vez y cuidados' },
    ],
  },
  {
    id: 'sexualidad',
    title: 'Sexualidad segura',
    emoji: '❤️',
    summary: 'Métodos, protección y anticoncepción de emergencia.',
    articles: [
      { id: 'preservativo', title: 'Preservativo: uso correcto' },
      { id: 'metodos', title: 'Métodos anticonceptivos comparados' },
      { id: 'emergencia', title: 'Anticoncepción de emergencia: el tiempo importa' },
      { id: 'its', title: 'Infecciones de transmisión sexual (ITS)' },
    ],
  },
  {
    id: 'deseo',
    title: 'Deseo y emociones',
    emoji: '💜',
    summary: 'Lo que sientes también es parte del ciclo.',
    articles: [
      { id: 'deseo-fases', title: 'Cambios en el deseo según el ciclo' },
      { id: 'humor', title: 'Cambios de humor: valida lo que sientes' },
      { id: 'autoconocimiento', title: 'Autoconocimiento y placer' },
    ],
  },
  {
    id: 'embarazo',
    title: 'Embarazo',
    emoji: '🤰',
    summary: 'Buscar, síntomas tempranos y cuidados.',
    articles: [
      { id: 'buscando', title: 'Cuando estás buscando' },
      { id: 'primeros-sintomas', title: 'Primeros síntomas' },
      { id: 'cuando-test', title: '¿Cuándo hacerse un test?' },
      { id: 'controles', title: 'Controles y matrona' },
    ],
  },
  {
    id: 'bienestar',
    title: 'Bienestar',
    emoji: '🍵',
    summary: 'Alivio de cólicos y molestias frecuentes.',
    articles: [
      { id: 'colicos', title: 'Alivio de cólicos' },
      { id: 'estrenimiento', title: 'Estreñimiento en el ciclo' },
      {
        id: 'remedios',
        title: 'Remedios naturales: ciencia vs. tradición',
        note: 'Cada remedio se marca como "con respaldo científico" o "tradición popular".',
      },
    ],
  },
  {
    id: 'alerta',
    title: 'Cuándo consultar',
    emoji: '⚠️',
    summary: 'Señales que merecen una consulta.',
    articles: [
      { id: 'senales', title: 'Señales de alerta' },
      { id: 'matrona', title: 'La app + tu matrona' },
    ],
  },
  {
    id: 'mitos',
    title: 'Mitos frecuentes',
    emoji: '❌',
    summary: 'Lo que se dice por ahí y lo que sabemos hoy.',
    articles: [
      { id: 'mitos-regla', title: 'Mitos sobre la regla' },
      { id: 'mitos-sexo', title: 'Mitos sobre sexualidad' },
    ],
  },
];

// Category order for each stage — the first entry gets top-of-list.
const STAGE_ORDER = {
  adolescente: ['ciclo', 'productos', 'bienestar', 'deseo', 'sexualidad', 'mitos', 'alerta', 'embarazo'],
  adulta: ['ciclo', 'sexualidad', 'deseo', 'bienestar', 'productos', 'embarazo', 'alerta', 'mitos'],
  buscando: ['embarazo', 'ciclo', 'sexualidad', 'deseo', 'bienestar', 'productos', 'alerta', 'mitos'],
  embarazo: ['embarazo', 'alerta', 'bienestar', 'deseo', 'ciclo', 'productos', 'sexualidad', 'mitos'],
  menopausia: ['ciclo', 'bienestar', 'alerta', 'sexualidad', 'deseo', 'productos', 'mitos', 'embarazo'],
};

export function orderedCategoriesForStage(stageId) {
  const order = STAGE_ORDER[stageId] || STAGE_ORDER.adulta;
  const byId = Object.fromEntries(LEARN_CATEGORIES.map((c) => [c.id, c]));
  return order.map((id) => byId[id]).filter(Boolean);
}

export function getCategory(id) {
  return LEARN_CATEGORIES.find((c) => c.id === id);
}

export function getArticle(categoryId, articleId) {
  const cat = getCategory(categoryId);
  if (!cat) return null;
  return cat.articles.find((a) => a.id === articleId) || null;
}
