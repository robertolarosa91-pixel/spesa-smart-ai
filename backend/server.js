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
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
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

function buildPrompt({ budget, persone, pasto, preferenze, intolleranze, vegano, supermercato }) {
  const profilo = SUPERMARKET_PROFILES[supermercato?.toLowerCase()] || 'supermercato generico italiano';

  return `Sei un assistente esperto di spesa e cucina italiana. Devi proporre una lista della spesa e 1-2 ricette abbinate, rispettando rigorosamente questi vincoli.

DATI:
- Numero di persone: ${persone}
- Pasto: ${pasto}
- Budget massimo totale: €${budget}
- Supermercato: ${supermercato} (${profilo})
- Preferenze alimentari: ${preferenze || 'nessuna preferenza particolare'}
- Vegano: ${vegano ? 'si' : 'no'}
- Intolleranze/allergie da evitare assolutamente: ${intolleranze || 'nessuna'}

ISTRUZIONI:
1. Proponi prodotti realistici per il tipo di supermercato indicato (marche proprie tipiche di quella catena quando plausibile).
2. Il totale stimato NON deve superare il budget indicato.
3. Se ci sono intolleranze o vegano, escludi categoricamente ogni ingrediente incompatibile.
4. Rispondi SOLO in formato JSON valido, nessun testo fuori dal JSON, con questa struttura esatta:

{
  "ricette": [
    {
      "nome": "Gnocchi alla sorrentina",
      "nome_ricerca": "Gnocchi alla sorrentina",
      "descrizione_breve": "Gnocchi con sugo di pomodoro, mozzarella e basilico.",
      "tempo_preparazione_minuti": 25,
      "emoji": "🍝"
    }
  ],
  "lista_spesa": [
    {
      "prodotto": "Gnocchi di patate",
      "quantita": "1 confezione",
      "prezzo_stimato_euro": 1.49
    }
  ],
  "totale_stimato_euro": 12.50,
  "note": "Prezzi stimati, controllare eventuali offerte."
}`;
}


async function cercaImmagineRicetta(nome) {
  try {
    if (!SERPAPI_KEY) return null;

    const query = `${nome} piatto cucina italiana food photography`;
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const immagini = data.images_results || [];

    if (immagini.length > 0) {
      return immagini[0].original || immagini[0].thumbnail || null;
    }

    return null;
  } catch (err) {
    console.error('Errore SerpAPI:', err.message);
    return null;
  }
}
app.post('/api/suggest', async (req, res) => {
  try {
    const { budget, persone, pasto, supermercato } = req.body;

    if (!budget || !persone || !pasto || !supermercato) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti: budget, persone, pasto, supermercato' });
    }

    const prompt = buildPrompt(req.body);

    const geminiResponse = await fetch(GEMINI_URL, {
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
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    }
  })
});

const data = await geminiResponse.json();

if (!geminiResponse.ok) {
  const msg = data?.error?.message || `Errore Gemini HTTP ${geminiResponse.status}`;
  console.error('Gemini API error:', msg);
  return res.status(502).json({ error: 'Errore nella chiamata AI', details: msg });
}

const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({ error: 'Risposta AI vuota o malformata' });
    }

    let parsed;
    try {
      let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const inizio = cleaned.indexOf('{');
      const fine = cleaned.lastIndexOf('}');
      if (inizio !== -1 && fine !== -1) {
        cleaned = cleaned.slice(inizio, fine + 1);
      }
      try {
  parsed = JSON.parse(cleaned);
} catch {
  cleaned = cleaned
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  parsed = JSON.parse(cleaned);
}
    } catch (e) {
      console.error('Testo grezzo ricevuto dall AI:', rawText);
return res.status(502).json({ error: 'Impossibile interpretare la risposta AI come JSON', raw: rawText });
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
