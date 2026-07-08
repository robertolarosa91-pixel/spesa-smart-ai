import { useEffect, useRef, useState } from 'react';
import { auth, googleProvider, db } from './firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';



const SUPERMERCATI = [
  { id: 'lidl', label: 'Lidl' },
  { id: 'eurospin', label: 'Eurospin' },
  { id: 'md', label: 'MD' },
  { id: 'esselunga', label: 'Esselunga' },
  { id: 'conad', label: 'Conad' },
  { id: 'coop', label: 'Coop' },
  { id: 'carrefour', label: 'Carrefour' }
];

const INTOLLERANZE_COMUNI = ['Glutine', 'Lattosio', 'Frutta a guscio', 'Uova', 'Pesce/crostacei', 'Soia'];

const PASTI = [
  { id: 'colazione', label: 'Colazione', emoji: '🌅' },
  { id: 'pranzo', label: 'Pranzo', emoji: '☀️' },
  { id: 'antipasto', label: 'Antipasto', emoji: '🍤' },
  { id: 'aperitivo', label: 'Aperitivo', emoji: '🥂' },
  { id: 'cena', label: 'Cena', emoji: '🌙' },
  { id: 'merenda', label: 'Merenda', emoji: '🍪' },
  { id: 'dolce', label: 'Dolce', emoji: '🍰' }
];

const LIVELLI_PICCANTEZZA = [
  { id: 'nessuna', label: 'Nessuno', emoji: '🚫' },
  { id: 'media', label: "Un po' piccante", emoji: '🌶️' },
  { id: 'alta', label: 'Molto piccante', emoji: '🌶️🌶️' }
];

const API_URL = import.meta.env.VITE_API_URL || 'https://spesa-smart-ai-backend.onrender.com';

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-1811722034305595';
const ADSENSE_SLOT_RESULTS = import.meta.env.VITE_ADSENSE_SLOT_RESULTS || '9448959653';
const ADSENSE_SLOT_BREAK = import.meta.env.VITE_ADSENSE_SLOT_BREAK || '9448959653';

const STEPS = ['Chi mangia', 'Negozio', 'Gusti', 'Riepilogo'];

function AdCard({ slot, compact = false }) {
  const adPushedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot) return;
    if (adPushedRef.current) return;

    const timer = setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        adPushedRef.current = true;
      } catch (err) {
        console.warn('AdSense non pronto:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slot]);

  return (
    <section className={`ad-card ${compact ? 'ad-card-compact' : ''}`}>
      <div className="ad-card-label">Sponsorizzato</div>

      <ins
        className="adsbygoogle ad-ins"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    persone: 2,
    pasto: 'cena',
    supermercato: 'lidl',
    preferenze: '',
    vegano: false,
    intolleranze: [],
    piccantezza: 'nessuna',
    budget: 25,
    ingredientiCasa: ''
  });
  const [risultato, setRisultato] = useState(null);
const [loading, setLoading] = useState(false);
const [errore, setErrore] = useState(null);
const [ricettaSelezionata, setRicettaSelezionata] = useState(0);
const [utente, setUtente] = useState(null);
const [ricetteSalvate, setRicetteSalvate] = useState([]);
const [mostraSalvate, setMostraSalvate] = useState(false);
const [cronologia, setCronologia] = useState([]);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUtente(user);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  setCronologia(caricaCronologiaLocale());

  if (!utente) {
    setRicetteSalvate([]);
    setMostraSalvate(false);
    return;
  }

  caricaRicetteSalvate();
}, [utente]);


async function accedi() {
  try {
    setErrore(null);

    await setPersistence(auth, browserLocalPersistence);

    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error('Errore login Google:', err);

    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/cancelled-popup-request' ||
      err.code === 'auth/popup-closed-by-user'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectErr) {
        console.error('Errore redirect Google:', redirectErr);
      }
    }

    setErrore('Accesso Google non riuscito. Riprova.');
  }
}

async function esci() {
  try {
    await signOut(auth);
    setUtente(null);
    setRicetteSalvate([]);
    setMostraSalvate(false);
    setErrore(null);
  } catch (err) {
    console.error('Errore logout:', err);
    setErrore('Errore durante l’uscita dall’account.');
  }
}

