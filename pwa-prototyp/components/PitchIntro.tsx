'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'

// Cinematische Pitch-Intro: läuft als eigene Route (/pitch) im SELBEN Stack wie der Reader,
// damit der Übergang in die Live-Demo nahtlos ist (kein Keynote→Browser-Wechsel).
// Reine CSS-Animation + ein kleiner React-Schritt-Automat (keine neue Dependency).
//
// Ablauf: Logo → Thesen über Bike-Footage → die vier Magazine → Cover-Reveal → CTA „live".
// Klick auf „Jetzt live erleben" blendet aus und navigiert in den echten Kiosk (/).

type Bg =
  | {kind: 'black'}
  | {kind: 'video'; src: string}
  | {kind: 'cover'}

type Step = {
  ms: number // Dauer dieses Beats (auto-advance); letzter Beat = 0 (bleibt stehen)
  bg: Bg
  kicker?: string
  lines?: string[]
  variant?: 'logo' | 'thesis' | 'magazines' | 'cover'
}

const MAGS = [
  {name: 'ENDURO', logo: '/logos/enduro-neg.png'},
  {name: 'E-MOUNTAINBIKE', logo: '/logos/emtb-neg.png'},
  // GRAN FONDO ist ein gestapeltes Logo (Wappen über Schriftzug) → braucht mehr Höhe,
  // sonst wirkt der Schriftzug winzig (gleiche Logik wie im Reader-Regal, .is-stacked).
  {name: 'GRAN FONDO', logo: '/logos/granfondo-neg.png', stacked: true},
  {name: 'DOWNTOWN', logo: '/logos/downtown-neg.png'},
]

const STEPS: Step[] = [
  {
    ms: 6500,
    bg: {kind: 'black'},
    variant: 'logo',
    kicker: 'Next Level',
    lines: ['Die Magazin-App,', 'neu gedacht.'],
  },
  {
    ms: 9000,
    bg: {kind: 'video', src: '/pitch/clip-1.mp4'},
    variant: 'thesis',
    kicker: 'Bisher',
    lines: ['Digital — aber nie', 'digital gedacht.', 'Aufwändig. Abhängig. Starr.'],
  },
  {
    ms: 9000,
    bg: {kind: 'video', src: '/pitch/clip-2.mp4'},
    variant: 'thesis',
    kicker: 'Jetzt',
    lines: ['Inhalte, die reagieren.', 'Antippen, erkunden,', 'sortieren. Unabhängig.'],
  },
  {
    ms: 9000,
    bg: {kind: 'video', src: '/pitch/clip-3.mp4'},
    variant: 'magazines',
    kicker: 'Vier Magazine. Eine Plattform.',
  },
  {
    ms: 0,
    bg: {kind: 'cover'},
    variant: 'cover',
    kicker: 'E-MOUNTAINBIKE #042 — live',
  },
]

export function PitchIntro() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const last = STEPS.length - 1

  // Vollständig MANUELL: nichts läuft automatisch weiter. Blättern per Klick,
  // Pfeiltasten (←/→), Leertaste/Enter. So bestimmt der Vortragende das Tempo.
  const next = () => setStep((i) => Math.min(i + 1, last))
  const prev = () => setStep((i) => Math.max(i - 1, 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const enter = () => {
    setExiting(true)
    // kurze Ausblende, dann in die 41-Publishing-Übersicht (alle 4 Magazine im Regal)
    setTimeout(() => router.push('/magazine'), 650)
  }

  return (
    <div className={`pitch ${exiting ? 'is-exiting' : ''}`} onClick={next}>
      {/* Hintergrund-Ebenen (alle gemountet, per Opacity gekreuzblendet) */}
      <div className="pitch-bgs" aria-hidden>
        {STEPS.map((s, i) => (
          <div key={i} className={`pitch-bg ${i === step ? 'is-active' : ''}`}>
            {s.bg.kind === 'video' && (
              <video
                src={s.bg.src}
                muted
                loop
                playsInline
                autoPlay
                preload="auto"
                className="pitch-video"
              />
            )}
            {s.bg.kind === 'cover' && (
              <img src="/pitch/cover-emtb-042.jpg" alt="" className="pitch-cover-bg" />
            )}
          </div>
        ))}
        <div className="pitch-scrim" />
      </div>

      {/* Inhalts-Ebenen pro Beat */}
      <div className="pitch-stage">
        {STEPS.map((s, i) => {
          const on = i === step
          return (
            <div key={i} className={`pitch-beat ${on ? 'is-on' : ''} beat--${s.variant}`}>
              {s.variant === 'logo' && (
                <>
                  <img src="/logos/41publishing.png" alt="41 Publishing" className="pitch-logo" />
                  {s.kicker && <p className="pitch-kicker">{s.kicker}</p>}
                  {s.lines && (
                    <h1 className="pitch-h1">
                      {s.lines.map((l, k) => (
                        <span key={k} style={{['--d' as string]: `${k * 220}ms`}}>{l}</span>
                      ))}
                    </h1>
                  )}
                </>
              )}

              {s.variant === 'thesis' && (
                <>
                  {s.kicker && <p className="pitch-kicker">{s.kicker}</p>}
                  {s.lines && (
                    <h2 className="pitch-h2">
                      {s.lines.map((l, k) => (
                        <span key={k} style={{['--d' as string]: `${k * 200}ms`}}>{l}</span>
                      ))}
                    </h2>
                  )}
                </>
              )}

              {s.variant === 'magazines' && (
                <>
                  {s.kicker && <p className="pitch-kicker pitch-kicker--center">{s.kicker}</p>}
                  <div className="pitch-mags">
                    {MAGS.map((m, k) => (
                      <div
                        key={m.name}
                        className={`pitch-mag ${m.stacked ? 'is-stacked' : ''}`}
                        style={{['--d' as string]: `${k * 240}ms`}}
                      >
                        <img src={m.logo} alt={m.name} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {s.variant === 'cover' && (
                <div className="pitch-final">
                  <img src="/pitch/cover-emtb-042.jpg" alt="E-MOUNTAINBIKE #042" className="pitch-cover" />
                  {s.kicker && <p className="pitch-kicker pitch-kicker--center">{s.kicker}</p>}
                  <button
                    className="pitch-cta"
                    onClick={(e) => {
                      e.stopPropagation()
                      enter()
                    }}
                  >
                    Reinschauen <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fortschritts-Punkte (klickbar = direkt zu diesem Beat springen) */}
      <div className="pitch-dots">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={i === step ? 'on' : ''}
            onClick={(e) => {
              e.stopPropagation()
              setStep(i)
            }}
          />
        ))}
      </div>

      {/* manueller Hinweis nur auf dem ersten Beat */}
      {step === 0 && <div className="pitch-hint">Klick · → · Leertaste blättert weiter</div>}

      {/* direkt zum Schluss-Beat (Cover + „live") springen */}
      {step < last && (
        <button
          className="pitch-skip"
          onClick={(e) => {
            e.stopPropagation()
            setStep(last)
          }}
        >
          Überspringen
        </button>
      )}
    </div>
  )
}
