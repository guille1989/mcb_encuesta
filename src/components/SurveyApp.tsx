"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string; icon: string };
type Step = {
  id: string;
  question: string;
  eyebrow: string;
  type: "single" | "multi" | "open";
  options: Option[];
};
type Answers = Record<string, string | string[]>;
type Phase = "intro" | "survey" | "done";

const STORAGE_DRAFT = "mcb-brand-survey-draft-v2";
const STORAGE_RESPONSES = "mcb-brand-survey-responses-v2";

const steps: Step[] = [
  {
    id: "brand_impression",
    eyebrow: "Primera impresión",
    question: "Al ver The Mother Coffee Baby por primera vez, ¿qué impresión te genera la marca?",
    type: "single",
    options: [
      { value: "love_it", label: "Me encanta, tiene mucha personalidad", icon: "🔥" },
      { value: "like_it", label: "Me gusta", icon: "👍" },
      { value: "indifferent", label: "Me es indiferente", icon: "😐" },
      { value: "no_connection", label: "No conecta conmigo", icon: "👎" },
      { value: "unclear", label: "No entiendo muy bien el concepto", icon: "😵" },
    ],
  },
  {
    id: "visual_style_rating",
    eyebrow: "Estilo visual",
    question: "¿Qué tanto te gusta la imagen y el estilo visual de la marca?",
    type: "single",
    options: [
      { value: "5", label: "5 — Me encanta", icon: "5" },
      { value: "4", label: "4 — Me gusta bastante", icon: "4" },
      { value: "3", label: "3 — Está bien", icon: "3" },
      { value: "2", label: "2 — Me gusta poco", icon: "2" },
      { value: "1", label: "1 — No me gusta", icon: "1" },
    ],
  },
  {
    id: "trial_intent",
    eyebrow: "Intención de prueba",
    question: "Si vieras este café en una tienda o cafetería, ¿te darían ganas de probarlo?",
    type: "single",
    options: [
      { value: "definitely_yes", label: "Sí, definitivamente", icon: "✓" },
      { value: "probably_yes", label: "Probablemente sí", icon: "+" },
      { value: "maybe", label: "Tal vez", icon: "~" },
      { value: "probably_no", label: "Probablemente no", icon: "−" },
      { value: "no", label: "No", icon: "×" },
    ],
  },
  {
    id: "brand_attractions",
    eyebrow: "Lo que conecta",
    question: "¿Qué es lo que más te atrae de The Mother Coffee Baby?",
    type: "multi",
    options: [
      { value: "name", label: "El nombre", icon: "Aa" },
      { value: "logo", label: "El logo", icon: "◎" },
      { value: "packaging", label: "El diseño / empaque", icon: "▧" },
      { value: "personality", label: "La personalidad irreverente", icon: "⚡" },
      { value: "specialty", label: "Que sea café de especialidad", icon: "★" },
      { value: "origin_quality", label: "El origen / calidad del café", icon: "◆" },
      { value: "nothing", label: "Nada en particular", icon: "○" },
    ],
  },
  {
    id: "price_willingness",
    eyebrow: "Precio esperado",
    question: "¿Cuánto estarías dispuesto/a a pagar por una bolsa de 250 g de café de especialidad como esta?",
    type: "single",
    options: [
      { value: "under_8", label: "Menos de 8 €", icon: "€" },
      { value: "8_10", label: "8–10 €", icon: "€" },
      { value: "10_12", label: "10–12 €", icon: "€€" },
      { value: "12_15", label: "12–15 €", icon: "€€" },
      { value: "15_18", label: "15–18 €", icon: "€€€" },
      { value: "over_18", label: "Más de 18 €", icon: "€€€" },
    ],
  },
  {
    id: "purchase_at_1290",
    eyebrow: "Decisión de compra",
    question: "Si una bolsa de 250 g de The Mother Coffee Baby costara 12,90 €, ¿la comprarías?",
    type: "single",
    options: [
      { value: "yes", label: "Sí", icon: "✓" },
      { value: "probably_yes", label: "Probablemente sí", icon: "+" },
      { value: "maybe", label: "Tal vez", icon: "~" },
      { value: "probably_no", label: "Probablemente no", icon: "−" },
      { value: "no", label: "No", icon: "×" },
    ],
  },
  {
    id: "purchase_requirements",
    eyebrow: "Tu respuesta",
    question: "¿Qué tendría que tener este café o esta marca para que dijeras: “lo compraría”?",
    type: "open",
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
        <p className="intro__copy">Primero sube el volumen. Después del vídeo comenzarán siete preguntas rápidas.</p>
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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [transitioning, setTransitioning] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const loadDraft = window.setTimeout(() => {
      try {
        const draft = JSON.parse(localStorage.getItem(STORAGE_DRAFT) ?? "null") as
          | { answers?: Answers }
          | null;
        if (draft?.answers) setAnswers(draft.answers);
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
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify({ answers }));
  }, [answers, draftLoaded]);

  const step = steps[index];
  const value = answers[step.id];
  const canContinue = step.type === "multi"
      ? Array.isArray(value) && value.length > 0
      : typeof value === "string" && value.trim().length > 0;

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
    if (option === "nothing") {
      setAnswers((previous) => ({
        ...previous,
        [step.id]: current.includes("nothing") ? [] : ["nothing"],
      }));
      return;
    }

    const currentWithoutNothing = current.filter((item) => item !== "nothing");
    setAnswers((previous) => ({
      ...previous,
      [step.id]: currentWithoutNothing.includes(option)
        ? currentWithoutNothing.filter((item) => item !== option)
        : [...currentWithoutNothing, option],
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

            {step.type === "open" ? (
              <div className="open-response">
                <label htmlFor="purchase-requirements">Cuéntanos qué haría la diferencia</label>
                <textarea
                  id="purchase-requirements"
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => setAnswers((previous) => ({
                    ...previous,
                    [step.id]: event.target.value,
                  }))}
                  placeholder="Escribe tu respuesta aquí..."
                  rows={6}
                  maxLength={800}
                />
                <p className="field-message">Máximo 800 caracteres.</p>
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