function vaiHome(event) {
  event?.preventDefault();
  event?.stopPropagation();

  setMostraSalvate(false);
  setRisultato(null);
  setRicettaSelezionata(0);
  setPaginaRicette(0);
  setProdottiAcquistati({});
  setErrore(null);
  setStep(0);
}

function vaiSalvate(event) {
  event?.preventDefault();
  event?.stopPropagation();

  setMostraSalvate(true);
}

function getStorageKey() {
  return utente ? `ricette_salvate_${utente.uid}` : 'ricette_salvate_ospite';
}

function idRicettaFirestore(ricetta) {
  return String(ricetta?.nome || 'ricetta')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pulisciPerFirestore(value) {
  if (value === undefined) return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;

  if (Array.isArray(value)) {
    return value.map(pulisciPerFirestore);
  }

  if (value && typeof value === 'object') {
    const obj = {};

    Object.entries(value).forEach(([key, val]) => {
      obj[key] = pulisciPerFirestore(val);
    });

    return obj;
  }

  return value;
}

function salvaRicetteLocali(lista) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(lista));
  } catch (err) {
    console.warn('Errore salvataggio locale:', err);
  }
}

function caricaRicetteLocali() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function caricaRicetteSalvate() {
  if (!utente) {
    setRicetteSalvate([]);
    return;
  }

  const locali = caricaRicetteLocali();

  try {
    const snapshot = await getDocs(
      collection(db, 'utenti', utente.uid, 'ricette_salvate')
    );

    const ricetteCloud = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const unite = [...ricetteCloud];

    locali.forEach(r => {
      if (!unite.some(x => x.id === r.id)) {
        unite.push(r);
      }
    });

    setRicetteSalvate(unite);
    salvaRicetteLocali(unite);
  } catch (err) {
    console.warn('Firestore non disponibile, uso salvataggio locale:', err.code, err.message);
    setRicetteSalvate(locali);
  }
}

async function salvaRicetta(ricetta) {
  if (!utente) {
    setErrore('Accedi con Google per salvare le ricette.');
    return;
  }

  const idRicetta = idRicettaFirestore(ricetta);

  const ricettaPulita = pulisciPerFirestore({
    ...ricetta,
    id: idRicetta,
    salvata_il: new Date().toISOString()
  });

  const nuovaLista = [
    { id: idRicetta, ...ricettaPulita },
    ...ricetteSalvate.filter(r => r.id !== idRicetta)
  ];

  setRicetteSalvate(nuovaLista);
  salvaRicetteLocali(nuovaLista);
  setErrore(null);

  try {
    await setDoc(
      doc(db, 'utenti', utente.uid, 'ricette_salvate', idRicetta),
      ricettaPulita,
      { merge: true }
    );
  } catch (err) {
    console.warn('Ricetta salvata solo in locale. Errore Firestore:', err.code, err.message);
  }
}

async function rimuoviRicettaSalvata(ricettaOId) {
  if (!utente) return;

  const idRicetta =
    typeof ricettaOId === 'string'
      ? ricettaOId
      : idRicettaFirestore(ricettaOId);

  const nuovaLista = ricetteSalvate.filter(r => r.id !== idRicetta);

  setRicetteSalvate(nuovaLista);
  salvaRicetteLocali(nuovaLista);
  setErrore(null);

  try {
    await deleteDoc(
      doc(db, 'utenti', utente.uid, 'ricette_salvate', idRicetta)
    );
  } catch (err) {
    console.warn('Rimozione solo locale. Errore Firestore:', err.code, err.message);
  }
}

function ricettaGiaSalvata(ricetta) {
  const idRicetta = idRicettaFirestore(ricetta);
  return ricetteSalvate.some(r => r.id === idRicetta);
}

async function togglePreferito(ricetta, event) {
  event?.stopPropagation();

  if (!utente) {
    setErrore('Accedi con Google per salvare le ricette tra i preferiti.');
    return;
  }

  if (ricettaGiaSalvata(ricetta)) {
    await rimuoviRicettaSalvata(ricetta);
  } else {
    await salvaRicetta(ricetta);
  }
}

function apriRicettaSalvata(ricetta) {
  setRisultato({
    ricette: [ricetta],
    note: 'Ricetta salvata nei preferiti.'
  });

  setMostraSalvate(false);
  setRicettaSelezionata(0);
  setPaginaRicette(0);
  setProdottiAcquistati({});
}

