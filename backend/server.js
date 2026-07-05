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
  return res.status(429).json({
    error: 'Troppe richieste al momento',
    details: 'Troppe richieste al momento. Riprova tra 1 minuto.',
    retryAfterSeconds: 60
  });
}

  if (msg.toLowerCase().includes('high demand')) {
    return res.status(503).json({
      error: 'AI momentaneamente occupata',
      details: 'Gemini è molto richiesto in questo momento. Riprova tra qualche minuto.'
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
