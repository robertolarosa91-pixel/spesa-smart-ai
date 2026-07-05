import { useState } from 'react';



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
    intolleranze: []
  });
  const [risultato, setRisultato] = useState(null);
const [loading, setLoading] = useState(false);
const [errore, setErrore] = useState(null);
const [ricettaSelezionata, setRicettaSelezionata] = useState(0);
const [paginaRicette, setPaginaRicette] = useState(0);
const [prodottiAcquistati, setProdottiAcquistati] = useState({});

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
      if (!res.ok) throw new Error(data.error || 'Errore sconosciuto');

      setRisultato(data);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setLoading(false);
    }
  }

async function generaAltreRicette() {
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
    if (!res.ok) throw new Error(data.error || 'Errore sconosciuto');

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
    <div className="result-hero">
  <span className="eyebrow">Ecco cosa ti serve</span>
  <h1>La tua spesa è pronta</h1>

  <div className="result-summary">
    <span>{form.pasto === 'cena' ? 'Cena' : 'Pranzo'}</span>
    <span>{form.persone} {form.persone === 1 ? 'persona' : 'persone'}</span>
    <span>{SUPERMERCATI.find(s => s.id === form.supermercato)?.label}</span>
    

    {form.vegano && <span>Vegano</span>}

    {form.intolleranze.length > 0 && (
      <span>No {form.intolleranze.join(', ')}</span>
    )}

    {form.preferenze && (
      <span>{form.preferenze}</span>
    )}
  </div>
</div>

        <div className="risultato">
          <section>
            <h2>Ricette</h2>
            {ricetteVisibili.map((r, indexLocale) => {
  const i = inizioRicette + indexLocale;

  return (
              <div
  key={i}
  className="card recipe-card fade-in"
  onClick={() => {
    setRicettaSelezionata(i);
    setProdottiAcquistati({});
  }}
  style={{
    animationDelay: `${indexLocale * 0.08}s`,
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

        <button className="submit-btn" onClick={generaAltreRicette} disabled={loading}>
  {loading ? 'Genero nuove ricette...' : 'Genera altre ricette'}
</button>

<button className="submit-btn secondary-btn" onClick={resetTutto}>
  Ricomincia
</button>

{errore && <div className="error-box">Errore: {errore}</div>}
      </div>
    );
  }

  return (
    <div className="page">
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

            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-btn ${form.pasto === 'pranzo' ? 'toggle-active' : ''}`}
                onClick={() => setForm(f => ({ ...f, pasto: 'pranzo' }))}
              >☀️ Pranzo</button>
              <button
                type="button"
                className={`toggle-btn ${form.pasto === 'cena' ? 'toggle-active' : ''}`}
                onClick={() => setForm(f => ({ ...f, pasto: 'cena' }))}
              >🌙 Cena</button>
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
  <strong>{form.pasto === 'cena' ? 'Cena' : 'Pranzo'}</strong>
</div>
              <div className="summary-row"><span>Supermercato</span><strong>{SUPERMERCATI.find(s => s.id === form.supermercato)?.label}</strong></div>
              {form.vegano && <div className="summary-row"><span>Dieta</span><strong>Vegano</strong></div>}
              {form.intolleranze.length > 0 && <div className="summary-row"><span>Da evitare</span><strong>{form.intolleranze.join(', ')}</strong></div>}
              {form.preferenze && <div className="summary-row"><span>Gusti</span><strong>{form.preferenze}</strong></div>}
            </div>
            {errore && <div className="error-box">Errore: {errore}</div>}
          </div>
        )}
      </div>

      <div className="nav-bar">
        {step > 0 && <button className="nav-btn nav-back" onClick={back}>Indietro</button>}
        {step < STEPS.length - 1 && <button className="nav-btn nav-next" onClick={next}>Avanti</button>}
        {step === STEPS.length - 1 && (
          <button className="nav-btn nav-next" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sto pensando...' : 'Trova la spesa'}
          </button>
        )}
      </div>
    </div>
  );
}