function renderAccountArea() {
  const mostraTastoHome = Boolean(mostraSalvate || risultato);
  const mostraSmartStrip = !mostraSalvate && !risultato;

  return (
    <header className="app-header">
      <div className="brand-card">
        <div className="brand-icon">🛒</div>

        <div className="brand-text">
          <strong>Spesa Smart AI</strong>
          <span>Ricette, lista e idee in pochi secondi</span>
        </div>
      </div>

      <div className="auth-panel">
        {utente ? (
          <>
            <div className="auth-user-row">
              <span className="auth-user">
                Ciao, {utente.displayName?.split(' ')[0]}
              </span>
            </div>

            <div className="auth-actions">
              {mostraTastoHome && (
                <button
                  type="button"
                  className="auth-btn auth-home-btn"
                  onClick={vaiHome}
                >
                  🏠 Home
                </button>
              )}

              <button
                type="button"
                className={`auth-btn ${mostraSalvate ? 'auth-btn-active' : ''}`}
                onClick={vaiSalvate}
              >
                ❤️ Salvate ({ricetteSalvate.length})
              </button>

              <button
                type="button"
                className="auth-btn auth-btn-secondary"
                onClick={esci}
              >
                Esci
              </button>
            </div>
          </>
        ) : (
          <div className="auth-actions">
            <button type="button" className="auth-btn" onClick={accedi}>
              Accedi con Google
            </button>
          </div>
        )}
      </div>

      {mostraSmartStrip && (
        <div className="smart-strip">
          <div>
            <span>🧠</span>
            <strong>AI smart</strong>
          </div>

          <div>
            <span>🛒</span>
            <strong>Lista pronta</strong>
          </div>

          <div>
            <span>❤️</span>
            <strong>Preferiti</strong>
          </div>
        </div>
      )}
    </header>
  );
}

function renderLoadingOverlay() {
  if (!loading) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="loading-orbit">
          <span className="loading-cart">🛒</span>
          <span className="loading-dot loading-dot-1">🥕</span>
          <span className="loading-dot loading-dot-2">🍅</span>
          <span className="loading-dot loading-dot-3">🥦</span>
        </div>

        <h2>Sto creando la tua spesa intelligente</h2>
        <p>Analizzo gusti, supermercato, ricette e lista della spesa...</p>

        <div className="loading-progress">
          <span />
        </div>

        <div className="loading-tags">
          <span>🧠 AI</span>
          <span>🍽️ Ricette</span>
          <span>🛒 Lista pronta</span>
        </div>
      </div>
    </div>
  );
}

function getHistoryKey() {
  return utente ? `cronologia_spesa_${utente.uid}` : 'cronologia_spesa_ospite';
}

