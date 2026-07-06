const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'https://spesa-smart-ai.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELS = [
  'gemini-2.5-flash'
];

function getGeminiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}
const SERPAPI_KEY = process.env.SERPAPI_KEY;





const FALLBACK_RICETTE = [
  {
    nome: 'Pasta al pomodoro e basilico',
    nome_ricerca: 'Pasta al pomodoro e basilico',
    descrizione_breve: 'Un primo semplice, economico e veloce con pomodoro e basilico.',
    tempo_preparazione_minuti: 20,
    difficolta: 'Facile',
    emoji: '🍝',
    tags: ['vegano', 'glutine'],
    lista_spesa: [
      { prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 },
      { prodotto: 'Passata di pomodoro', quantita: '700g', prezzo_stimato_euro: 0.89 },
      { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 3.28,
    preparazione_step_by_step: [
      'Porta a ebollizione abbondante acqua salata.',
      'Cuoci la pasta seguendo i tempi indicati.',
      'Scalda la passata con olio e basilico.',
      'Scola la pasta e uniscila al sugo.',
      'Mescola bene e servi calda.'
    ]
  },
  {
    nome: 'Riso con verdure saltate',
    nome_ricerca: 'Riso con verdure saltate',
    descrizione_breve: 'Riso leggero con verdure di stagione saltate in padella.',
    tempo_preparazione_minuti: 30,
    difficolta: 'Facile',
    emoji: '🍚',
    tags: ['vegano', 'senza_glutine'],
    lista_spesa: [
      { prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 },
      { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 },
      { prodotto: 'Carote', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 },
      { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 4.49,
    preparazione_step_by_step: [
      'Cuoci il riso in acqua salata.',
      'Taglia le verdure a cubetti piccoli.',
      'Salta le verdure in padella con olio.',
      'Unisci il riso scolato alle verdure.',
      'Mescola e servi caldo.'
    ]
  },
  {
    nome: 'Pollo al limone con patate',
    nome_ricerca: 'Pollo al limone con patate',
    descrizione_breve: 'Secondo piatto semplice con pollo, limone e patate al forno.',
    tempo_preparazione_minuti: 45,
    difficolta: 'Media',
    emoji: '🍗',
    tags: ['senza_glutine', 'senza_lattosio'],
    lista_spesa: [
      { prodotto: 'Petto di pollo', quantita: '500g', prezzo_stimato_euro: 4.50 },
      { prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 },
      { prodotto: 'Limone', quantita: '1 pezzo', prezzo_stimato_euro: 0.50 },
      { prodotto: 'Rosmarino', quantita: '1 rametto', prezzo_stimato_euro: 0.80 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.50 }
    ],
    totale_stimato_euro: 7.80,
    preparazione_step_by_step: [
      'Taglia le patate a spicchi.',
      'Condisci pollo e patate con olio, limone e rosmarino.',
      'Disponi tutto in una teglia.',
      'Cuoci in forno a 190 gradi per circa 35 minuti.',
      'Servi quando pollo e patate sono ben dorati.'
    ]
  },
  {
    nome: 'Frittata con zucchine',
    nome_ricerca: 'Frittata con zucchine',
    descrizione_breve: 'Frittata morbida con zucchine, veloce e adatta a pranzo o cena.',
    tempo_preparazione_minuti: 25,
    difficolta: 'Facile',
    emoji: '🍳',
    tags: ['uova', 'senza_glutine', 'senza_lattosio'],
    lista_spesa: [
      { prodotto: 'Uova', quantita: '6 pezzi', prezzo_stimato_euro: 2.20 },
      { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 },
      { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 4.30,
    preparazione_step_by_step: [
      'Taglia le zucchine a rondelle.',
      'Cuocile in padella con cipolla e olio.',
      'Sbatti le uova con sale e pepe.',
      'Unisci le zucchine alle uova.',
      'Cuoci la frittata da entrambi i lati.'
    ]
  },
  {
    nome: 'Insalata di ceci e pomodorini',
    nome_ricerca: 'Insalata di ceci e pomodorini',
    descrizione_breve: 'Piatto freddo proteico, veloce e completamente vegetale.',
    tempo_preparazione_minuti: 15,
    difficolta: 'Facile',
    emoji: '🥗',
    tags: ['vegano', 'senza_glutine'],
    lista_spesa: [
      { prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 },
      { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 },
      { prodotto: 'Mais', quantita: '1 lattina', prezzo_stimato_euro: 0.90 },
      { prodotto: 'Insalata', quantita: '1 busta', prezzo_stimato_euro: 1.20 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 5.90,
    preparazione_step_by_step: [
      'Scola e sciacqua i ceci.',
      'Lava e taglia i pomodorini.',
      'Unisci ceci, mais, pomodorini e insalata.',
      'Condisci con olio, sale e limone.',
      'Mescola e servi fredda.'
    ]
  },
  {
    nome: 'Pasta tonno e pomodorini',
    nome_ricerca: 'Pasta tonno e pomodorini',
    descrizione_breve: 'Primo piatto rapido con tonno, pomodorini e olio.',
    tempo_preparazione_minuti: 20,
    difficolta: 'Facile',
    emoji: '🐟',
    tags: ['glutine', 'pesce'],
    lista_spesa: [
      { prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 },
      { prodotto: 'Tonno in scatola', quantita: '2 confezioni', prezzo_stimato_euro: 2.80 },
      { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 },
      { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 6.19,
    preparazione_step_by_step: [
      'Cuoci la pasta in acqua salata.',
      'Taglia i pomodorini a metà.',
      'Scalda aglio e olio in padella.',
      'Aggiungi pomodorini e tonno scolato.',
      'Unisci la pasta e salta tutto insieme.'
    ]
  },
  {
    nome: 'Piadine con pollo e insalata',
    nome_ricerca: 'Piadine con pollo e insalata',
    descrizione_breve: 'Piatto pratico con pollo, insalata e piadine calde.',
    tempo_preparazione_minuti: 25,
    difficolta: 'Facile',
    emoji: '🌯',
    tags: ['glutine'],
    lista_spesa: [
      { prodotto: 'Piadine', quantita: '1 confezione', prezzo_stimato_euro: 1.60 },
      { prodotto: 'Petto di pollo', quantita: '400g', prezzo_stimato_euro: 3.80 },
      { prodotto: 'Insalata', quantita: '1 busta', prezzo_stimato_euro: 1.20 },
      { prodotto: 'Pomodori', quantita: '2 pezzi', prezzo_stimato_euro: 1.00 }
    ],
    totale_stimato_euro: 7.60,
    preparazione_step_by_step: [
      'Taglia il pollo a striscioline.',
      'Cuocilo in padella con olio e sale.',
      'Scalda le piadine pochi secondi per lato.',
      'Farcisci con pollo, insalata e pomodori.',
      'Chiudi e servi subito.'
    ]
  },
  {
    nome: 'Mozzarella, pomodoro e pane',
    nome_ricerca: 'Mozzarella pomodoro e pane',
    descrizione_breve: 'Cena fresca e veloce con mozzarella, pomodoro e pane.',
    tempo_preparazione_minuti: 10,
    difficolta: 'Facile',
    emoji: '🧀',
    tags: ['lattosio', 'glutine'],
    lista_spesa: [
      { prodotto: 'Mozzarella', quantita: '2 pezzi', prezzo_stimato_euro: 2.40 },
      { prodotto: 'Pomodori', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 },
      { prodotto: 'Pane', quantita: '1 filone', prezzo_stimato_euro: 1.50 },
      { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }
    ],
    totale_stimato_euro: 6.90,
    preparazione_step_by_step: [
      'Lava e taglia i pomodori.',
      'Taglia la mozzarella a fette.',
      'Disponi tutto su un piatto.',
      'Condisci con olio, sale e basilico.',
      'Servi con pane fresco.'
    ]
  },
  {
    nome: 'Cous cous con verdure',
    nome_ricerca: 'Cous cous con verdure',
    descrizione_breve: 'Piatto unico vegetale con cous cous e verdure saltate.',
    tempo_preparazione_minuti: 25,
    difficolta: 'Facile',
    emoji: '🥘',
    tags: ['vegano', 'glutine'],
    lista_spesa: [
      { prodotto: 'Cous cous', quantita: '500g', prezzo_stimato_euro: 1.40 },
      { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 },
      { prodotto: 'Peperoni', quantita: '2 pezzi', prezzo_stimato_euro: 2.00 },
      { prodotto: 'Ceci', quantita: '1 barattolo', prezzo_stimato_euro: 0.90 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 6.10,
    preparazione_step_by_step: [
      'Reidrata il cous cous con acqua calda salata.',
      'Taglia le verdure a cubetti.',
      'Salta le verdure in padella con olio.',
      'Aggiungi i ceci scolati.',
      'Unisci cous cous e verdure e servi.'
    ]
  },
  {
    nome: 'Riso freddo con tonno e mais',
    nome_ricerca: 'Riso freddo tonno e mais',
    descrizione_breve: 'Riso freddo semplice con tonno, mais e verdure.',
    tempo_preparazione_minuti: 30,
    difficolta: 'Facile',
    emoji: '🍚',
    tags: ['pesce', 'senza_glutine'],
    lista_spesa: [
      { prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 },
      { prodotto: 'Tonno in scatola', quantita: '2 confezioni', prezzo_stimato_euro: 2.80 },
      { prodotto: 'Mais', quantita: '1 lattina', prezzo_stimato_euro: 0.90 },
      { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }
    ],
    totale_stimato_euro: 6.79,
    preparazione_step_by_step: [
      'Cuoci il riso in acqua salata.',
      'Scolalo e raffreddalo sotto acqua fredda.',
      'Scola tonno e mais.',
      'Taglia i pomodorini.',
      'Mescola tutto e condisci con olio.'
    ]
  },
  {
    nome: 'Tofu con verdure e riso',
    nome_ricerca: 'Tofu con verdure e riso',
    descrizione_breve: 'Piatto vegetale con tofu, verdure e riso bianco.',
    tempo_preparazione_minuti: 30,
    difficolta: 'Media',
    emoji: '🌱',
    tags: ['vegano', 'senza_glutine', 'soia'],
    lista_spesa: [
      { prodotto: 'Tofu', quantita: '250g', prezzo_stimato_euro: 2.50 },
      { prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 },
      { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 },
      { prodotto: 'Carote', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 6.69,
    preparazione_step_by_step: [
      'Cuoci il riso in acqua salata.',
      'Taglia tofu e verdure a cubetti.',
      'Rosola il tofu in padella.',
      'Aggiungi le verdure e cuoci finché morbide.',
      'Servi tofu e verdure sopra il riso.'
    ]
  },
  {
    nome: 'Patate e ceci al forno',
    nome_ricerca: 'Patate e ceci al forno',
    descrizione_breve: 'Piatto vegetale croccante con patate, ceci e spezie.',
    tempo_preparazione_minuti: 45,
    difficolta: 'Facile',
    emoji: '🥔',
    tags: ['vegano', 'senza_glutine'],
    lista_spesa: [
      { prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 },
      { prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 },
      { prodotto: 'Rosmarino', quantita: '1 rametto', prezzo_stimato_euro: 0.80 },
      { prodotto: 'Paprika', quantita: 'q.b.', prezzo_stimato_euro: 0.50 },
      { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }
    ],
    totale_stimato_euro: 5.00,
    preparazione_step_by_step: [
      'Taglia le patate a cubetti.',
      'Scola e asciuga i ceci.',
      'Condisci patate e ceci con olio e spezie.',
      'Disponi tutto su una teglia.',
      'Cuoci in forno a 200 gradi finché croccante.'
    ]
  }
];

function normalizzaTesto(value) {
  return String(value || '').toLowerCase();
}

function ricettaCompatibileFallback(ricetta, body) {
  const intolleranze = normalizzaTesto(body.intolleranze);
  const tags = ricetta.tags || [];

  if (body.vegano && !tags.includes('vegano')) return false;
  if (intolleranze.includes('lattosio') && tags.includes('lattosio')) return false;
  if (intolleranze.includes('glutine') && tags.includes('glutine')) return false;
  if (intolleranze.includes('uova') && tags.includes('uova')) return false;
  if (intolleranze.includes('pesce') && tags.includes('pesce')) return false;
  if (intolleranze.includes('crostacei') && tags.includes('pesce')) return false;
  if (intolleranze.includes('soia') && tags.includes('soia')) return false;
  if (intolleranze.includes('frutta a guscio') && tags.includes('frutta_guscio')) return false;

  return true;
}

function buildFallbackResponse(body) {
  const evitare = Array.isArray(body.ricette_da_evitare)
    ? body.ricette_da_evitare.map(normalizzaTesto)
    : [];

  const ricette = FALLBACK_RICETTE
    .filter(r => !evitare.includes(normalizzaTesto(r.nome)))
    .filter(r => ricettaCompatibileFallback(r, body))
    .slice(0, 6)
    .map(({ tags, ...ricetta }) => ricetta);

  return {
    ricette,
    note: 'Ricette base mostrate perché il servizio è momentaneamente occupato. Prezzi stimati, controllare eventuali offerte.'
  };
}

const SUPERMARKET_PROFILES = {
  lidl: 'discount tedesco, marche proprie (Milbona, Vitasia, Alesto), buon rapporto qualita prezzo, prodotti freschi a rotazione settimanale',
  eurospin: 'discount italiano, prezzi molto bassi, marche proprie, assortimento essenziale',
  md: 'discount italiano diffuso soprattutto al sud, marche proprie MD, prezzi bassi',
  esselunga: 'supermercato di fascia medio-alta, ampia scelta, marchio Esselunga, prodotti freschi e gastronomia',
  conad: 'supermercato generalista, marchi Conad e Sapori&Idee, buona copertura nazionale',
  coop: 'supermercato generalista con forte attenzione a bio e sostenibilita, marchio Coop',
  carrefour: 'ipermercato generalista, marchio Carrefour, ampia scelta internazionale'
};

function buildPrompt({ persone, pasto, preferenze, intolleranze, vegano, supermercato, ricette_da_evitare }) {
 
  const profilo = SUPERMARKET_PROFILES[supermercato?.toLowerCase()] || 'supermercato generico italiano';
  const ricetteDaEvitare = Array.isArray(ricette_da_evitare)
  ? ricette_da_evitare.filter(Boolean).join(', ')
  : '';
  return `Sei un assistente esperto di spesa e cucina italiana. Devi proporre esattamente 6 ricette diverse, sintetiche e realistiche, rispettando rigorosamente questi vincoli.

DATI:
- Numero di persone: ${persone}
- Pasto: ${pasto}

- Supermercato: ${supermercato} (${profilo})
- Preferenze alimentari: ${preferenze || 'nessuna preferenza particolare'}
- Vegano: ${vegano ? 'si' : 'no'}
- Intolleranze/allergie da evitare assolutamente: ${intolleranze || 'nessuna'}
- Ricette già proposte da evitare: ${ricetteDaEvitare || 'nessuna'}

ISTRUZIONI:
1. Proponi prodotti realistici per il tipo di supermercato indicato.
2. Proponi ricette realistiche, convenienti e sensate per il numero di persone indicato.
3. Se il supermercato è un discount, usa prodotti economici e marche compatibili.
4. Se il supermercato è di fascia medio-alta, puoi proporre ingredienti leggermente migliori.
5. Se ci sono intolleranze o vegano, escludi ogni ingrediente incompatibile.
6. Ogni ricetta deve avere la sua lista_spesa specifica.
7. Non mischiare gli ingredienti di ricette diverse.
8. Ogni ricetta deve avere il suo totale_stimato_euro realistico.
9. Ogni ricetta deve avere una difficolta: "Facile", "Media" oppure "Difficile".
10. Ogni ricetta deve avere una preparazione_step_by_step con 4-6 passaggi chiari, pratici e specifici per quella ricetta.
11. Mantieni ogni descrizione breve e ogni lista_spesa essenziale, massimo 6 prodotti per ricetta.
12. Se sono indicate ricette già proposte da evitare, non riproporle.
13. Rispondi SOLO in JSON valido, senza testo fuori dal JSON. Non inserire virgole finali dopo l'ultimo elemento di array o oggetti.

Formato richiesto. Dentro "ricette" devi generare esattamente 6 oggetti come questo esempio:
{
  "ricette": [
    {
      "nome": "Gnocchi alla sorrentina",
      "nome_ricerca": "Gnocchi alla sorrentina",
      "descrizione_breve": "Gnocchi con sugo di pomodoro, mozzarella e basilico.",
      "tempo_preparazione_minuti": 25,
"difficolta": "Facile",
"emoji": "🍝",
"preparazione_step_by_step": [
  "Passaggio pratico 1 specifico per questa ricetta.",
  "Passaggio pratico 2 specifico per questa ricetta.",
  "Passaggio pratico 3 specifico per questa ricetta.",
  "Passaggio pratico 4 specifico per questa ricetta.",
  "Passaggio pratico 5 specifico per questa ricetta."
],
"lista_spesa": [
        {
          "prodotto": "Gnocchi di patate",
          "quantita": "1 confezione",
          "prezzo_stimato_euro": 1.49
        }
      ],
      "totale_stimato_euro": 8.50
    }
  ],
  "note": "Prezzi stimati, controllare eventuali offerte."
}`;
}

function cleanAIText(text) {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*json\s*/i, '')
    .trim();
}

function extractJsonObject(text) {
  let cleaned = cleanAIText(text);

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Nessun oggetto JSON trovato');
  }

  cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    cleaned = cleaned
      // Toglie virgole finali non valide
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')

      // Corregge prezzi scritti tipo 8,50 invece di 8.50
      .replace(/:\s*(\d+),(\d+)/g, ': $1.$2')

      // Corregge il caso:
      // ]
      // "lista_spesa":
      .replace(/]\s*\n\s*"/g, '],\n"')

      // Corregge il caso:
      // }
      // "campo":
      .replace(/}\s*\n\s*"/g, '},\n"');

    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('JSON originale non valido:', firstError.message);
      console.error('JSON corretto ancora non valido:', secondError.message);
      console.error('JSON dopo correzione:', cleaned);
      throw secondError;
    }
  }
}

async function cercaImmagineRicetta(nome) {
  try {
    if (!SERPAPI_KEY) return null;

    const query = `${nome} piatto cucina italiana food photography`;
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const immagini = data.images_results || [];

const immagineValida = immagini.find(img =>
  img.thumbnail && img.thumbnail.startsWith('http')
);

if (immagineValida) {
  return immagineValida.thumbnail;
}

const originaleValida = immagini.find(img =>
  img.original && img.original.startsWith('http')
);

if (originaleValida) {
  return originaleValida.original;
}

return null;
  } catch (err) {
    console.error('Errore SerpAPI:', err.message);
    return null;
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isErroreTemporaneoGemini(message) {
  return /high demand|try again later|overloaded|temporar/i.test(String(message || '').toLowerCase());
}

async function callGemini(prompt) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(getGeminiUrl(model), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 12000,
            responseMimeType: 'application/json'
          }
        })
      });

      let data;

      try {
        data = await response.json();
      } catch (err) {
        lastError = `Risposta non JSON da ${model}: ${err.message}`;
        console.error(lastError);
        continue;
      }

      if (response.ok) {
        return data;
      }

      lastError = data?.error?.message || `Errore Gemini HTTP ${response.status}`;
      console.error(`Gemini API error con ${model}, tentativo ${attempt}:`, lastError);

      if (isErroreTemporaneoGemini(lastError) && attempt < 3) {
        await sleep(5000 * attempt);
        continue;
      }

      break;
    }
  }

  throw new Error(lastError || 'Errore Gemini');
}
app.post('/api/suggest', async (req, res) => {
  try {
    const { persone, pasto, supermercato } = req.body;

    if (!persone || !pasto || !supermercato) {
  return res.status(400).json({ error: 'Campi obbligatori mancanti: persone, pasto, supermercato' });
}


    const prompt = buildPrompt(req.body);



let data;

try {
  data = await callGemini(prompt);
} catch (e) {
  const msg = String(e.message || '');

 if (msg.toLowerCase().includes('quota exceeded')) {
  const fallback = buildFallbackResponse(req.body);

  return res.json({
    ...fallback,
    fallback: true
  });
}

if (msg.toLowerCase().includes('high demand')) {
  const fallback = buildFallbackResponse(req.body);

  return res.json({
    ...fallback,
    fallback: true
  });
}

  return res.status(502).json({
    error: 'Errore nella chiamata AI',
    details: msg
  });
}

const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({ error: 'Risposta AI vuota o malformata' });
    }

    let parsed;

try {
  parsed = extractJsonObject(rawText);
} catch (e) {
  console.error('Errore parsing JSON AI:', e.message);
  console.error('Testo grezzo ricevuto dall AI:', rawText);

  return res.status(502).json({
    error: 'Impossibile interpretare la risposta AI come JSON',
    raw: rawText
  });
}

    const ricetteConImmagini = await Promise.all(
  (parsed.ricette || []).map(async (ricetta) => {
    const immagine = await cercaImmagineRicetta(
      ricetta.nome_ricerca || ricetta.nome
    );

    return {
      ...ricetta,
      immagine
    };
  })
);

res.json({
  ...parsed,
  ricette: ricetteConImmagini
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend attivo su http://localhost:${PORT}`));
