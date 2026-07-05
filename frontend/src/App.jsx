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

const STEPS = ['Budget', 'Chi mangia', 'Negozio', 'Gusti', 'Riepilogo'];

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    budget: 20,
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

  function resetTutto() {
  setRisultato(null);
  setProdottiAcquistati({});
  setStep(0);
}

  if (risultato) {
    return (
      <div className="page">
        <div className="result-hero">
          <span className="eyebrow">Ecco cosa ti serve</span>
          <h1>La tua spesa è pronta</h1>
        </div>

        <div className="risultato">
          <section>
            <h2>Ricette</h2>
            {risultato.ricette?.map((r, i) => (
              <div key={i} className="card recipe-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
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
                  <span className="tempo">⏱ {r.tempo_preparazione_minuti} min</span>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2>Lista della spesa</h2>
            <ul className="lista-spesa">
              {risultato.lista_spesa?.map((p, i) => {
  const acquistato = !!prodottiAcquistati[i];

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
        €{p.prezzo_stimato_euro?.toFixed(2)}
      </span>
    </li>
  );
})}
            </ul>
            <div className="totale">
              Totale stimato <strong>€{risultato.totale_stimato_euro?.toFixed(2)}</strong>
              <span className="totale-budget"> / budget €{form.budget}</span>
            </div>
            {risultato.note && <p className="note">{risultato.note}</p>}
          </section>
        </div>

        <button className="submit-btn" onClick={resetTutto}>Ricomincia</button>
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
            <h1 className="step-title">Quanto vuoi spendere?</h1>
            <div className="budget-display">€{form.budget}</div>
            <input
              type="range" min="5" max="150" step="5"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
              className="budget-slider"
            />
            <div className="range-labels"><span>€5</span><span>€150</span></div>
          </div>
        )}

        {step === 1 && (
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

        {step === 2 && (
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

        {step === 3 && (
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

        {step === 4 && (
          <div className="step-body">
            <h1 className="step-title">Tutto pronto?</h1>
            <div className="summary-card">
              <div className="summary-row"><span>Budget</span><strong>€{form.budget}</strong></div>
              <div className="summary-row"><span>Persone</span><strong>{form.persone}</strong></div>
              <div className="summary-row"><span>Pasto</span><strong>{form.pasto}</strong></div>
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