function caricaCronologiaLocale() {
  try {
    const raw = localStorage.getItem(getHistoryKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvaCronologiaLocale(lista) {
  try {
    localStorage.setItem(getHistoryKey(), JSON.stringify(lista));
  } catch (err) {
    console.warn('Errore salvataggio cronologia:', err);
  }
}

function salvaInCronologia(data) {
  if (!data?.ricette?.length) return;

  const item = {
    id: String(Date.now()),
    salvata_il: new Date().toISOString(),
    titolo: data.ricette?.[0]?.nome || 'Spesa generata',
    form: {
      persone: form.persone,
      pasto: form.pasto,
      supermercato: form.supermercato,
      budget: form.budget,
      preferenze: form.preferenze,
      ingredientiCasa: form.ingredientiCasa
    },
    risultato: data
  };

  const nuovaCronologia = [
    item,
    ...cronologia.filter(x => x.titolo !== item.titolo)
  ].slice(0, 8);

  setCronologia(nuovaCronologia);
  salvaCronologiaLocale(nuovaCronologia);
}

function apriDaCronologia(item) {
  if (item.form) {
    setForm(f => ({
      ...f,
      ...item.form
    }));
  }

  setRisultato(item.risultato);
  setMostraSalvate(false);
  setRicettaSelezionata(0);
  setPaginaRicette(0);
  setProdottiAcquistati({});
  setErrore(null);
}

function repartoDaProdotto(prodotto) {
  const t = String(prodotto || '').toLowerCase();

  if (/pomodor|insalat|zucchin|carot|patat|cipoll|limon|basilic|broccol|peperon|melanzan|verdura|frutta|banana|mela|fragol|fungh/i.test(t)) {
    return 'Frutta e verdura';
  }

  if (/pollo|manzo|hamburger|salsiccia|tonno|salmone|merluzzo|pesce|vongol|platessa|carne/i.test(t)) {
    return 'Carne e pesce';
  }

  if (/latte|mozzarella|formaggio|uova|yogurt|burro|panna|parmigiano|pecorino|feta/i.test(t)) {
    return 'Latticini e uova';
  }

  if (/pane|piadina|panini|toast|taralli|grissini|sfoglia|brisee/i.test(t)) {
    return 'Panetteria';
  }

  if (/surgelat|piselli|spinaci/i.test(t)) {
    return 'Surgelati';
  }

  if (/acqua|succo|bevanda/i.test(t)) {
    return 'Bevande';
  }

  return 'Dispensa';
}

function repartoConIcona(reparto) {
  const r = String(reparto || '').toLowerCase();

  if (r.includes('frutta') || r.includes('verdura')) return '🥬 Frutta e verdura';
  if (r.includes('carne') || r.includes('pesce')) return '🥩 Carne e pesce';
  if (r.includes('latticini') || r.includes('uova')) return '🥚 Latticini e uova';
  if (r.includes('panetteria') || r.includes('pane')) return '🥖 Panetteria';
  if (r.includes('surgelati')) return '❄️ Surgelati';
  if (r.includes('bevande')) return '🥤 Bevande';
  if (r.includes('dispensa')) return '🧂 Dispensa';

  return '🛒 Altro';
}

function raggruppaListaPerReparto(lista) {
  return (lista || []).reduce((acc, prodotto, index) => {
    const repartoBase = prodotto.reparto || repartoDaProdotto(prodotto.prodotto);
    const reparto = repartoConIcona(repartoBase);

    if (!acc[reparto]) acc[reparto] = [];

    acc[reparto].push({
      ...prodotto,
      __index: index
    });

    return acc;
  }, {});
}

function getRecipeBadges(ricetta) {
  const badgesAI = Array.isArray(ricetta?.badge_qualita)
    ? ricetta.badge_qualita
    : [];

  const badges = [...badgesAI];

  const tempo = Number(ricetta?.tempo_preparazione_minuti || 0);
  const totale = Number(ricetta?.totale_stimato_euro || 0);
  const budget = Number(form.budget || 0);

  if (tempo > 0 && tempo <= 20) badges.push('⚡ Veloce');

  if (budget > 0 && totale > 0) {
    const distanza = Math.abs(totale - budget) / budget;

    if (distanza <= 0.25) {
      badges.push('🎯 Budget centrato');
    } else if (totale < budget * 0.75) {
      badges.push('💸 Economica');
    }
  }

  if (form.vegano) badges.push('🌱 Vegana');

  if (form.piccantezza === 'media') badges.push('🌶️ Piccante');
  if (form.piccantezza === 'alta') badges.push('🔥 Molto piccante');

  return [...new Set(badges.filter(Boolean))].slice(0, 4);
}

function condividiWhatsApp(ricetta, lista, totale) {
  if (!ricetta) return;

  const reparti = raggruppaListaPerReparto(lista);

  const listaTesto = Object.entries(reparti)
    .map(([reparto, prodotti]) => {
      const righe = prodotti
        .map(p => {
          const prezzo = Number(p.prezzo_stimato_euro || 0);
          return `• ${p.prodotto} — ${p.quantita}${prezzo ? ` (€${prezzo.toFixed(2)})` : ''}`;
        })
        .join('\n');

      return `${reparto}\n${righe}`;
    })
    .join('\n\n');

  const testo = `🛒 Spesa Smart AI

🍽️ Ricetta: ${ricetta.nome}
👥 Persone: ${form.persone}
🏪 Supermercato: ${SUPERMERCATI.find(s => s.id === form.supermercato)?.label}
💶 Budget: €${Number(form.budget || 0).toFixed(0)}
💰 Totale stimato: €${Number(totale || 0).toFixed(2)}

LISTA DELLA SPESA:
${listaTesto}

Preparata con Spesa Smart AI ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, '_blank', 'noopener,noreferrer');
}

const [paginaRicette, setPaginaRicette] = useState(0);
const [prodottiAcquistati, setProdottiAcquistati] = useState({});

const [retrySeconds, setRetrySeconds] = useState(0);

useEffect(() => {
  if (retrySeconds <= 0) {
    if (errore?.toLowerCase().includes('troppe richieste')) {
      setErrore(null);
    }
    return;
  }

  const timer = setTimeout(() => {
    setRetrySeconds(s => Math.max(0, s - 1));
  }, 1000);

  return () => clearTimeout(timer);
}, [retrySeconds, errore]);

  function toggleIntolleranza(item) {
    setForm(f => ({
      ...f,
      intolleranze: f.intolleranze.includes(item)
        ? f.intolleranze.filter(i => i !== item)
        : [...f.intolleranze, item]
    }));
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }
  function toggleProdottoAcquistato(index) {
  setProdottiAcquistati(prev => ({
    ...prev,
    [index]: !prev[index]
  }));
}
  async function handleSubmit() {
if (retrySeconds > 0) return;
    setLoading(true);
    setErrore(null);
    setRisultato(null);
setRicettaSelezionata(0);
setPaginaRicette(0);
setProdottiAcquistati({});

    try {
      const res = await fetch(`${API_URL}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, intolleranze: form.intolleranze.join(', ') })
      });
      const data = await res.json();
      if (!res.ok) {
  if (res.status === 429) {
    setRetrySeconds(data.retryAfterSeconds || 60);
  }

  throw new Error(data.details || data.error || 'Errore sconosciuto');
}

      setRisultato(data);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setLoading(false);
    }
  }

