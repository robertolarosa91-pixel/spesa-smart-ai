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
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash'
];

function getGeminiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;





const FALLBACK_RICETTE = [
  { nome: 'Pasta al pomodoro e basilico', nome_ricerca: 'Pasta al pomodoro e basilico', descrizione_breve: 'Un primo semplice, economico e veloce con pomodoro e basilico.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🍝', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Passata di pomodoro', quantita: '700g', prezzo_stimato_euro: 0.89 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.28,
    preparazione_step_by_step: ['Porta a ebollizione abbondante acqua salata.', 'Cuoci la pasta seguendo i tempi indicati.', 'Scalda la passata con olio e basilico.', 'Scola la pasta e uniscila al sugo.', 'Mescola bene e servi calda.'] },

  { nome: 'Riso con verdure saltate', nome_ricerca: 'Riso con verdure saltate', descrizione_breve: 'Riso leggero con verdure di stagione saltate in padella.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🍚', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 }, { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Carote', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 4.49,
    preparazione_step_by_step: ['Cuoci il riso in acqua salata.', 'Taglia le verdure a cubetti piccoli.', 'Salta le verdure in padella con olio.', 'Unisci il riso scolato alle verdure.', 'Mescola e servi caldo.'] },

  { nome: 'Pollo al limone con patate', nome_ricerca: 'Pollo al limone con patate', descrizione_breve: 'Secondo piatto semplice con pollo, limone e patate al forno.', tempo_preparazione_minuti: 45, difficolta: 'Media', emoji: '🍗', tags: ['senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Petto di pollo', quantita: '500g', prezzo_stimato_euro: 4.50 }, { prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 }, { prodotto: 'Limone', quantita: '1 pezzo', prezzo_stimato_euro: 0.50 }, { prodotto: 'Rosmarino', quantita: '1 rametto', prezzo_stimato_euro: 0.80 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.50 }],
    totale_stimato_euro: 7.80,
    preparazione_step_by_step: ['Taglia le patate a spicchi.', 'Condisci pollo e patate con olio, limone e rosmarino.', 'Disponi tutto in una teglia.', 'Cuoci in forno a 190 gradi per circa 35 minuti.', 'Servi quando pollo e patate sono ben dorati.'] },

  { nome: 'Frittata con zucchine', nome_ricerca: 'Frittata con zucchine', descrizione_breve: 'Frittata morbida con zucchine, veloce e adatta a pranzo o cena.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🍳', tags: ['uova', 'senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Uova', quantita: '6 pezzi', prezzo_stimato_euro: 2.20 }, { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 4.30,
    preparazione_step_by_step: ['Taglia le zucchine a rondelle.', 'Cuocile in padella con cipolla e olio.', 'Sbatti le uova con sale e pepe.', 'Unisci le zucchine alle uova.', 'Cuoci la frittata da entrambi i lati.'] },

  { nome: 'Insalata di ceci e pomodorini', nome_ricerca: 'Insalata di ceci e pomodorini', descrizione_breve: 'Piatto freddo proteico, veloce e completamente vegetale.', tempo_preparazione_minuti: 15, difficolta: 'Facile', emoji: '🥗', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 }, { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }, { prodotto: 'Mais', quantita: '1 lattina', prezzo_stimato_euro: 0.90 }, { prodotto: 'Insalata', quantita: '1 busta', prezzo_stimato_euro: 1.20 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 5.90,
    preparazione_step_by_step: ['Scola e sciacqua i ceci.', 'Lava e taglia i pomodorini.', 'Unisci ceci, mais, pomodorini e insalata.', 'Condisci con olio, sale e limone.', 'Mescola e servi fredda.'] },

  { nome: 'Pasta tonno e pomodorini', nome_ricerca: 'Pasta tonno e pomodorini', descrizione_breve: 'Primo piatto rapido con tonno, pomodorini e olio.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🐟', tags: ['glutine', 'pesce'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Tonno in scatola', quantita: '2 confezioni', prezzo_stimato_euro: 2.80 }, { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 6.19,
    preparazione_step_by_step: ['Cuoci la pasta in acqua salata.', 'Taglia i pomodorini a metà.', 'Scalda aglio e olio in padella.', 'Aggiungi pomodorini e tonno scolato.', 'Unisci la pasta e salta tutto insieme.'] },

  { nome: 'Piadine con pollo e insalata', nome_ricerca: 'Piadine con pollo e insalata', descrizione_breve: 'Piatto pratico con pollo, insalata e piadine calde.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🌯', tags: ['glutine'],
    lista_spesa: [{ prodotto: 'Piadine', quantita: '1 confezione', prezzo_stimato_euro: 1.60 }, { prodotto: 'Petto di pollo', quantita: '400g', prezzo_stimato_euro: 3.80 }, { prodotto: 'Insalata', quantita: '1 busta', prezzo_stimato_euro: 1.20 }, { prodotto: 'Pomodori', quantita: '2 pezzi', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 7.60,
    preparazione_step_by_step: ['Taglia il pollo a striscioline.', 'Cuocilo in padella con olio e sale.', 'Scalda le piadine pochi secondi per lato.', 'Farcisci con pollo, insalata e pomodori.', 'Chiudi e servi subito.'] },

  { nome: 'Mozzarella, pomodoro e pane', nome_ricerca: 'Mozzarella pomodoro e pane', descrizione_breve: 'Cena fresca e veloce con mozzarella, pomodoro e pane.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🧀', tags: ['lattosio', 'glutine'],
    lista_spesa: [{ prodotto: 'Mozzarella', quantita: '2 pezzi', prezzo_stimato_euro: 2.40 }, { prodotto: 'Pomodori', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Pane', quantita: '1 filone', prezzo_stimato_euro: 1.50 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 6.90,
    preparazione_step_by_step: ['Lava e taglia i pomodori.', 'Taglia la mozzarella a fette.', 'Disponi tutto su un piatto.', 'Condisci con olio, sale e basilico.', 'Servi con pane fresco.'] },

  { nome: 'Cous cous con verdure', nome_ricerca: 'Cous cous con verdure', descrizione_breve: 'Piatto unico vegetale con cous cous e verdure saltate.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🥘', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Cous cous', quantita: '500g', prezzo_stimato_euro: 1.40 }, { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Peperoni', quantita: '2 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Ceci', quantita: '1 barattolo', prezzo_stimato_euro: 0.90 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 6.10,
    preparazione_step_by_step: ['Reidrata il cous cous con acqua calda salata.', 'Taglia le verdure a cubetti.', 'Salta le verdure in padella con olio.', 'Aggiungi i ceci scolati.', 'Unisci cous cous e verdure e servi.'] },

  { nome: 'Riso freddo con tonno e mais', nome_ricerca: 'Riso freddo tonno e mais', descrizione_breve: 'Riso freddo semplice con tonno, mais e verdure.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🍚', tags: ['pesce', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 }, { prodotto: 'Tonno in scatola', quantita: '2 confezioni', prezzo_stimato_euro: 2.80 }, { prodotto: 'Mais', quantita: '1 lattina', prezzo_stimato_euro: 0.90 }, { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }],
    totale_stimato_euro: 6.79,
    preparazione_step_by_step: ['Cuoci il riso in acqua salata.', 'Scolalo e raffreddalo sotto acqua fredda.', 'Scola tonno e mais.', 'Taglia i pomodorini.', 'Mescola tutto e condisci con olio.'] },

  { nome: 'Tofu con verdure e riso', nome_ricerca: 'Tofu con verdure e riso', descrizione_breve: 'Piatto vegetale con tofu, verdure e riso bianco.', tempo_preparazione_minuti: 30, difficolta: 'Media', emoji: '🌱', tags: ['vegano', 'senza_glutine', 'soia'],
    lista_spesa: [{ prodotto: 'Tofu', quantita: '250g', prezzo_stimato_euro: 2.50 }, { prodotto: 'Riso', quantita: '500g', prezzo_stimato_euro: 1.49 }, { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Carote', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 6.69,
    preparazione_step_by_step: ['Cuoci il riso in acqua salata.', 'Taglia tofu e verdure a cubetti.', 'Rosola il tofu in padella.', 'Aggiungi le verdure e cuoci finché morbide.', 'Servi tofu e verdure sopra il riso.'] },

  { nome: 'Patate e ceci al forno', nome_ricerca: 'Patate e ceci al forno', descrizione_breve: 'Piatto vegetale croccante con patate, ceci e spezie.', tempo_preparazione_minuti: 45, difficolta: 'Facile', emoji: '🥔', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 }, { prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 }, { prodotto: 'Rosmarino', quantita: '1 rametto', prezzo_stimato_euro: 0.80 }, { prodotto: 'Paprika', quantita: 'q.b.', prezzo_stimato_euro: 0.50 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 5.00,
    preparazione_step_by_step: ['Taglia le patate a cubetti.', 'Scola e asciuga i ceci.', 'Condisci patate e ceci con olio e spezie.', 'Disponi tutto su una teglia.', 'Cuoci in forno a 200 gradi finché croccante.'] },

  { nome: 'Pasta alla carbonara', nome_ricerca: 'Pasta alla carbonara', descrizione_breve: 'Il classico romano con uova, guanciale e pecorino.', tempo_preparazione_minuti: 20, difficolta: 'Media', emoji: '🍝', tags: ['glutine', 'uova', 'lattosio'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Guanciale', quantita: '150g', prezzo_stimato_euro: 2.90 }, { prodotto: 'Uova', quantita: '4 pezzi', prezzo_stimato_euro: 1.50 }, { prodotto: 'Pecorino grattugiato', quantita: '100g', prezzo_stimato_euro: 1.99 }],
    totale_stimato_euro: 7.38,
    preparazione_step_by_step: ['Cuoci la pasta in acqua salata.', 'Rosola il guanciale a cubetti senza olio.', 'Sbatti le uova con il pecorino.', 'Scola la pasta e uniscila al guanciale.', 'Fuori dal fuoco, manteca con le uova e servi.'] },

  { nome: "Pasta all'arrabbiata", nome_ricerca: "Pasta all'arrabbiata", descrizione_breve: 'Primo piccante con pomodoro, aglio e peperoncino.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🌶️', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Passata di pomodoro', quantita: '500g', prezzo_stimato_euro: 0.79 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Peperoncino', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 2.48,
    preparazione_step_by_step: ['Cuoci la pasta in acqua salata.', 'Soffriggi aglio e peperoncino in olio.', 'Aggiungi la passata e cuoci 10 minuti.', 'Scola la pasta e uniscila al sugo.', 'Mescola bene e servi calda.'] },

  { nome: 'Pasta aglio, olio e peperoncino', nome_ricerca: 'Pasta aglio olio e peperoncino', descrizione_breve: 'Il primo più veloce ed economico della cucina italiana.', tempo_preparazione_minuti: 15, difficolta: 'Facile', emoji: '🧄', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Peperoncino', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Prezzemolo', quantita: '1 mazzetto', prezzo_stimato_euro: 0.90 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 2.99,
    preparazione_step_by_step: ['Cuoci la pasta in acqua salata.', 'Scalda olio con aglio a fette e peperoncino.', 'Scola la pasta tenendo un po di acqua di cottura.', 'Salta la pasta nella padella con olio profumato.', 'Aggiungi prezzemolo fresco e servi.'] },

  { nome: 'Risotto ai funghi', nome_ricerca: 'Risotto ai funghi', descrizione_breve: 'Risotto cremoso con funghi champignon e parmigiano.', tempo_preparazione_minuti: 35, difficolta: 'Media', emoji: '🍄', tags: ['glutine', 'lattosio'],
    lista_spesa: [{ prodotto: 'Riso per risotti', quantita: '400g', prezzo_stimato_euro: 1.79 }, { prodotto: 'Funghi champignon', quantita: '400g', prezzo_stimato_euro: 2.50 }, { prodotto: 'Burro', quantita: '50g', prezzo_stimato_euro: 0.60 }, { prodotto: 'Parmigiano grattugiato', quantita: '100g', prezzo_stimato_euro: 1.99 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 7.18,
    preparazione_step_by_step: ['Pulisci e taglia i funghi.', 'Soffriggi la cipolla e tosta il riso.', 'Aggiungi i funghi e sfuma con brodo caldo poco alla volta.', 'Continua la cottura mescolando spesso.', 'Manteca fuori dal fuoco con burro e parmigiano.'] },

  { nome: 'Risotto alla milanese', nome_ricerca: 'Risotto alla milanese', descrizione_breve: 'Risotto giallo classico allo zafferano.', tempo_preparazione_minuti: 30, difficolta: 'Media', emoji: '🟡', tags: ['glutine', 'lattosio'],
    lista_spesa: [{ prodotto: 'Riso per risotti', quantita: '400g', prezzo_stimato_euro: 1.79 }, { prodotto: 'Zafferano', quantita: '1 bustina', prezzo_stimato_euro: 1.20 }, { prodotto: 'Burro', quantita: '50g', prezzo_stimato_euro: 0.60 }, { prodotto: 'Parmigiano grattugiato', quantita: '100g', prezzo_stimato_euro: 1.99 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 5.88,
    preparazione_step_by_step: ['Soffriggi la cipolla in un tegame.', 'Tosta il riso e sfuma con brodo caldo.', 'Sciogli lo zafferano in un mestolo di brodo.', 'Continua la cottura aggiungendo brodo poco alla volta.', 'Manteca con burro, parmigiano e zafferano.'] },

  { nome: 'Pasta al pesto', nome_ricerca: 'Pasta al pesto genovese', descrizione_breve: 'Primo rapido con pesto pronto, patate e fagiolini.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🌿', tags: ['glutine', 'lattosio', 'frutta_guscio'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Pesto pronto', quantita: '1 vasetto', prezzo_stimato_euro: 1.99 }, { prodotto: 'Patate', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Fagiolini surgelati', quantita: '200g', prezzo_stimato_euro: 1.20 }],
    totale_stimato_euro: 4.78,
    preparazione_step_by_step: ['Taglia le patate a cubetti piccoli.', 'Cuoci pasta, patate e fagiolini insieme in acqua salata.', 'Scola tutto tenendo un po di acqua di cottura.', 'Condisci con il pesto e un filo di acqua di cottura.', 'Mescola bene e servi.'] },

  { nome: 'Lasagne al forno semplici', nome_ricerca: 'Lasagne al forno', descrizione_breve: 'Lasagne con ragù, besciamella e parmigiano.', tempo_preparazione_minuti: 60, difficolta: 'Media', emoji: '🍽️', tags: ['glutine', 'lattosio'],
    lista_spesa: [{ prodotto: 'Sfoglie per lasagne', quantita: '1 confezione', prezzo_stimato_euro: 1.49 }, { prodotto: 'Ragù pronto', quantita: '400g', prezzo_stimato_euro: 2.99 }, { prodotto: 'Besciamella pronta', quantita: '500ml', prezzo_stimato_euro: 1.79 }, { prodotto: 'Parmigiano grattugiato', quantita: '100g', prezzo_stimato_euro: 1.99 }],
    totale_stimato_euro: 8.26,
    preparazione_step_by_step: ['Alterna sfoglie, ragù e besciamella in una teglia.', 'Ripeti gli strati fino a esaurimento ingredienti.', 'Termina con besciamella e parmigiano abbondante.', 'Cuoci in forno a 200 gradi per 30 minuti.', 'Lascia riposare 5 minuti prima di servire.'] },

  { nome: 'Pasta e fagioli', nome_ricerca: 'Pasta e fagioli', descrizione_breve: 'Piatto unico casalingo, nutriente ed economico.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🍲', tags: ['glutine'],
    lista_spesa: [{ prodotto: 'Pasta corta', quantita: '300g', prezzo_stimato_euro: 0.69 }, { prodotto: 'Fagioli borlotti in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 }, { prodotto: 'Passata di pomodoro', quantita: '300g', prezzo_stimato_euro: 0.60 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Sedano e carota', quantita: '1 confezione', prezzo_stimato_euro: 0.90 }],
    totale_stimato_euro: 4.29,
    preparazione_step_by_step: ['Soffriggi cipolla, sedano e carota.', 'Aggiungi metà fagioli frullati e metà interi.', 'Unisci la passata e un po di acqua.', 'Cuoci la pasta direttamente nel sugo.', 'Servi caldo con un filo di olio.'] },

  { nome: 'Minestrone di verdure', nome_ricerca: 'Minestrone di verdure', descrizione_breve: 'Zuppa di verdure miste, leggera e confortevole.', tempo_preparazione_minuti: 40, difficolta: 'Facile', emoji: '🥕', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Verdure miste surgelate per minestrone', quantita: '1kg', prezzo_stimato_euro: 2.20 }, { prodotto: 'Patate', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Passata di pomodoro', quantita: '200g', prezzo_stimato_euro: 0.40 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.60,
    preparazione_step_by_step: ['Metti le verdure in una pentola con acqua.', 'Aggiungi le patate a cubetti e la passata.', 'Cuoci a fuoco medio per 30 minuti.', 'Aggiusta di sale e pepe.', 'Servi caldo con un filo di olio.'] },

  { nome: 'Zuppa di lenticchie', nome_ricerca: 'Zuppa di lenticchie', descrizione_breve: 'Zuppa proteica e saziante, perfetta per le sere fredde.', tempo_preparazione_minuti: 35, difficolta: 'Facile', emoji: '🥣', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Lenticchie secche', quantita: '400g', prezzo_stimato_euro: 1.29 }, { prodotto: 'Passata di pomodoro', quantita: '200g', prezzo_stimato_euro: 0.40 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Sedano e carota', quantita: '1 confezione', prezzo_stimato_euro: 0.90 }],
    totale_stimato_euro: 2.89,
    preparazione_step_by_step: ['Soffriggi cipolla, sedano e carota.', 'Aggiungi le lenticchie e la passata.', 'Copri con acqua e porta a bollore.', 'Cuoci a fuoco basso per 25 minuti.', 'Aggiusta di sale e servi calda.'] },

  { nome: 'Orecchiette con broccoli', nome_ricerca: 'Orecchiette con cime di rapa', descrizione_breve: 'Primo pugliese con orecchiette, broccoli e aglio.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🥦', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Orecchiette', quantita: '500g', prezzo_stimato_euro: 1.19 }, { prodotto: 'Broccoli', quantita: '1 pezzo', prezzo_stimato_euro: 1.50 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Peperoncino', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 3.39,
    preparazione_step_by_step: ['Cuoci i broccoli a cimette in acqua salata.', 'Nella stessa acqua cuoci le orecchiette.', 'Soffriggi aglio e peperoncino in olio.', 'Scola pasta e broccoli insieme.', 'Salta tutto in padella e servi.'] },

  { nome: 'Spaghetti alle vongole surgelate', nome_ricerca: 'Spaghetti alle vongole', descrizione_breve: 'Primo di mare pratico con vongole surgelate già pulite.', tempo_preparazione_minuti: 20, difficolta: 'Media', emoji: '🦪', tags: ['glutine', 'pesce'],
    lista_spesa: [{ prodotto: 'Spaghetti', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Vongole surgelate sgusciate', quantita: '400g', prezzo_stimato_euro: 4.50 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Prezzemolo', quantita: '1 mazzetto', prezzo_stimato_euro: 0.90 }],
    totale_stimato_euro: 6.79,
    preparazione_step_by_step: ['Cuoci gli spaghetti in acqua salata.', 'Soffriggi aglio in olio e aggiungi le vongole scongelate.', 'Cuoci le vongole pochi minuti a fuoco vivo.', 'Scola la pasta e uniscila alle vongole.', 'Aggiungi prezzemolo fresco e servi.'] },

  { nome: 'Pasta con salsiccia e funghi', nome_ricerca: 'Pasta con salsiccia e funghi', descrizione_breve: 'Primo saporito con salsiccia sbriciolata e funghi.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🍄', tags: ['glutine'],
    lista_spesa: [{ prodotto: 'Pasta', quantita: '500g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Salsiccia', quantita: '300g', prezzo_stimato_euro: 2.90 }, { prodotto: 'Funghi champignon', quantita: '300g', prezzo_stimato_euro: 2.00 }, { prodotto: 'Panna da cucina', quantita: '200ml', prezzo_stimato_euro: 1.10 }],
    totale_stimato_euro: 6.99,
    preparazione_step_by_step: ['Sbriciola la salsiccia in padella.', 'Aggiungi i funghi tagliati e cuoci insieme.', 'Sfuma con la panna e cuoci qualche minuto.', 'Cuoci la pasta in acqua salata.', 'Scola e manteca con il condimento.'] },

  { nome: 'Polpette al sugo', nome_ricerca: 'Polpette al sugo', descrizione_breve: 'Polpette di carne classiche in sugo di pomodoro.', tempo_preparazione_minuti: 45, difficolta: 'Media', emoji: '🍖', tags: ['uova', 'glutine'],
    lista_spesa: [{ prodotto: 'Carne macinata mista', quantita: '500g', prezzo_stimato_euro: 4.50 }, { prodotto: 'Uova', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Pangrattato', quantita: '100g', prezzo_stimato_euro: 0.79 }, { prodotto: 'Passata di pomodoro', quantita: '700g', prezzo_stimato_euro: 0.89 }],
    totale_stimato_euro: 6.48,
    preparazione_step_by_step: ['Mescola carne, uova e pangrattato con sale.', 'Forma delle piccole polpette.', 'Rosolale in padella con un filo di olio.', 'Aggiungi la passata e cuoci a fuoco basso 25 minuti.', 'Servi calde con il sugo.'] },

  { nome: 'Bistecca ai ferri con insalata', nome_ricerca: 'Bistecca ai ferri', descrizione_breve: 'Secondo veloce e proteico con bistecca e insalata fresca.', tempo_preparazione_minuti: 15, difficolta: 'Facile', emoji: '🥩', tags: ['senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Bistecca di manzo', quantita: '500g', prezzo_stimato_euro: 6.50 }, { prodotto: 'Insalata mista', quantita: '1 busta', prezzo_stimato_euro: 1.20 }, { prodotto: 'Pomodori', quantita: '2 pezzi', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 8.70,
    preparazione_step_by_step: ['Scalda bene una padella o griglia.', 'Cuoci la bistecca pochi minuti per lato.', 'Sala solo a cottura ultimata.', 'Prepara insalata e pomodori come contorno.', 'Servi la bistecca a fette con il contorno.'] },

  { nome: 'Hamburger di manzo con patate', nome_ricerca: 'Hamburger di manzo', descrizione_breve: 'Hamburger casalingo con patate al forno.', tempo_preparazione_minuti: 35, difficolta: 'Facile', emoji: '🍔', tags: ['glutine', 'lattosio'],
    lista_spesa: [{ prodotto: 'Hamburger di manzo', quantita: '4 pezzi', prezzo_stimato_euro: 3.50 }, { prodotto: 'Panini per hamburger', quantita: '4 pezzi', prezzo_stimato_euro: 1.50 }, { prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 }, { prodotto: 'Formaggio a fette', quantita: '4 fette', prezzo_stimato_euro: 1.20 }],
    totale_stimato_euro: 7.70,
    preparazione_step_by_step: ['Taglia le patate a spicchi e condiscile.', 'Cuoci le patate in forno a 200 gradi.', 'Cuoci gli hamburger in padella pochi minuti per lato.', 'Aggiungi il formaggio a fine cottura.', 'Componi i panini e servi con le patate.'] },

  { nome: 'Salmone al forno con verdure', nome_ricerca: 'Salmone al forno con verdure', descrizione_breve: 'Secondo leggero con salmone e verdure di stagione.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🐟', tags: ['pesce', 'senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Filetti di salmone', quantita: '2 pezzi', prezzo_stimato_euro: 5.50 }, { prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Patate', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Limone', quantita: '1 pezzo', prezzo_stimato_euro: 0.50 }],
    totale_stimato_euro: 8.30,
    preparazione_step_by_step: ['Taglia patate e zucchine a fette.', 'Disponi verdure e salmone in una teglia.', 'Condisci con olio, limone e sale.', 'Cuoci in forno a 200 gradi per 20 minuti.', 'Servi caldo appena sfornato.'] },

  { nome: 'Merluzzo in padella con piselli', nome_ricerca: 'Merluzzo con piselli', descrizione_breve: 'Secondo di pesce leggero con piselli e pomodoro.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🐠', tags: ['pesce', 'senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Filetti di merluzzo', quantita: '400g', prezzo_stimato_euro: 4.20 }, { prodotto: 'Piselli surgelati', quantita: '300g', prezzo_stimato_euro: 1.20 }, { prodotto: 'Passata di pomodoro', quantita: '200g', prezzo_stimato_euro: 0.40 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 6.10,
    preparazione_step_by_step: ['Soffriggi la cipolla in padella.', 'Aggiungi passata e piselli, cuoci 10 minuti.', 'Adagia il merluzzo nel sugo.', 'Cuoci coperto a fuoco basso per 10 minuti.', 'Servi caldo con il sugo di piselli.'] },

  { nome: 'Frittata di patate', nome_ricerca: 'Frittata di patate', descrizione_breve: 'Frittata rustica con patate, ottima calda o fredda.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🥔', tags: ['uova', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Uova', quantita: '6 pezzi', prezzo_stimato_euro: 2.20 }, { prodotto: 'Patate', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.80,
    preparazione_step_by_step: ['Taglia le patate a fette sottili.', 'Cuocile in padella con olio finché morbide.', 'Sbatti le uova con sale e pepe.', 'Unisci le patate alle uova.', 'Cuoci la frittata da entrambi i lati.'] },

  { nome: 'Uova in camicia con avocado toast', nome_ricerca: 'Uova in camicia avocado toast', descrizione_breve: 'Piatto brunch veloce con uova, avocado e pane tostato.', tempo_preparazione_minuti: 15, difficolta: 'Media', emoji: '🥑', tags: ['uova', 'glutine'],
    lista_spesa: [{ prodotto: 'Uova', quantita: '4 pezzi', prezzo_stimato_euro: 1.50 }, { prodotto: 'Avocado', quantita: '2 pezzi', prezzo_stimato_euro: 2.60 }, { prodotto: 'Pane in cassetta', quantita: '1 confezione', prezzo_stimato_euro: 1.60 }, { prodotto: 'Limone', quantita: '1 pezzo', prezzo_stimato_euro: 0.50 }],
    totale_stimato_euro: 6.20,
    preparazione_step_by_step: ['Tosta le fette di pane.', 'Schiaccia l avocado con limone, sale e pepe.', 'Cuoci le uova in acqua bollente con aceto per 3 minuti.', 'Spalma l avocado sul pane tostato.', 'Adagia l uovo in camicia sopra e servi.'] },

  { nome: 'Parmigiana di melanzane', nome_ricerca: 'Parmigiana di melanzane', descrizione_breve: 'Classico piatto vegetariano al forno con melanzane e mozzarella.', tempo_preparazione_minuti: 50, difficolta: 'Media', emoji: '🍆', tags: ['lattosio', 'glutine'],
    lista_spesa: [{ prodotto: 'Melanzane', quantita: '3 pezzi', prezzo_stimato_euro: 2.40 }, { prodotto: 'Mozzarella', quantita: '2 pezzi', prezzo_stimato_euro: 2.40 }, { prodotto: 'Passata di pomodoro', quantita: '500g', prezzo_stimato_euro: 0.79 }, { prodotto: 'Parmigiano grattugiato', quantita: '100g', prezzo_stimato_euro: 1.99 }],
    totale_stimato_euro: 7.58,
    preparazione_step_by_step: ['Taglia le melanzane a fette e grigliale.', 'Alterna melanzane, passata e mozzarella in una teglia.', 'Ripeti gli strati fino a esaurimento.', 'Termina con parmigiano abbondante.', 'Cuoci in forno a 190 gradi per 25 minuti.'] },

  { nome: 'Peperonata', nome_ricerca: 'Peperonata', descrizione_breve: 'Contorno o piatto unico con peperoni, cipolla e pomodoro.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🫑', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Peperoni', quantita: '4 pezzi', prezzo_stimato_euro: 3.20 }, { prodotto: 'Cipolla', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Passata di pomodoro', quantita: '200g', prezzo_stimato_euro: 0.40 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 4.60,
    preparazione_step_by_step: ['Taglia peperoni e cipolla a listarelle.', 'Soffriggi la cipolla in olio.', 'Aggiungi i peperoni e cuoci qualche minuto.', 'Unisci la passata e cuoci coperto 20 minuti.', 'Servi calda o tiepida.'] },

  { nome: 'Caprese di pomodori e mozzarella', nome_ricerca: 'Insalata caprese', descrizione_breve: 'Antipasto o cena leggera fresca e veloce.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🍅', tags: ['lattosio'],
    lista_spesa: [{ prodotto: 'Pomodori', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Mozzarella', quantita: '2 pezzi', prezzo_stimato_euro: 2.40 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 5.80,
    preparazione_step_by_step: ['Taglia pomodori e mozzarella a fette.', 'Alternali su un piatto da portata.', 'Aggiungi foglie di basilico fresco.', 'Condisci con olio, sale e origano.', 'Servi a temperatura ambiente.'] },

  { nome: 'Insalata greca', nome_ricerca: 'Insalata greca', descrizione_breve: 'Insalata fresca con feta, olive e cetrioli.', tempo_preparazione_minuti: 15, difficolta: 'Facile', emoji: '🫒', tags: ['lattosio'],
    lista_spesa: [{ prodotto: 'Feta', quantita: '200g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Cetrioli', quantita: '2 pezzi', prezzo_stimato_euro: 1.20 }, { prodotto: 'Pomodori', quantita: '3 pezzi', prezzo_stimato_euro: 1.50 }, { prodotto: 'Olive', quantita: '150g', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 6.40,
    preparazione_step_by_step: ['Taglia cetrioli e pomodori a pezzi.', 'Aggiungi le olive intere.', 'Sbriciola la feta sopra le verdure.', 'Condisci con olio e origano.', 'Mescola delicatamente e servi.'] },

  { nome: 'Insalata di farro', nome_ricerca: 'Insalata di farro', descrizione_breve: 'Piatto unico estivo con farro e verdure croccanti.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🌾', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Farro', quantita: '400g', prezzo_stimato_euro: 1.49 }, { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }, { prodotto: 'Zucchine', quantita: '1 pezzo', prezzo_stimato_euro: 0.70 }, { prodotto: 'Olive', quantita: '100g', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 4.79,
    preparazione_step_by_step: ['Cuoci il farro in acqua salata.', 'Taglia pomodorini e zucchine crude a cubetti.', 'Scola e raffredda il farro.', 'Unisci le verdure e le olive.', 'Condisci con olio e servi fresca.'] },

  { nome: 'Insalata di riso estiva', nome_ricerca: 'Insalata di riso', descrizione_breve: 'Classica insalata di riso fredda con verdure e wurstel.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🍚', tags: ['senza_glutine'],
    lista_spesa: [{ prodotto: 'Riso', quantita: '400g', prezzo_stimato_euro: 1.19 }, { prodotto: 'Wurstel', quantita: '4 pezzi', prezzo_stimato_euro: 1.80 }, { prodotto: 'Mais', quantita: '1 lattina', prezzo_stimato_euro: 0.90 }, { prodotto: 'Olive', quantita: '100g', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 4.89,
    preparazione_step_by_step: ['Cuoci il riso e raffredda sotto acqua fredda.', 'Taglia i wurstel a rondelle.', 'Unisci riso, wurstel, mais e olive.', 'Condisci con olio e un pizzico di sale.', 'Lascia riposare in frigo prima di servire.'] },

  { nome: 'Panzanella', nome_ricerca: 'Panzanella toscana', descrizione_breve: 'Piatto estivo toscano con pane raffermo e verdure.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🍞', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Pane raffermo', quantita: '300g', prezzo_stimato_euro: 0.90 }, { prodotto: 'Pomodori', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Cetrioli', quantita: '1 pezzo', prezzo_stimato_euro: 0.60 }, { prodotto: 'Cipolla rossa', quantita: '1 pezzo', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.90,
    preparazione_step_by_step: ['Ammolla il pane in acqua e strizzalo bene.', 'Sbriciola il pane in una ciotola.', 'Aggiungi pomodori, cetrioli e cipolla a pezzi.', 'Condisci con olio, sale e aceto.', 'Lascia riposare 10 minuti e servi fresca.'] },

  { nome: 'Bruschette al pomodoro', nome_ricerca: 'Bruschetta al pomodoro', descrizione_breve: 'Antipasto o cena leggera velocissima da preparare.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🍅', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Pane casereccio', quantita: '1 filone', prezzo_stimato_euro: 1.50 }, { prodotto: 'Pomodori', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 4.90,
    preparazione_step_by_step: ['Taglia il pane a fette e tostalo.', 'Strofina uno spicchio di aglio sul pane caldo.', 'Taglia i pomodori a cubetti piccoli.', 'Condisci i pomodori con olio, sale e basilico.', 'Distribuisci sopra il pane e servi subito.'] },

  { nome: 'Involtini di pollo al prosciutto', nome_ricerca: 'Involtini di pollo', descrizione_breve: 'Secondo saporito con pollo, prosciutto e formaggio.', tempo_preparazione_minuti: 30, difficolta: 'Media', emoji: '🍗', tags: ['lattosio'],
    lista_spesa: [{ prodotto: 'Fettine di pollo', quantita: '500g', prezzo_stimato_euro: 4.20 }, { prodotto: 'Prosciutto cotto', quantita: '100g', prezzo_stimato_euro: 1.80 }, { prodotto: 'Formaggio a fette', quantita: '4 fette', prezzo_stimato_euro: 1.20 }, { prodotto: 'Vino bianco', quantita: '100ml', prezzo_stimato_euro: 0.80 }],
    totale_stimato_euro: 8.00,
    preparazione_step_by_step: ['Adagia prosciutto e formaggio su ogni fettina.', 'Arrotola e chiudi con uno stuzzicadenti.', 'Rosola gli involtini in padella con olio.', 'Sfuma con il vino bianco.', 'Cuoci coperto per 10 minuti e servi.'] },

  { nome: 'Spezzatino di manzo con patate', nome_ricerca: 'Spezzatino di manzo con patate', descrizione_breve: 'Secondo casalingo lungo da cuocere ma economico.', tempo_preparazione_minuti: 70, difficolta: 'Media', emoji: '🥘', tags: ['senza_glutine', 'senza_lattosio'],
    lista_spesa: [{ prodotto: 'Carne di manzo per spezzatino', quantita: '600g', prezzo_stimato_euro: 5.50 }, { prodotto: 'Patate', quantita: '1kg', prezzo_stimato_euro: 1.50 }, { prodotto: 'Passata di pomodoro', quantita: '300g', prezzo_stimato_euro: 0.60 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 7.90,
    preparazione_step_by_step: ['Rosola la carne a cubetti in olio.', 'Aggiungi la cipolla tritata e fai appassire.', 'Unisci la passata e copri con acqua calda.', 'Cuoci a fuoco basso per 40 minuti.', 'Aggiungi le patate e cuoci altri 20 minuti.'] },

  { nome: 'Cotoletta di pollo con purè', nome_ricerca: 'Cotoletta di pollo', descrizione_breve: 'Cotoletta impanata e croccante con purè di patate.', tempo_preparazione_minuti: 35, difficolta: 'Facile', emoji: '🍗', tags: ['glutine', 'uova', 'lattosio'],
    lista_spesa: [{ prodotto: 'Fettine di pollo', quantita: '500g', prezzo_stimato_euro: 4.20 }, { prodotto: 'Pangrattato', quantita: '200g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Uova', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Purè istantaneo', quantita: '1 confezione', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 7.29,
    preparazione_step_by_step: ['Passa il pollo nell uovo sbattuto.', 'Impana bene nel pangrattato.', 'Friggi o cuoci in padella con olio.', 'Prepara il purè seguendo le istruzioni.', 'Servi la cotoletta calda con il purè.'] },

  { nome: 'Filetto di platessa impanato', nome_ricerca: 'Filetto di platessa impanato', descrizione_breve: 'Pesce impanato croccante con insalata di contorno.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🐟', tags: ['glutine', 'uova', 'pesce'],
    lista_spesa: [{ prodotto: 'Filetti di platessa', quantita: '400g', prezzo_stimato_euro: 3.50 }, { prodotto: 'Pangrattato', quantita: '150g', prezzo_stimato_euro: 0.79 }, { prodotto: 'Uova', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Insalata mista', quantita: '1 busta', prezzo_stimato_euro: 1.20 }],
    totale_stimato_euro: 6.09,
    preparazione_step_by_step: ['Passa i filetti nell uovo sbattuto.', 'Impana nel pangrattato su entrambi i lati.', 'Cuoci in padella con olio finché dorati.', 'Prepara l insalata come contorno.', 'Servi il pesce caldo con l insalata.'] },

  { nome: 'Zuppa di ceci e pasta', nome_ricerca: 'Pasta e ceci', descrizione_breve: 'Piatto unico casalingo con ceci e pasta corta.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🍲', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 }, { prodotto: 'Pasta corta', quantita: '250g', prezzo_stimato_euro: 0.59 }, { prodotto: 'Passata di pomodoro', quantita: '200g', prezzo_stimato_euro: 0.40 }, { prodotto: 'Rosmarino', quantita: '1 rametto', prezzo_stimato_euro: 0.80 }],
    totale_stimato_euro: 3.59,
    preparazione_step_by_step: ['Soffriggi aglio e rosmarino in olio.', 'Aggiungi i ceci e la passata.', 'Copri con acqua e porta a bollore.', 'Cuoci la pasta direttamente nella zuppa.', 'Servi calda con un filo di olio.'] },

  { nome: 'Vellutata di zucca', nome_ricerca: 'Vellutata di zucca', descrizione_breve: 'Crema calda e avvolgente perfetta in autunno.', tempo_preparazione_minuti: 35, difficolta: 'Facile', emoji: '🎃', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Zucca a cubetti', quantita: '800g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Patate', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Cipolla', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.50,
    preparazione_step_by_step: ['Soffriggi la cipolla in una pentola.', 'Aggiungi zucca e patate a pezzi.', 'Copri con acqua e cuoci 25 minuti.', 'Frulla tutto fino a ottenere una crema liscia.', 'Servi calda con un filo di olio.'] },

  { nome: 'Torta salata con zucchine', nome_ricerca: 'Torta salata con zucchine', descrizione_breve: 'Torta salata pratica con pasta sfoglia e zucchine.', tempo_preparazione_minuti: 40, difficolta: 'Facile', emoji: '🥧', tags: ['glutine', 'uova', 'lattosio'],
    lista_spesa: [{ prodotto: 'Pasta sfoglia', quantita: '1 rotolo', prezzo_stimato_euro: 1.29 }, { prodotto: 'Zucchine', quantita: '3 pezzi', prezzo_stimato_euro: 2.10 }, { prodotto: 'Uova', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Formaggio grattugiato', quantita: '100g', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 5.79,
    preparazione_step_by_step: ['Taglia le zucchine a rondelle sottili.', 'Sbatti le uova con formaggio e sale.', 'Stendi la pasta sfoglia in una teglia.', 'Versa il composto di uova e distribuisci le zucchine.', 'Cuoci in forno a 190 gradi per 30 minuti.'] },

  { nome: 'Quiche ai porri', nome_ricerca: 'Quiche ai porri', descrizione_breve: 'Torta salata francese con porri e formaggio.', tempo_preparazione_minuti: 45, difficolta: 'Media', emoji: '🥧', tags: ['glutine', 'uova', 'lattosio'],
    lista_spesa: [{ prodotto: 'Pasta brisée', quantita: '1 rotolo', prezzo_stimato_euro: 1.29 }, { prodotto: 'Porri', quantita: '2 pezzi', prezzo_stimato_euro: 1.60 }, { prodotto: 'Uova', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Panna da cucina', quantita: '200ml', prezzo_stimato_euro: 1.10 }],
    totale_stimato_euro: 4.89,
    preparazione_step_by_step: ['Affetta e stufa i porri in padella.', 'Sbatti le uova con la panna e un pizzico di sale.', 'Stendi la pasta brisée in una teglia.', 'Distribuisci i porri e versa il composto di uova.', 'Cuoci in forno a 180 gradi per 30 minuti.'] },

  { nome: 'Falafel con hummus', nome_ricerca: 'Falafel con hummus', descrizione_breve: 'Piatto vegano mediorientale con falafel e hummus.', tempo_preparazione_minuti: 30, difficolta: 'Media', emoji: '🧆', tags: ['vegano', 'glutine'],
    lista_spesa: [{ prodotto: 'Falafel surgelati', quantita: '1 confezione', prezzo_stimato_euro: 2.50 }, { prodotto: 'Hummus pronto', quantita: '1 vasetto', prezzo_stimato_euro: 1.99 }, { prodotto: 'Pane pita', quantita: '1 confezione', prezzo_stimato_euro: 1.20 }, { prodotto: 'Insalata mista', quantita: '1 busta', prezzo_stimato_euro: 1.20 }],
    totale_stimato_euro: 6.89,
    preparazione_step_by_step: ['Cuoci i falafel in forno o padella secondo confezione.', 'Scalda leggermente il pane pita.', 'Spalma l hummus sul pane.', 'Aggiungi falafel e insalata.', 'Chiudi il pita e servi subito.'] },

  { nome: 'Curry di ceci e spinaci', nome_ricerca: 'Curry di ceci e spinaci', descrizione_breve: 'Piatto vegano speziato con ceci, spinaci e latte di cocco.', tempo_preparazione_minuti: 30, difficolta: 'Media', emoji: '🍛', tags: ['vegano', 'senza_glutine'],
    lista_spesa: [{ prodotto: 'Ceci in barattolo', quantita: '2 confezioni', prezzo_stimato_euro: 1.80 }, { prodotto: 'Spinaci surgelati', quantita: '300g', prezzo_stimato_euro: 1.20 }, { prodotto: 'Latte di cocco', quantita: '400ml', prezzo_stimato_euro: 1.49 }, { prodotto: 'Curry in polvere', quantita: 'q.b.', prezzo_stimato_euro: 0.60 }, { prodotto: 'Riso', quantita: '300g', prezzo_stimato_euro: 0.99 }],
    totale_stimato_euro: 6.08,
    preparazione_step_by_step: ['Soffriggi il curry in olio per un minuto.', 'Aggiungi ceci e spinaci scongelati.', 'Versa il latte di cocco e mescola.', 'Cuoci a fuoco basso per 15 minuti.', 'Servi caldo con riso basmati.'] },

  { nome: 'Pancake allo yogurt', nome_ricerca: 'Pancake allo yogurt', descrizione_breve: 'Pancake soffici perfetti per colazione o merenda.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🥞', tags: ['uova', 'lattosio', 'glutine'], pasti: ['colazione', 'merenda'],
    lista_spesa: [{ prodotto: 'Farina', quantita: '250g', prezzo_stimato_euro: 0.59 }, { prodotto: 'Uova', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Yogurt bianco', quantita: '1 vasetto', prezzo_stimato_euro: 0.50 }, { prodotto: 'Miele', quantita: 'q.b.', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 3.19,
    preparazione_step_by_step: ['Mescola farina, uova e yogurt fino a un composto liscio.', 'Scalda una padella antiaderente.', 'Versa piccole quantità di composto e cuoci finché si formano bolle.', 'Gira e cuoci l\'altro lato.', 'Servi caldi con miele o marmellata.'] },

  { nome: 'Toast con marmellata e burro', nome_ricerca: 'Toast marmellata e burro', descrizione_breve: 'Colazione classica e velocissima.', tempo_preparazione_minuti: 5, difficolta: 'Facile', emoji: '🍞', tags: ['glutine', 'lattosio'], pasti: ['colazione'],
    lista_spesa: [{ prodotto: 'Pane in cassetta', quantita: '1 confezione', prezzo_stimato_euro: 1.60 }, { prodotto: 'Burro', quantita: '125g', prezzo_stimato_euro: 1.20 }, { prodotto: 'Marmellata', quantita: '1 vasetto', prezzo_stimato_euro: 1.80 }],
    totale_stimato_euro: 4.60,
    preparazione_step_by_step: ['Tosta le fette di pane.', 'Spalma il burro ancora caldo.', 'Aggiungi la marmellata a piacere.', 'Servi subito.'] },

  { nome: 'Porridge di avena con frutta', nome_ricerca: 'Porridge di avena', descrizione_breve: 'Colazione energetica e vegana con avena e frutta fresca.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🥣', tags: ['vegano', 'senza_glutine'], pasti: ['colazione'],
    lista_spesa: [{ prodotto: 'Fiocchi di avena', quantita: '250g', prezzo_stimato_euro: 1.29 }, { prodotto: 'Latte vegetale', quantita: '500ml', prezzo_stimato_euro: 1.19 }, { prodotto: 'Banana', quantita: '2 pezzi', prezzo_stimato_euro: 0.80 }, { prodotto: 'Miele', quantita: 'q.b.', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 4.78,
    preparazione_step_by_step: ['Scalda il latte vegetale in un pentolino.', 'Aggiungi i fiocchi di avena e cuoci 5 minuti mescolando.', 'Versa in una ciotola.', 'Aggiungi banana a fette e un filo di miele.', 'Servi caldo o tiepido.'] },

  { nome: 'Muffin ai mirtilli', nome_ricerca: 'Muffin ai mirtilli', descrizione_breve: 'Dolcetti soffici perfetti per colazione o merenda.', tempo_preparazione_minuti: 35, difficolta: 'Media', emoji: '🧁', tags: ['uova', 'lattosio', 'glutine'], pasti: ['colazione', 'merenda', 'dolce'],
    lista_spesa: [{ prodotto: 'Farina', quantita: '250g', prezzo_stimato_euro: 0.59 }, { prodotto: 'Uova', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Zucchero', quantita: '150g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Mirtilli surgelati', quantita: '200g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Burro', quantita: '100g', prezzo_stimato_euro: 0.95 }],
    totale_stimato_euro: 5.33,
    preparazione_step_by_step: ['Monta uova e zucchero fino a schiuma chiara.', 'Aggiungi burro fuso e farina setacciata.', 'Incorpora delicatamente i mirtilli.', 'Versa negli stampini per muffin.', 'Cuoci in forno a 180 gradi per 20 minuti.'] },

  { nome: 'Uova strapazzate con toast', nome_ricerca: 'Uova strapazzate', descrizione_breve: 'Colazione salata proteica, pronta in pochi minuti.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🍳', tags: ['uova', 'glutine', 'lattosio'], pasti: ['colazione'],
    lista_spesa: [{ prodotto: 'Uova', quantita: '4 pezzi', prezzo_stimato_euro: 1.50 }, { prodotto: 'Burro', quantita: '20g', prezzo_stimato_euro: 0.30 }, { prodotto: 'Pane in cassetta', quantita: '1 confezione', prezzo_stimato_euro: 1.60 }],
    totale_stimato_euro: 3.40,
    preparazione_step_by_step: ['Sbatti le uova con sale e pepe.', 'Sciogli il burro in padella a fuoco basso.', 'Versa le uova e mescola continuamente.', 'Togli dal fuoco quando ancora morbide.', 'Servi con il pane tostato.'] },

  { nome: 'Plumcake allo yogurt', nome_ricerca: 'Plumcake allo yogurt', descrizione_breve: 'Torta soffice da colazione o merenda, semplice da preparare.', tempo_preparazione_minuti: 45, difficolta: 'Facile', emoji: '🍰', tags: ['uova', 'lattosio', 'glutine'], pasti: ['merenda', 'colazione', 'dolce'],
    lista_spesa: [{ prodotto: 'Farina', quantita: '300g', prezzo_stimato_euro: 0.69 }, { prodotto: 'Yogurt bianco', quantita: '1 vasetto', prezzo_stimato_euro: 0.50 }, { prodotto: 'Uova', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Zucchero', quantita: '150g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Olio di semi', quantita: '100ml', prezzo_stimato_euro: 0.80 }],
    totale_stimato_euro: 3.88,
    preparazione_step_by_step: ['Monta uova e zucchero fino a ottenere una crema chiara.', 'Aggiungi yogurt e olio, mescola bene.', 'Incorpora la farina setacciata poco alla volta.', 'Versa in uno stampo da plumcake.', 'Cuoci in forno a 180 gradi per 35 minuti.'] },

  { nome: 'Frullato di frutta', nome_ricerca: 'Frullato di frutta fresca', descrizione_breve: 'Merenda fresca, veloce e completamente vegana.', tempo_preparazione_minuti: 5, difficolta: 'Facile', emoji: '🥤', tags: ['vegano', 'senza_glutine'], pasti: ['merenda', 'colazione'],
    lista_spesa: [{ prodotto: 'Banana', quantita: '2 pezzi', prezzo_stimato_euro: 0.80 }, { prodotto: 'Fragole surgelate', quantita: '200g', prezzo_stimato_euro: 1.50 }, { prodotto: 'Latte vegetale', quantita: '500ml', prezzo_stimato_euro: 1.19 }],
    totale_stimato_euro: 3.49,
    preparazione_step_by_step: ['Taglia la banana a pezzi.', 'Metti tutto nel frullatore.', 'Frulla fino a ottenere un composto liscio.', 'Versa in un bicchiere e servi subito.'] },

  { nome: 'Crostatine alla marmellata', nome_ricerca: 'Crostatine alla marmellata', descrizione_breve: 'Piccoli dolci da forno per merenda o colazione.', tempo_preparazione_minuti: 30, difficolta: 'Facile', emoji: '🥧', tags: ['uova', 'lattosio', 'glutine'], pasti: ['merenda', 'dolce'],
    lista_spesa: [{ prodotto: 'Pasta frolla pronta', quantita: '1 rotolo', prezzo_stimato_euro: 1.49 }, { prodotto: 'Marmellata', quantita: '1 vasetto', prezzo_stimato_euro: 1.80 }, { prodotto: 'Uova', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 3.59,
    preparazione_step_by_step: ['Taglia la pasta frolla in dischi.', 'Adagiali negli stampini per crostatine.', 'Riempi con la marmellata.', 'Spennella i bordi con uovo sbattuto.', 'Cuoci in forno a 180 gradi per 20 minuti.'] },

  { nome: 'Pane e nutella', nome_ricerca: 'Pane e nutella', descrizione_breve: 'La merenda più amata, pronta in un minuto.', tempo_preparazione_minuti: 2, difficolta: 'Facile', emoji: '🍫', tags: ['glutine', 'frutta_guscio', 'lattosio'], pasti: ['merenda'],
    lista_spesa: [{ prodotto: 'Pane casereccio', quantita: '1 filone', prezzo_stimato_euro: 1.50 }, { prodotto: 'Crema di nocciole', quantita: '1 vasetto', prezzo_stimato_euro: 2.99 }],
    totale_stimato_euro: 4.49,
    preparazione_step_by_step: ['Taglia una fetta di pane.', 'Spalma la crema di nocciole.', 'Servi subito.'] },

  { nome: 'Tiramisù veloce', nome_ricerca: 'Tiramisù', descrizione_breve: 'Il dolce al cucchiaio italiano più famoso, versione semplificata.', tempo_preparazione_minuti: 25, difficolta: 'Media', emoji: '☕', tags: ['uova', 'lattosio', 'glutine'], pasti: ['dolce'],
    lista_spesa: [{ prodotto: 'Savoiardi', quantita: '1 confezione', prezzo_stimato_euro: 1.79 }, { prodotto: 'Mascarpone', quantita: '250g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Uova', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Caffè', quantita: '1 moka', prezzo_stimato_euro: 0.50 }, { prodotto: 'Cacao amaro', quantita: 'q.b.', prezzo_stimato_euro: 0.80 }],
    totale_stimato_euro: 6.19,
    preparazione_step_by_step: ['Prepara il caffè e lascialo raffreddare.', 'Monta i tuorli con lo zucchero, poi unisci il mascarpone.', 'Monta gli albumi a neve e incorporali delicatamente.', 'Inzuppa i savoiardi nel caffè e fai uno strato.', 'Ricopri con la crema, ripeti gli strati e spolvera di cacao.'] },

  { nome: 'Torta di mele', nome_ricerca: 'Torta di mele', descrizione_breve: 'Dolce casalingo semplice e profumato.', tempo_preparazione_minuti: 50, difficolta: 'Facile', emoji: '🍎', tags: ['uova', 'lattosio', 'glutine'], pasti: ['dolce', 'merenda'],
    lista_spesa: [{ prodotto: 'Farina', quantita: '300g', prezzo_stimato_euro: 0.69 }, { prodotto: 'Mele', quantita: '4 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Uova', quantita: '3 pezzi', prezzo_stimato_euro: 0.90 }, { prodotto: 'Zucchero', quantita: '150g', prezzo_stimato_euro: 0.99 }, { prodotto: 'Burro', quantita: '100g', prezzo_stimato_euro: 0.95 }],
    totale_stimato_euro: 5.53,
    preparazione_step_by_step: ['Sbuccia e taglia le mele a fettine sottili.', 'Monta uova e zucchero, aggiungi burro fuso.', 'Incorpora la farina setacciata.', 'Versa in uno stampo e disponi le mele sopra.', 'Cuoci in forno a 180 gradi per 40 minuti.'] },

  { nome: 'Budino al cioccolato', nome_ricerca: 'Budino al cioccolato', descrizione_breve: 'Dessert cremoso e goloso, facile da preparare.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🍫', tags: ['lattosio'], pasti: ['dolce'],
    lista_spesa: [{ prodotto: 'Latte', quantita: '500ml', prezzo_stimato_euro: 0.89 }, { prodotto: 'Cioccolato fondente', quantita: '150g', prezzo_stimato_euro: 1.99 }, { prodotto: 'Amido di mais', quantita: '30g', prezzo_stimato_euro: 0.60 }, { prodotto: 'Zucchero', quantita: '80g', prezzo_stimato_euro: 0.99 }],
    totale_stimato_euro: 4.47,
    preparazione_step_by_step: ['Sciogli il cioccolato a bagnomaria.', 'Scalda il latte con zucchero e amido sciolto.', 'Unisci il cioccolato fuso e mescola bene.', 'Cuoci finché si addensa, mescolando spesso.', 'Versa in coppette e lascia raffreddare in frigo.'] },

  { nome: 'Crostata alla marmellata', nome_ricerca: 'Crostata alla marmellata', descrizione_breve: 'Il dolce della tradizione italiana, semplice e genuino.', tempo_preparazione_minuti: 40, difficolta: 'Facile', emoji: '🥧', tags: ['uova', 'lattosio', 'glutine'], pasti: ['dolce', 'merenda'],
    lista_spesa: [{ prodotto: 'Pasta frolla pronta', quantita: '1 rotolo', prezzo_stimato_euro: 1.49 }, { prodotto: 'Marmellata', quantita: '1 vasetto grande', prezzo_stimato_euro: 2.50 }, { prodotto: 'Uova', quantita: '1 pezzo', prezzo_stimato_euro: 0.30 }],
    totale_stimato_euro: 4.29,
    preparazione_step_by_step: ['Stendi la pasta frolla in una teglia.', 'Farcisci con abbondante marmellata.', 'Ricava delle striscioline con la pasta avanzata.', 'Disponi le strisce a griglia sopra la marmellata.', 'Cuoci in forno a 180 gradi per 30 minuti.'] },

  { nome: 'Mousse al limone', nome_ricerca: 'Mousse al limone', descrizione_breve: 'Dolce al cucchiaio fresco e leggero.', tempo_preparazione_minuti: 20, difficolta: 'Media', emoji: '🍋', tags: ['uova', 'lattosio'], pasti: ['dolce'],
    lista_spesa: [{ prodotto: 'Panna da montare', quantita: '250ml', prezzo_stimato_euro: 1.50 }, { prodotto: 'Limoni', quantita: '2 pezzi', prezzo_stimato_euro: 1.00 }, { prodotto: 'Uova', quantita: '2 pezzi', prezzo_stimato_euro: 0.60 }, { prodotto: 'Zucchero', quantita: '80g', prezzo_stimato_euro: 0.99 }],
    totale_stimato_euro: 4.09,
    preparazione_step_by_step: ['Monta la panna ben ferma.', 'Sbatti i tuorli con lo zucchero e il succo di limone.', 'Monta gli albumi a neve.', 'Incorpora delicatamente panna e albumi al composto di limone.', 'Versa in coppette e lascia riposare in frigo un\'ora.'] },

  { nome: 'Tagliere di salumi e formaggi', nome_ricerca: 'Tagliere salumi e formaggi', descrizione_breve: 'Aperitivo classico pronto in pochi minuti.', tempo_preparazione_minuti: 10, difficolta: 'Facile', emoji: '🧀', tags: ['lattosio'], pasti: ['aperitivo'],
    lista_spesa: [{ prodotto: 'Salumi misti', quantita: '200g', prezzo_stimato_euro: 3.50 }, { prodotto: 'Formaggi misti', quantita: '200g', prezzo_stimato_euro: 3.20 }, { prodotto: 'Grissini', quantita: '1 confezione', prezzo_stimato_euro: 1.20 }],
    totale_stimato_euro: 7.90,
    preparazione_step_by_step: ['Taglia salumi e formaggi a fette o cubetti.', 'Disponili su un tagliere.', 'Aggiungi i grissini a lato.', 'Servi subito con delle bevande.'] },

  { nome: 'Bruschette miste da aperitivo', nome_ricerca: 'Bruschette miste', descrizione_breve: 'Piccole bruschette variegate per un aperitivo sfizioso.', tempo_preparazione_minuti: 20, difficolta: 'Facile', emoji: '🍅', tags: ['glutine'], pasti: ['aperitivo', 'antipasto'],
    lista_spesa: [{ prodotto: 'Pane casereccio', quantita: '1 filone', prezzo_stimato_euro: 1.50 }, { prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }, { prodotto: 'Olive tapenade', quantita: '1 vasetto', prezzo_stimato_euro: 2.20 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 6.30,
    preparazione_step_by_step: ['Taglia il pane a fette e tostalo.', 'Prepara la farcitura di pomodorini a cubetti con basilico.', 'Spalma metà pane con la tapenade di olive.', 'Distribuisci i pomodorini sull\'altra metà.', 'Disponi su un vassoio e servi.'] },

  { nome: 'Olive e taralli', nome_ricerca: 'Olive e taralli pugliesi', descrizione_breve: 'Aperitivo semplicissimo, pronto in un minuto.', tempo_preparazione_minuti: 3, difficolta: 'Facile', emoji: '🫒', tags: ['vegano', 'glutine'], pasti: ['aperitivo'],
    lista_spesa: [{ prodotto: 'Olive miste', quantita: '250g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Taralli', quantita: '1 confezione', prezzo_stimato_euro: 1.99 }],
    totale_stimato_euro: 4.19,
    preparazione_step_by_step: ['Metti le olive in una ciotolina.', 'Disponi i taralli in un cestino.', 'Servi insieme a bevande fresche.'] },

  { nome: 'Patatine e salse miste', nome_ricerca: 'Patatine e salse aperitivo', descrizione_breve: 'Aperitivo pratico e sempre gradito.', tempo_preparazione_minuti: 5, difficolta: 'Facile', emoji: '🥔', tags: ['vegano', 'senza_glutine'], pasti: ['aperitivo'],
    lista_spesa: [{ prodotto: 'Patatine in sacchetto', quantita: '1 confezione', prezzo_stimato_euro: 1.79 }, { prodotto: 'Salsa maionese', quantita: '1 vasetto', prezzo_stimato_euro: 1.50 }, { prodotto: 'Salsa ketchup', quantita: '1 vasetto', prezzo_stimato_euro: 1.50 }],
    totale_stimato_euro: 4.79,
    preparazione_step_by_step: ['Versa le patatine in una ciotola.', 'Metti le salse in ciotoline separate.', 'Servi subito.'] },

  { nome: 'Tagliere di verdure grigliate', nome_ricerca: 'Verdure grigliate', descrizione_breve: 'Antipasto leggero e colorato, completamente vegano.', tempo_preparazione_minuti: 25, difficolta: 'Facile', emoji: '🍆', tags: ['vegano', 'senza_glutine'], pasti: ['antipasto', 'aperitivo'],
    lista_spesa: [{ prodotto: 'Zucchine', quantita: '2 pezzi', prezzo_stimato_euro: 1.40 }, { prodotto: 'Melanzane', quantita: '2 pezzi', prezzo_stimato_euro: 1.60 }, { prodotto: 'Peperoni', quantita: '2 pezzi', prezzo_stimato_euro: 2.00 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 5.40,
    preparazione_step_by_step: ['Taglia le verdure a fette.', 'Grigliale su una piastra calda.', 'Condisci con olio, sale e un filo di aceto.', 'Disponi su un piatto da portata.', 'Servi tiepide o fredde.'] },

  { nome: 'Spiedini caprese', nome_ricerca: 'Spiedini caprese', descrizione_breve: 'Antipasto fresco e colorato, facile da preparare.', tempo_preparazione_minuti: 15, difficolta: 'Facile', emoji: '🍅', tags: ['lattosio'], pasti: ['antipasto', 'aperitivo'],
    lista_spesa: [{ prodotto: 'Pomodorini', quantita: '300g', prezzo_stimato_euro: 1.60 }, { prodotto: 'Mozzarelline', quantita: '250g', prezzo_stimato_euro: 2.20 }, { prodotto: 'Basilico', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }],
    totale_stimato_euro: 4.80,
    preparazione_step_by_step: ['Infilza su stuzzicadenti pomodorino, basilico e mozzarellina.', 'Ripeti fino a esaurire gli ingredienti.', 'Disponi su un vassoio.', 'Condisci con un filo di olio e servi.'] },

  { nome: 'Involtini di zucchine grigliate', nome_ricerca: 'Involtini di zucchine', descrizione_breve: 'Antipasto vegetale leggero e sfizioso.', tempo_preparazione_minuti: 25, difficolta: 'Media', emoji: '🥒', tags: ['vegano', 'senza_glutine'], pasti: ['antipasto'],
    lista_spesa: [{ prodotto: 'Zucchine', quantita: '3 pezzi', prezzo_stimato_euro: 2.10 }, { prodotto: 'Menta fresca', quantita: '1 mazzetto', prezzo_stimato_euro: 1.00 }, { prodotto: 'Aglio', quantita: '1 testa', prezzo_stimato_euro: 0.40 }, { prodotto: 'Olio EVO', quantita: 'q.b.', prezzo_stimato_euro: 0.40 }],
    totale_stimato_euro: 3.90,
    preparazione_step_by_step: ['Taglia le zucchine a fette sottili nel senso della lunghezza.', 'Grigliale su una piastra calda.', 'Condisci con olio, aglio tritato e menta.', 'Arrotola ogni fetta su se stessa.', 'Servi a temperatura ambiente.'] }
];


function normalizzaTesto(value) {
  return String(value || '').toLowerCase();
}

function ricettaCompatibileFallback(ricetta, body) {
  const intolleranze = normalizzaTesto(body.intolleranze);
  const tags = ricetta.tags || [];
  const pastiRicetta = ricetta.pasti || ['pranzo', 'cena'];
  const pastoRichiesto = normalizzaTesto(body.pasto);

  if (pastoRichiesto && !pastiRicetta.includes(pastoRichiesto)) return false;
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

const PASTO_LABEL_FALLBACK = {
  colazione: 'la tua colazione',
  pranzo: 'il tuo pranzo',
  antipasto: 'il tuo antipasto',
  aperitivo: 'il tuo aperitivo',
  cena: 'la tua cena',
  merenda: 'la tua merenda',
  dolce: 'il tuo dolce'
};

function buildFallbackResponse(body) {
  const evitare = Array.isArray(body.ricette_da_evitare)
    ? body.ricette_da_evitare.map(normalizzaTesto)
    : [];

  const ricette = FALLBACK_RICETTE
    .filter(r => !evitare.includes(normalizzaTesto(r.nome)))
    .filter(r => ricettaCompatibileFallback(r, body))
    .slice(0, 3)
    .map(({ tags, pasti, ...ricetta }) => ricetta);

  const etichettaPasto = PASTO_LABEL_FALLBACK[body.pasto?.toLowerCase()] || 'la tua spesa';

  return {
    ricette,
    note: `Ecco alcune idee per ${etichettaPasto}, mostrate perché il servizio è momentaneamente occupato. Prezzi stimati, controllare eventuali offerte.`
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

const PASTO_DESCRIZIONI = {
  colazione: 'colazione (proponi solo piatti da colazione italiana o internazionale: dolci da forno, yogurt, cereali, toast; non piatti da pranzo/cena)',
  pranzo: 'pranzo (piatto completo, primo o secondo con contorno)',
  antipasto: 'antipasto (porzioni piccole da condividere prima del pasto principale, non un piatto unico abbondante)',
  aperitivo: 'aperitivo (stuzzichini, finger food, taglieri, piccole porzioni da accompagnare a una bevanda)',
  cena: 'cena (piatto completo, primo o secondo con contorno)',
  merenda: 'merenda (spuntino dolce o salato leggero, porzione singola)',
  dolce: 'dolce (dessert, dolce da forno o al cucchiaio, non un piatto salato)'
};

const PICCANTEZZA_DESCRIZIONI = {
  nessuna: 'nessuna richiesta particolare di piccantezza',
  media: 'leggermente piccante, con un tocco di peperoncino o spezie',
  alta: 'molto piccante, marcatamente speziato'
};

function buildPrompt({ persone, pasto, preferenze, intolleranze, vegano, supermercato, ricette_da_evitare, piccantezza }) {

  const profilo = SUPERMARKET_PROFILES[supermercato?.toLowerCase()] || 'supermercato generico italiano';
  const descrizionePasto = PASTO_DESCRIZIONI[pasto?.toLowerCase()] || pasto;
  const descrizionePiccantezza = PICCANTEZZA_DESCRIZIONI[piccantezza?.toLowerCase()] || PICCANTEZZA_DESCRIZIONI.nessuna;
  const ricetteDaEvitare = Array.isArray(ricette_da_evitare)
  ? ricette_da_evitare.filter(Boolean).join(', ')
  : '';
  return `Sei un assistente esperto di spesa e cucina italiana. Devi proporre esattamente 3 ricette diverse, sintetiche e realistiche, rispettando rigorosamente questi vincoli.

DATI:
- Numero di persone: ${persone}
- Tipo di pasto: ${descrizionePasto}
- Livello di piccantezza desiderato: ${descrizionePiccantezza}
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
13. Rispetta rigorosamente il tipo di pasto indicato: non proporre piatti salati da pranzo/cena se è richiesta colazione, merenda o dolce, e viceversa.
14. Se è richiesto un livello di piccantezza, adattalo negli ingredienti (es. peperoncino, spezie piccanti) mantenendo la ricetta coerente con il tipo di pasto.
15. Rispondi SOLO in JSON valido, senza testo fuori dal JSON. Non inserire virgole finali dopo l'ultimo elemento di array o oggetti.

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

const cacheImmagini = new Map();

async function cercaImmagineRicetta(nome) {
  const chiave = String(nome || '').toLowerCase().trim();
  if (cacheImmagini.has(chiave)) return cacheImmagini.get(chiave);

  try {
    if (!PEXELS_API_KEY) {
      cacheImmagini.set(chiave, null);
      return null;
    }

    const query = `${nome} food dish`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      cacheImmagini.set(chiave, null);
      return null;
    }

    const data = await response.json();
    const foto = data.photos?.[0];
    const immagine = foto?.src?.medium || foto?.src?.small || null;

    cacheImmagini.set(chiave, immagine);
    return immagine;
  } catch (err) {
    console.error('Errore ricerca immagine Pexels:', err.message);
    cacheImmagini.set(chiave, null);
    return null;
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isErroreTemporaneoGemini(status, message) {
  if (status === 429 || status === 503) return true;
  return /high demand|try again later|overloaded|temporar|resource_exhausted|unavailable/i.test(String(message || '').toLowerCase());
}

async function callGemini(prompt) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let response;
      try {
        response = await fetch(getGeminiUrl(model), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
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
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err.name === 'AbortError' ? `Timeout su ${model}` : err.message;
        console.error(lastError);
        continue;
      }
      clearTimeout(timeoutId);

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

      const quotaEsaurita = /exceeded your current quota|resource_exhausted/i.test(lastError);

      if (quotaEsaurita) {
        // Quota giornaliera/di modello esaurita: inutile ritentare, passa subito al modello successivo
        break;
      }

      if (isErroreTemporaneoGemini(response.status, lastError) && attempt < 3) {
        const retryAfterHeader = response.headers.get('retry-after');
        const attesa = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 3000 * attempt;
        await sleep(attesa);
        continue;
      }

      break;
    }
  }

  throw new Error(lastError || 'Errore Gemini');
}
const ultimaRichiestaPerIp = new Map();
const COOLDOWN_MS = 4000;

function applicaCooldown(req, res, next) {
  const ip = req.ip;
  const ora = Date.now();
  const ultima = ultimaRichiestaPerIp.get(ip) || 0;

  if (ora - ultima < COOLDOWN_MS) {
    return res.status(429).json({
      error: 'Troppe richieste ravvicinate',
      retryAfterSeconds: Math.ceil((COOLDOWN_MS - (ora - ultima)) / 1000)
    });
  }

  ultimaRichiestaPerIp.set(ip, ora);
  next();
}

const cacheRisposte = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function chiaveCache(body) {
  return JSON.stringify({
    persone: body.persone,
    pasto: body.pasto,
    supermercato: body.supermercato,
    preferenze: body.preferenze,
    vegano: body.vegano,
    intolleranze: body.intolleranze,
    piccantezza: body.piccantezza
  });
}

app.post('/api/suggest', applicaCooldown, async (req, res) => {
  try {
    const { persone, pasto, supermercato } = req.body;

    if (!persone || !pasto || !supermercato) {
  return res.status(400).json({ error: 'Campi obbligatori mancanti: persone, pasto, supermercato' });
}

    // Se non è una richiesta di "genera altre ricette", controlla la cache
    const isRichiestaFresca = !Array.isArray(req.body.ricette_da_evitare) || req.body.ricette_da_evitare.length === 0;
    const chiave = chiaveCache(req.body);

    if (isRichiestaFresca && cacheRisposte.has(chiave)) {
      const voce = cacheRisposte.get(chiave);
      if (Date.now() - voce.timestamp < CACHE_TTL_MS) {
        return res.json({ ...voce.dati, cached: true });
      }
      cacheRisposte.delete(chiave);
    }

    const prompt = buildPrompt(req.body);



let data;

try {
  data = await callGemini(prompt);
} catch (e) {
  const msg = String(e.message || '').toLowerCase();

  const eErroreDaGestireConFallback =
    /quota|exceeded|high demand|overloaded|resource_exhausted|unavailable|timeout/i.test(msg);

  if (eErroreDaGestireConFallback) {
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

const risposta = {
  ...parsed,
  ricette: ricetteConImmagini
};

if (isRichiestaFresca) {
  cacheRisposte.set(chiave, { dati: risposta, timestamp: Date.now() });
}

res.json(risposta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend attivo su http://localhost:${PORT}`));
