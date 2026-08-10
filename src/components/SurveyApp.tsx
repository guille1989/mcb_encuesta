"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string; icon: string };
type Step = {
  id: string;
  question: string;
  eyebrow: string;
  type: "single" | "multi" | "contact";
  options: Option[];
};
type Answers = Record<string, string | string[]>;
type Phase = "intro" | "survey" | "done";

const STORAGE_DRAFT = "mcb-survey-draft";
const STORAGE_RESPONSES = "mcb-survey-responses";

const steps: Step[] = [
  {
    id: "frequency",
    eyebrow: "Tu ritual",
    question: "¿Con qué frecuencia tomas café?",
    type: "single",
    options: [
      { value: "multiple_day", label: "Varias veces al día", icon: "⚡" },
      { value: "once_day", label: "Una vez al día", icon: "☕" },
      { value: "few_week", label: "Algunas veces por semana", icon: "◫" },
      { value: "rarely", label: "Ocasionalmente", icon: "○" },
    ],
  },
  {
    id: "type",
    eyebrow: "Tu estilo",
    question: "¿Qué tipo de café prefieres?",
    type: "single",
    options: [
      { value: "espresso", label: "Espresso / Americano", icon: "●" },
      { value: "cold_brew", label: "Cold brew / Café frío", icon: "❄" },
      { value: "latte", label: "Latte / Cappuccino", icon: "◇" },
      { value: "drip", label: "Drip / Pour over", icon: "▽" },
      { value: "any", label: "Cualquier cosa con cafeína", icon: "⚡" },
    ],
  },
  {
    id: "presentation",
    eyebrow: "El formato",
    question: "¿Cuál presentación te interesa más?",
    type: "multi",
    options: [
      { value: "sachet", label: "Sachet / Drip coffee · 1 dosis (10 g)", icon: "▧" },
      { value: "pouch250", label: "Pouch 250 ml · listo para tomar", icon: "◩" },
      { value: "pouch500", label: "Pouch 500 ml · listo para tomar", icon: "◧" },
      { value: "bolsa1000", label: "Bolsa 1000 g · granos / molido", icon: "▰" },
    ],
  },
  {
    id: "price",
    eyebrow: "El valor",
    question: "¿Cuánto pagarías por 250 g de café de especialidad?",
    type: "single",
    options: [
      { value: "under_20", label: "Menos de $20.000 COP", icon: "$" },
      { value: "20_35", label: "$20.000 – $35.000 COP", icon: "$$" },
      { value: "35_50", label: "$35.000 – $50.000 COP", icon: "$$$" },
      { value: "over_50", label: "Más de $50.000 COP · ¡lo vale!", icon: "⚡" },
    ],
  },
  {
    id: "where",
    eyebrow: "El momento",
    question: "¿Dónde tomarías The Mother Coffee Baby?",
    type: "multi",
    options: [
      { value: "home", label: "En casa", icon: "⌂" },
      { value: "office", label: "En la oficina / estudio", icon: "▤" },
      { value: "gym", label: "Pre-entreno / gym", icon: "▲" },
      { value: "outdoors", label: "Al aire libre / aventuras", icon: "△" },
      { value: "bar", label: "Bares y eventos", icon: "✦" },
    ],
  },
  {
    id: "contact",
    eyebrow: "Último paso",
    question: "¿Quieres saber primero cuándo lanzamos?",
    type: "contact",
    options: [],
  },
];

function Bolt({ mirrored = false }: { mirrored?: boolean }) {
  return <span className={mirrored ? "bolt bolt--mirrored" : "bolt"}>ϟ</span>;
}