async function generaAltreRicette() {
  if (retrySeconds > 0) return;
  setLoading(true);
  setErrore(null);
  setRicettaSelezionata(0);
  setPaginaRicette(0);
  setProdottiAcquistati({});

  const ricetteDaEvitare = (risultato?.ricette || [])
    .map(r => r.nome)
    .filter(Boolean);

  try {
    const res = await fetch(`${API_URL}/api/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        intolleranze: form.intolleranze.join(', '),
        ricette_da_evitare: ricetteDaEvitare,
        variante: Date.now()
      })
    });

    const data = await res.json();
    if (!res.ok) {
  if (res.status === 429) {
    setRetrySeconds(data.retryAfterSeconds || 60);
  }

  throw new Error(data.details || data.error || 'Errore sconosciuto');
}

    salvaInCronologia(data);
    setRisultato(data);
  } catch (err) {
    setErrore(err.message);
  } finally {
    setLoading(false);
  }
}

  function resetTutto() {
  setRisultato(null);
  setProdottiAcquistati({});
  setRicettaSelezionata(0);
  setPaginaRicette(0);
  setErrore(null);
  setRetrySeconds(0);
  setStep(0);
  setMostraSalvate(false);
}

if (mostraSalvate) {
  return (
    <div className="page">
      {renderAccountArea()}
      {renderLoadingOverlay()}

      <div className="saved-page fade-in">
        <h1>Ricette salvate</h1>

        {ricetteSalvate.length === 0 ? (
          <p className="saved-empty">Non hai ancora salvato ricette.</p>
        ) : (
          <div className="saved-list">
            {ricetteSalvate.map((r) => (
              <div key={r.id} className="saved-card">
                <div className="saved-card-text">
                  <strong>{r.nome}</strong>
                  <p>{r.descrizione_breve}</p>
                </div>

                <div className="saved-actions">
                  <button
                    type="button"
                    onClick={() => apriRicettaSalvata(r)}
                  >
                    Apri
                  </button>

                  <button
                    type="button"
                    className="remove-saved-btn"
                    onClick={() => rimuoviRicettaSalvata(r.id)}
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

if (risultato) {
  const RICETTE_PER_PAGINA = 2;
  const ricette = risultato.ricette || [];
  const totalePagineRicette = Math.ceil(ricette.length / RICETTE_PER_PAGINA);
  const inizioRicette = paginaRicette * RICETTE_PER_PAGINA;
  const ricetteVisibili = ricette.slice(inizioRicette, inizioRicette + RICETTE_PER_PAGINA);

  const ricettaAttiva = ricette[ricettaSelezionata];
  const listaSpesaAttiva = ricettaAttiva?.lista_spesa || risultato.lista_spesa || [];
  const totaleAttivo = ricettaAttiva?.totale_stimato_euro ?? risultato.totale_stimato_euro;

const preparazioneAttiva =
  ricettaAttiva?.preparazione_step_by_step ||
  ricettaAttiva?.preparazione ||
  ricettaAttiva?.procedimento ||
  [];

  return (
  <div className="page">
    {renderAccountArea()}
    {renderLoadingOverlay()}

    <div className="result-hero">
  <div className="result-topline">
    <span className="eyebrow">Ecco cosa ti serve</span>
    <span className="ai-badge">✨ Generato con AI</span>
  </div>

  <h1>La tua spesa è pronta</h1>

  <div className="result-summary">
    <span>{PASTI.find(p => p.id === form.pasto)?.label}</span>
    <span>{form.persone} {form.persone === 1 ? 'persona' : 'persone'}</span>
    <span>{SUPERMERCATI.find(s => s.id === form.supermercato)?.label}</span>

    {form.piccantezza !== 'nessuna' && <span>{LIVELLI_PICCANTEZZA.find(l => l.id === form.piccantezza)?.label}</span>}
    {form.vegano && <span>Vegano</span>}

    {form.intolleranze.length > 0 && (
      <span>No {form.intolleranze.join(', ')}</span>
    )}

    {form.preferenze && (
      <span>{form.preferenze}</span>
    )}
  </div>
</div>

<div className="result-actions">
  <button className="submit-btn" onClick={generaAltreRicette} disabled={loading || retrySeconds > 0}>
    {loading
      ? 'Genero nuove ricette...'
      : retrySeconds > 0
        ? `Riprova tra ${retrySeconds}s`
        : 'Genera altre ricette'}
  </button>

  <button
    className="submit-btn whatsapp-btn"
    onClick={() => condividiWhatsApp(ricettaAttiva, listaSpesaAttiva, totaleAttivo)}
    disabled={!ricettaAttiva}
  >
    📲 Condividi su WhatsApp
  </button>

  <button className="submit-btn secondary-btn" onClick={resetTutto}>
    Ricomincia
  </button>

  {errore && <div className="error-box">{errore}</div>}
</div>

        <AdCard slot={ADSENSE_SLOT_RESULTS} />

        <div className="risultato">
          <section>
            <h2>Ricette</h2>
            {ricetteVisibili.map((r, indexLocale) => {
  const i = inizioRicette + indexLocale;
  const salvata = ricettaGiaSalvata(r);

  return (
    <div
      key={i}
      className="recipe-wrapper fade-in"
      style={{
        animationDelay: `${indexLocale * 0.08}s`
      }}
    >
      <div
        className="card recipe-card"
        onClick={() => {
          setRicettaSelezionata(i);
          setProdottiAcquistati({});
        }}
        style={{
          cursor: 'pointer',
          border: ricettaSelezionata === i ? '2px solid #247c69' : undefined
        }}
      >
        <div className="card-visual">
          {r.immagine ? (
            <img className="card-image" src={r.immagine} alt={r.nome} />
          ) : (
            <div className="card-emoji">{r.emoji || '🍽️'}</div>
          )}
        </div>

        <div className="card-body">
          <h3>{r.nome}</h3>
          <p>{r.descrizione_breve}</p>

          <div className="quality-badges">
            {getRecipeBadges(r).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>

          <div className="recipe-meta">
            <span className="tempo">⏱ {r.tempo_preparazione_minuti} min</span>
            <span className={`difficulty difficulty-${(r.difficolta || 'Facile').toLowerCase()}`}>
              {r.difficolta || 'Facile'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`save-recipe-btn ${salvata ? 'save-active' : ''}`}
        onClick={(e) => togglePreferito(r, e)}
      >
        {salvata ? '❤️ Salvata' : '🤍 Salva ricetta'}
      </button>
    </div>
  );
})}


{totalePagineRicette > 1 && (
  <div className="recipe-pagination">
    <button
      type="button"
      disabled={paginaRicette === 0}
      onClick={() => {
        const nuovaPagina = Math.max(0, paginaRicette - 1);
        setPaginaRicette(nuovaPagina);
        setRicettaSelezionata(nuovaPagina * RICETTE_PER_PAGINA);
        setProdottiAcquistati({});
      }}
    >
      ←
    </button>

    <span>
      {paginaRicette + 1} / {totalePagineRicette}
    </span>

    <button
      type="button"
      disabled={paginaRicette >= totalePagineRicette - 1}
      onClick={() => {
        const nuovaPagina = Math.min(totalePagineRicette - 1, paginaRicette + 1);
        setPaginaRicette(nuovaPagina);
        setRicettaSelezionata(nuovaPagina * RICETTE_PER_PAGINA);
        setProdottiAcquistati({});
      }}
    >
      →
    </button>
  </div>
)}
          </section>

          <section>
            <h2>Lista della spesa {ricettaAttiva?.nome ? `— ${ricettaAttiva.nome}` : ''}</h2>
            <div className="lista-reparti">
              {Object.entries(raggruppaListaPerReparto(listaSpesaAttiva)).map(([reparto, prodotti]) => (
                <div key={reparto} className="reparto-group fade-in">
                  <h3 className="reparto-title">{reparto}</h3>

                  <ul className="lista-spesa">
                    {prodotti.map((p) => {
                      const i = p.__index;
                      const acquistato = !!prodottiAcquistati[i];
                      const prezzo = Number(p.prezzo_stimato_euro || 0);

                      return (
                        <li
                          key={i}
                          className="fade-in"
                          onClick={() => toggleProdottoAcquistato(i)}
                          style={{
                            animationDelay: `${i * 0.05}s`,
                            cursor: 'pointer',
                            opacity: acquistato ? 0.45 : 1
                          }}
                        >
                          <span
                            style={{
                              textDecoration: acquistato ? 'line-through' : 'none'
                            }}
                          >
                            {p.prodotto} — {p.quantita}
                          </span>

                          <span
                            className="prezzo"
                            style={{
                              textDecoration: acquistato ? 'line-through' : 'none'
                            }}
                          >
                            €{prezzo.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <div className="totale">
  Totale stimato <strong>€{totaleAttivo?.toFixed(2)}</strong>
  <span className="totale-budget"> stimati</span>
</div>

{preparazioneAttiva?.length > 0 && (
  <div className="preparazione-box fade-in">
    <h2>Guida di preparazione</h2>

    <ol className="preparazione-lista">
      {preparazioneAttiva.map((step, i) => (
        <li key={i}>
          <span className="step-number">{i + 1}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  </div>
)}

{risultato.note && <p className="note">{risultato.note}</p>}
          </section>
        </div>

        
      </div>
    );
  }

  return (
    <div className="page">
      {renderAccountArea()}
      {renderLoadingOverlay()}

      <div className="progress-track">
        {STEPS.map((label, i) => (
          <div key={label} className={`progress-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}>
            <span className="dot-num">{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="step-label">Passo {step + 1} di {STEPS.length} — {STEPS[step]}</p>

      <div className="step-content fade-in" key={step}>
        

        {step === 0 && (
          <div className="step-body">
            <h1 className="step-title">Per chi cuciniamo?</h1>

            <div className="budget-smart-card">
              <div>
                <span className="budget-label">Budget indicativo</span>
                <strong>€{Number(form.budget || 0).toFixed(0)}</strong>
              </div>

              <div className="budget-controls">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, budget: Math.max(5, Number(f.budget || 0) - 5) }))}
                >
                  −
                </button>

                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, budget: Math.min(200, Number(f.budget || 0) + 5) }))}
                >
                  +
                </button>
              </div>

              <p>Lo userò come obiettivo: se metti €100, cercherò ricette più vicine a quel valore, non da €10.</p>
            </div>

            <div className="stepper">
              <button type="button" onClick={() => setForm(f => ({ ...f, persone: Math.max(1, f.persone - 1) }))}>−</button>
              <span className="stepper-value">{form.persone} {form.persone === 1 ? 'persona' : 'persone'}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, persone: Math.min(12, f.persone + 1) }))}>+</button>
            </div>

            <div className="chips">
              {PASTI.map(p => (
                <button
                  type="button"
                  key={p.id}
                  className={`chip ${form.pasto === p.id ? 'chip-active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, pasto: p.id }))}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="step-body">
            <h1 className="step-title">Dove fai la spesa?</h1>
            <div className="market-grid">
              {SUPERMERCATI.map(s => (
                <button
                  type="button"
                  key={s.id}
                  className={`market-card ${form.supermercato === s.id ? 'market-active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, supermercato: s.id }))}
                >
                  <span className="market-name">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-body">
            <h1 className="step-title">I tuoi gusti</h1>

            <label className="field-label">Preferenze libere</label>
            <input
              type="text"
              placeholder="Es: cucina italiana, piccante, veloce"
              value={form.preferenze}
              onChange={e => setForm(f => ({ ...f, preferenze: e.target.value }))}
              className="text-input"
            />

            <label className="field-label">Ho già in casa</label>
            <textarea
              placeholder="Es: pasta, uova, tonno, zucchine, riso..."
              value={form.ingredientiCasa}
              onChange={e => setForm(f => ({ ...f, ingredientiCasa: e.target.value }))}
              className="text-input pantry-input"
            />

            <button
              type="button"
              className={`vegano-btn ${form.vegano ? 'vegano-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, vegano: !f.vegano }))}
            >
              🌱 {form.vegano ? 'Vegano attivo' : 'Attiva modalità vegana'}
            </button>

            <label className="field-label">Livello di piccantezza</label>

<div className="spice-picker">
  {LIVELLI_PICCANTEZZA.map(l => (
    <button
      type="button"
      key={l.id}
      className={`spice-btn ${form.piccantezza === l.id ? 'spice-active' : ''}`}
      onClick={() => setForm(f => ({ ...f, piccantezza: l.id }))}
      aria-label={l.label}
      title={l.label}
    >
      <span className="spice-emoji">{l.emoji}</span>
      <span className="sr-only">{l.label}</span>
    </button>
  ))}
</div>

            <label className="field-label">Intolleranze / allergie</label>
            <div className="chips">
              {INTOLLERANZE_COMUNI.map(item => (
                <button
                  type="button"
                  key={item}
                  className={`chip ${form.intolleranze.includes(item) ? 'chip-active' : ''}`}
                  onClick={() => toggleIntolleranza(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-body">
            <h1 className="step-title">Tutto pronto?</h1>
            <div className="summary-card">
              
              <div className="summary-row"><span>Persone</span><strong>{form.persone}</strong></div>
              <div className="summary-row">
  <span>Pasto</span>
  <strong>{PASTI.find(p => p.id === form.pasto)?.label}</strong>
</div>
              <div className="summary-row"><span>Supermercato</span><strong>{SUPERMERCATI.find(s => s.id === form.supermercato)?.label}</strong></div>
              {form.piccantezza !== 'nessuna' && <div className="summary-row"><span>Piccantezza</span><strong>{LIVELLI_PICCANTEZZA.find(l => l.id === form.piccantezza)?.label}</strong></div>}
              {form.vegano && <div className="summary-row"><span>Dieta</span><strong>Vegano</strong></div>}
              {form.intolleranze.length > 0 && <div className="summary-row"><span>Da evitare</span><strong>{form.intolleranze.join(', ')}</strong></div>}
              {form.preferenze && <div className="summary-row"><span>Gusti</span><strong>{form.preferenze}</strong></div>}
            </div>
            {errore && <div className="error-box">{errore}</div>}
          </div>
        )}
      </div>

      {step === 0 && cronologia.length > 0 && (
        <div className="history-panel fade-in">
          <div className="history-header">
            <h2>Cronologia</h2>
            <span>Ultime spese generate</span>
          </div>

          <div className="history-list">
            {cronologia.slice(0, 4).map((item) => (
              <button
                type="button"
                key={item.id}
                className="history-card"
                onClick={() => apriDaCronologia(item)}
              >
                <strong>{item.titolo}</strong>
                <span>
                  €{Number(item.form?.budget || 0).toFixed(0)} · {PASTI.find(p => p.id === item.form?.pasto)?.label || 'Pasto'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="nav-bar">
        {step > 0 && <button className="nav-btn nav-back" onClick={back}>Indietro</button>}
        {step < STEPS.length - 1 && <button className="nav-btn nav-next" onClick={next}>Avanti</button>}
        {step === STEPS.length - 1 && (
          <button className="nav-btn nav-next" onClick={handleSubmit} disabled={loading || retrySeconds > 0}>
  {loading
    ? 'Sto pensando...'
    : retrySeconds > 0
      ? `Riprova tra ${retrySeconds}s`
      : 'Trova la spesa'}
</button>
        )}
      </div>
    </div>
  );
}
