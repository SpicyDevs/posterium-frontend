import React, { useMemo, useState } from 'react';

const POSTER_TITLES = [
  'Midnight Signal',
  'The Last Orbit',
  'Glass City',
  'Northern Bloom',
  'Static Hearts',
  'Velvet Run',
  'Solar Drift',
  'Hidden Coast',
  'Neon Valley',
  'Quiet Thunder',
  'Paper Moons',
  'Arcade Summer',
];

const PALETTES = [
  ['#24111f', '#7c2d12', '#f97316'],
  ['#08111f', '#1d4ed8', '#38bdf8'],
  ['#111827', '#581c87', '#e879f9'],
  ['#10140f', '#166534', '#86efac'],
  ['#190b0b', '#991b1b', '#fca5a5'],
  ['#111112', '#334155', '#f8fafc'],
];

const DEFAULT_CHOICES = ['Movie night', 'Series binge', 'Anime marathon', 'Documentary deep dive'];

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const SimpleChoiceBuilder: React.FC = () => {
  const [question, setQuestion] = useState('What should we watch tonight?');
  const [choices, setChoices] = useState(DEFAULT_CHOICES);
  const [selectedChoice, setSelectedChoice] = useState(0);

  const posters = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => {
        const palette = PALETTES[index % PALETTES.length];
        const title = POSTER_TITLES[index % POSTER_TITLES.length];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".56" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs><rect width="200" height="300" fill="url(#g)"/><circle cx="150" cy="64" r="56" fill="rgba(255,255,255,.15)"/><rect x="18" y="198" width="164" height="70" rx="14" fill="rgba(0,0,0,.42)"/><text x="100" y="230" fill="white" font-family="system-ui,sans-serif" font-size="18" font-weight="800" text-anchor="middle">${title}</text><text x="100" y="252" fill="rgba(255,255,255,.72)" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle">POSTERIUM PICK</text></svg>`;
        return { alt: `${title} poster tile`, src: svgToDataUrl(svg) };
      }),
    []
  );

  const updateChoice = (index: number, value: string) => {
    setChoices((current) =>
      current.map((choice, choiceIndex) => (choiceIndex === index ? value : choice))
    );
  };

  const addChoice = () => {
    setChoices((current) => [...current, `Choice ${current.length + 1}`]);
  };

  const removeChoice = (index: number) => {
    setChoices((current) => current.filter((_, choiceIndex) => choiceIndex !== index));
    setSelectedChoice((current) => Math.max(0, Math.min(current, choices.length - 2)));
  };

  const safeChoices = choices.filter((choice) => choice.trim());
  const winningChoice = safeChoices[selectedChoice] ?? safeChoices[0] ?? 'Your pick';

  return (
    <div className="simple-choice-page">
      <div className="simple-choice-bg" aria-hidden="true">
        <div className="simple-choice-grid">
          {[...posters, ...posters].map((poster, index) => (
            <img key={`${poster.alt}-${index}`} src={poster.src} alt="" loading="lazy" />
          ))}
        </div>
      </div>
      <div className="simple-choice-overlay" />
      <main className="simple-choice-center" aria-labelledby="simple-choice-title">
        <section className="simple-choice-card">
          <div className="simple-choice-mark">P</div>
          <p className="simple-choice-kicker">Guided Mode</p>
          <h1 id="simple-choice-title">Choice Posters</h1>
          <p className="simple-choice-subtitle">
            Create a shareable poster from one simple multiple-choice question.
          </p>

          <div className="simple-choice-builder" aria-label="Multiple choice poster builder">
            <label className="simple-choice-label" htmlFor="choice-question">
              Question
            </label>
            <input
              id="choice-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question"
            />

            <div className="simple-choice-list">
              {choices.map((choice, index) => (
                <div className="simple-choice-row" key={index}>
                  <button
                    className={selectedChoice === index ? 'is-selected' : ''}
                    type="button"
                    onClick={() => setSelectedChoice(index)}
                    aria-label={`Mark choice ${index + 1} as selected`}
                  >
                    {String.fromCharCode(65 + index)}
                  </button>
                  <input
                    value={choice}
                    onChange={(event) => updateChoice(index, event.target.value)}
                  />
                  {choices.length > 2 && (
                    <button
                      type="button"
                      className="simple-choice-remove"
                      onClick={() => removeChoice(index)}
                      aria-label="Remove choice"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button className="simple-choice-secondary" type="button" onClick={addChoice}>
              Add choice
            </button>
          </div>

          <article className="simple-choice-preview" aria-label="Generated poster preview">
            <span>Poster Preview</span>
            <h2>{question || 'Your question'}</h2>
            <div className="simple-choice-options">
              {safeChoices.map((choice, index) => (
                <p
                  className={index === selectedChoice ? 'is-winner' : ''}
                  key={`${choice}-${index}`}
                >
                  <strong>{String.fromCharCode(65 + index)}</strong> {choice}
                </p>
              ))}
            </div>
            <footer>{winningChoice}</footer>
          </article>
        </section>
      </main>
    </div>
  );
};

export default SimpleChoiceBuilder;
