import { useEffect, useState } from 'react';
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
  { id: 'nessuna', label: 'Delicato' },
  { id: 'media', label: "Un po' piccante" },
  { id: 'alta', label: 'Molto piccante' }
];

const API_URL = import.meta.env.VITE_API_URL || 'https://spesa-smart-ai-backend.onrender.com';

const STEPS = ['Chi mangia', 'Negozio', 'Gusti', 'Riepilogo'];

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    persone: 2,
    pasto: 'cena',
    supermercato: 'lidl',
    preferenze: '',
    vegano: false,
    intolleranze: [],
    piccantezza: 'nessuna'
  });
  const [risultato, setRisultato] = useState(null);
const [loading, setLoading] = useState(false);
const [errore, setErrore] = useState(null);
const [ricettaSelezionata, setRicettaSelezionata] = useState(0);
const [utente, setUtente] = useState(null);
const [ricetteSalvate, setRicetteSalvate] = useState([]);
const [mostraSalvate, setMostraSalvate] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUtente(user);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  if (!utente) {
    setRicetteSalvate([]);
    return;
  }
  caricaRicetteSalvate();
}, [utente]);

function getStorageKey() {
  return utente ? `ricette_salvate_${utente.uid}` : 'ricette_salvate_ospite';
}

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

function renderAuthBar() {
  return (
    <div className="auth-bar">
      {utente ? (
        <>
          <span className="auth-user">
            Ciao, {utente.displayName?.split(' ')[0]}
          </span>

          <button
            type="button"
            className="auth-btn"
            onClick={() => setMostraSalvate(m => !m)}
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
        </>
      ) : (
        <button type="button" className="auth-btn" onClick={accedi}>
          Accedi con Google
        </button>
      )}
    </div>
  );
}

function renderSalvatePanel() {
  if (!utente || !mostraSalvate) return null;

  return (
    <div className="saved-panel fade-in">
      <h2>Ricette salvate</h2>

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
  );
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
    {renderAuthBar()}
    {renderSalvatePanel()}

    <div className="result-hero">
  <span className="eyebrow">Ecco cosa ti serve</span>
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

  <button className="submit-btn secondary-btn" onClick={resetTutto}>
    Ricomincia
  </button>

  {errore && <div className="error-box">{errore}</div>}
</div>

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
            <ul className="lista-spesa">
              {listaSpesaAttiva?.map((p, i) => {
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
      {renderAuthBar()}
      {renderSalvatePanel()}

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

            <button
              type="button"
              className={`vegano-btn ${form.vegano ? 'vegano-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, vegano: !f.vegano }))}
            >
              🌱 {form.vegano ? 'Vegano attivo' : 'Attiva modalità vegana'}
            </button>

            <label className="field-label">Livello di piccantezza</label>
            <div className="chips">
              {LIVELLI_PICCANTEZZA.map(l => (
                <button
                  type="button"
                  key={l.id}
                  className={`chip ${form.piccantezza === l.id ? 'chip-active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, piccantezza: l.id }))}
                >
                  {l.label}
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