function Intro({ onStart }: { onStart: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState("");

  const playIntro = async () => {
    const video = videoRef.current;
    if (!video) return;

    setPlayError("");
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    setPlaying(true);

    try {
      await video.play();
    } catch {
      setPlaying(false);
      setPlayError("No pudimos iniciar el vídeo. Inténtalo de nuevo.");
    }
  };

  return (
    <main className={`intro ${playing ? "intro--playing" : ""}`}>
      <video
        ref={videoRef}
        className="intro__video"
        playsInline
        preload="auto"
        onEnded={onStart}
        aria-label="Presentación de The Mother Coffee Baby"
      >
        <source src="/assets/mcb-encuesta.mp4" type="video/mp4" />
        Tu navegador no puede reproducir este vídeo.
      </video>

      <div className="intro__cover" />
      <Image
        className="intro__logo"
        src="/assets/mcb-logo.png"
        width={1254}
        height={1254}
        alt=""
        priority
      />
      <section className="intro__content">
        <p className="kicker"><Bolt /> Café real · salvaje · sin reglas <Bolt mirrored /></p>
        <h1>Tu café.<br /><span>Tu opinión.</span></h1>
        <p className="intro__copy">Primero sube el volumen. Después del vídeo comenzarán seis preguntas rápidas.</p>
        <button className="primary-button" type="button" onClick={playIntro}>
          Comenzar encuesta <span aria-hidden="true">→</span>
        </button>
        {playError && <p className="intro__error" role="alert">{playError}</p>}
      </section>

      {playing && (
        <button className="skip-link" type="button" onClick={onStart}>
          Saltar vídeo
        </button>
      )}
    </main>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div className="progress" aria-label={`Pregunta ${current + 1} de ${steps.length}`}>
      <div className="progress__meta">
        <span>Encuesta de lanzamiento</span>
        <span>{String(current + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
      </div>
      <div className="progress__track">
        <span style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

function Survey({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [transitioning, setTransitioning] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const loadDraft = window.setTimeout(() => {
      try {
        const draft = JSON.parse(localStorage.getItem(STORAGE_DRAFT) ?? "null") as
          | { answers?: Answers; name?: string; email?: string }
          | null;
        if (draft?.answers) setAnswers(draft.answers);
        if (draft?.name) setName(draft.name);
        if (draft?.email) setEmail(draft.email);
      } catch {
        localStorage.removeItem(STORAGE_DRAFT);
      } finally {
        setDraftLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(loadDraft);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify({ answers, name, email }));
  }, [answers, name, email, draftLoaded]);

  const step = steps[index];
  const value = answers[step.id];
  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = step.type === "contact"
    ? emailValid
    : step.type === "multi"
      ? Array.isArray(value) && value.length > 0
      : typeof value === "string" && value.length > 0;

  const move = (nextIndex: number, nextDirection: "next" | "back") => {
    setDirection(nextDirection);
    setTransitioning(true);
    window.setTimeout(() => {
      setIndex(nextIndex);
      setTransitioning(false);
      requestAnimationFrame(() => headingRef.current?.focus());
    }, 180);
  };

  const submit = () => {
    const response = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      answers,
      contact: { name: name.trim() || null, email: email.trim() || null },
    };
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_RESPONSES) ?? "[]") as unknown[];
      localStorage.setItem(STORAGE_RESPONSES, JSON.stringify([...stored, response]));
      localStorage.removeItem(STORAGE_DRAFT);
    } catch {
      localStorage.setItem(STORAGE_RESPONSES, JSON.stringify([response]));
    }
    onDone();
  };

  const next = () => {
    if (!canContinue) return;
    if (index === steps.length - 1) submit();
    else move(index + 1, "next");
  };

  const toggleMulti = (option: string) => {
    const current = Array.isArray(value) ? value : [];
    setAnswers((previous) => ({
      ...previous,
      [step.id]: current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    }));
  };

  return (
    <main className="survey-shell">
      <div className="ambient ambient--pink" />
      <div className="ambient ambient--yellow" />
      <header className="survey-header">
        <Image src="/assets/mcb-logo.png" width={1254} height={1254} alt="The Mother Coffee Baby" priority />
        <p><Bolt /> Huila · Colombia · 86+ SCA</p>
      </header>

      <section className="survey-layout">
        <aside className="survey-art" aria-hidden="true">
          <Image src="/assets/etiqueta-muestras-2026.png" width={1145} height={1374} alt="" priority />
        </aside>

        <div className="survey-card">
          <Progress current={index} />
          <div className={`step ${transitioning ? `step--out-${direction}` : ""}`}>
            <p className="step__eyebrow">Pregunta {index + 1} · {step.eyebrow}</p>
            <h1 ref={headingRef} tabIndex={-1}>{step.question}</h1>

            {step.type === "contact" ? (
              <div className="contact-fields">
                <p>Déjanos tus datos y te avisaremos antes que a nadie. Es opcional y sin spam.</p>
                <label>
                  <span>Nombre</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Tu nombre" />
                </label>
                <label>
                  <span>Correo electrónico</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    aria-invalid={!emailValid}
                    aria-describedby="email-error"
                  />
                </label>
                <p id="email-error" className={`field-message ${email && !emailValid ? "field-message--error" : ""}`}>
                  {email && !emailValid ? "Escribe un correo válido o deja el campo vacío." : "Puedes finalizar sin registrar tus datos."}
                </p>
              </div>
            ) : (
              <div className="options" role={step.type === "single" ? "radiogroup" : "group"} aria-label={step.question}>
                {step.options.map((option, optionIndex) => {
                  const selected = step.type === "multi"
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`option ${selected ? "option--selected" : ""}`}
                      onClick={() => step.type === "multi"
                        ? toggleMulti(option.value)
                        : setAnswers((previous) => ({ ...previous, [step.id]: option.value }))}
                      role={step.type === "single" ? "radio" : "checkbox"}
                      aria-checked={selected}
                    >
                      <span className="option__number">{String(optionIndex + 1).padStart(2, "0")}</span>
                      <span className="option__icon" aria-hidden="true">{option.icon}</span>
                      <span className="option__label">{option.label}</span>
                      <span className="option__check" aria-hidden="true">{selected ? "✓" : "→"}</span>
                    </button>
                  );
                })}
                {step.type === "multi" && <p className="selection-note">Puedes elegir más de una opción.</p>}
              </div>
            )}

            <nav className="survey-actions" aria-label="Navegación de la encuesta">
              <button type="button" className="back-button" disabled={index === 0} onClick={() => move(index - 1, "back")}>
                ← Atrás
              </button>
              <button type="button" className="primary-button" disabled={!canContinue} onClick={next}>
                {index === steps.length - 1 ? "Enviar respuestas" : "Continuar"} <span aria-hidden="true">→</span>
              </button>
            </nav>
          </div>
        </div>
      </section>

      <footer className="brand-strip">
        <span>100% colombiano</span><i />
        <span>Tostado artesanal</span><i />
        <span>Real · salvaje · sin reglas</span>
      </footer>
    </main>
  );
}

function ThankYou({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="thanks">
      <div className="ambient ambient--pink" />
      <section className="thanks__copy">
        <p className="kicker"><Bolt /> Respuestas recibidas</p>
        <h1>¡Gracias,<br /><span>coffee rebel!</span></h1>
        <p>Tu opinión está ayudando a construir el café de especialidad que Colombia merece.</p>
        <button className="secondary-button" type="button" onClick={onRestart}>Volver a responder ↗</button>
      </section>
      <div className="thanks__art">
        <Image src="/assets/mcb-presentacion.png" width={1402} height={1122} alt="Línea de productos The Mother Coffee Baby" priority />
      </div>
    </main>
  );
}

export default function SurveyApp() {
  const [phase, setPhase] = useState<Phase>("intro");

  return phase === "intro" ? (
    <Intro onStart={() => setPhase("survey")} />
  ) : phase === "survey" ? (
    <Survey onDone={() => setPhase("done")} />
  ) : (
    <ThankYou onRestart={() => setPhase("survey")} />
  );
}
