export const MAINTENANCE_CATEGORIES: Record<string, string[]> = {
  "Manutenção Elétrica": [
    "Quadros elétricos",
    "Iluminação de garagem e áreas comuns",
    "Sensores de presença",
    "Bombas elétricas",
    "Geradores",
    "SPDA (para-raios)",
    "Interfones",
    "Portões automáticos",
    "Tomadas e interruptores",
    "Cabos e eletrodutos"
  ],
  "Manutenção Hidráulica": [
    "Sistema de água, esgoto e drenagem",
    "Bombas de recalque",
    "Cisternas e caixas d'água",
    "Tubulações de água e esgoto",
    "Vazamentos",
    "Registros e válvulas",
    "Prumadas",
    "Ralos e grelhas",
    "Sistema de drenagem pluvial"
  ],
  "Manutenção Civil": [
    "Parte estrutural e acabamentos do prédio",
    "Trincas e fissuras",
    "Pintura",
    "Revestimentos",
    "Calçadas",
    "Muros",
    "Impermeabilização",
    "Telhados",
    "Fachadas",
    "Pisos e contrapiso"
  ],
  "Manutenção Mecânica": [
    "Equipamentos mecânicos utilizados no condomínio",
    "Bombas hidráulicas",
    "Motores de portões",
    "Sistemas de exaustão de garagem",
    "Equipamentos de pressurização",
    "Equipamentos de academia"
  ],
  "Manutenção de Segurança": [
    "Sistemas voltados à segurança do condomínio",
    "CFTV (câmeras)",
    "Controle de acesso",
    "Fechaduras eletrônicas",
    "Cancelas",
    "Alarmes",
    "Cercas elétricas"
  ],
  "Manutenção de Prevenção e Combate a Incêndio": [
    "Extintores",
    "Hidrantes",
    "Mangueiras de incêndio",
    "Bombas de incêndio",
    "Detectores de fumaça",
    "Pressurização de escadas",
    "Iluminação de emergência"
  ],
  "Manutenção de Elevadores": [
    "Manutenção preventiva mensal",
    "Testes de segurança",
    "Ajustes mecânicos",
    "Troca de cabos",
    "Revisão de portas"
  ],
  "Manutenção de Áreas Externas": [
    "Jardins e paisagismo",
    "Irrigação",
    "Piscina",
    "Quadras",
    "Playground",
    "Mobiliário externo"
  ],
  "Manutenção de Telecomunicações": [
    "Rede de internet",
    "Cabeamento estruturado",
    "Interfonia",
    "Antenas coletivas",
    "Fibra óptica"
  ],
  "Manutenção de Limpeza Técnica": [
    "Limpeza de caixas d'água",
    "Limpeza de cisternas",
    "Limpeza de galerias pluviais",
    "Desentupimentos"
  ]
};

export const NBR5674_STANDARDS = [
  { 
    id: 'elevadores',
    item: 'Elevadores', 
    frequency: 'Mensal', 
    category: 'Manutenção de Elevadores', 
    description: 'Manutenção preventiva mensal obrigatória para garantir a segurança e o funcionamento dos elevadores.' 
  },
  { 
    id: 'spda',
    item: 'Para-raios (SPDA)', 
    frequency: 'Anual', 
    category: 'Manutenção Elétrica', 
    description: 'Inspeção visual e medição ôhmica do Sistema de Proteção contra Descargas Atmosféricas.' 
  },
  { 
    id: 'caixa-agua',
    item: 'Caixa d\'água', 
    frequency: 'Semestral', 
    category: 'Manutenção de Limpeza Técnica', 
    description: 'Limpeza e desinfecção dos reservatórios de água para garantir a potabilidade.' 
  },
  { 
    id: 'extintores',
    item: 'Extintores', 
    frequency: 'Anual', 
    category: 'Manutenção de Prevenção e Combate a Incêndio', 
    description: 'Recarga e inspeção técnica anual dos extintores de incêndio.' 
  },
  { 
    id: 'bombas',
    item: 'Bombas de Recalque', 
    frequency: 'Semestral', 
    category: 'Manutenção Hidráulica', 
    description: 'Verificação de motores, vedações e painéis de comando das bombas.' 
  },
  { 
    id: 'geradores',
    item: 'Geradores', 
    frequency: 'Mensal', 
    category: 'Manutenção Elétrica', 
    description: 'Teste de funcionamento em carga e verificação de níveis de óleo e combustível.' 
  },
  { 
    id: 'portoes',
    item: 'Portões Automáticos', 
    frequency: 'Trimestral', 
    category: 'Manutenção Mecânica', 
    description: 'Lubrificação, ajuste de sensores e verificação de cabos/correias.' 
  },
];
