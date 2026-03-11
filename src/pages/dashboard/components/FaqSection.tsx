// src/pages/dashboard/components/FaqSection.tsx
// This component renders the FAQ visually AND matches the FAQPage schema in index.html.
// Google can show FAQ rich results for this content.
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import FadeSection from './FadeSection';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'What is Posterium?',
    a: 'Posterium is a free, open-source tool that generates custom movie and TV show posters with live rating badges from IMDb, Rotten Tomatoes, Metacritic, TMDB, Letterboxd, and more. It provides a visual drag-and-drop editor and exports a single API URL you can use anywhere — no account required.',
  },
  {
    q: 'How do I use Posterium with Plex or Jellyfin?',
    a: 'Open the free builder, search for your movie or TV show, position the rating badges where you want them, then copy the generated API URL. In Plex or Jellyfin, edit the item metadata and paste the URL as a custom poster image. The poster includes live ratings and looks great in any media server.',
  },
  {
    q: 'Is Posterium completely free?',
    a: 'Yes — Posterium is 100% free with no rate limits, no API keys required, and no account needed. The source code is open on GitHub so you can self-host it too.',
  },
  {
    q: 'What rating sources are supported?',
    a: 'Posterium supports IMDb, Rotten Tomatoes Tomatometer, Rotten Tomatoes Audience Score (Popcornmeter), Metacritic, TMDB, Letterboxd, MyAnimeList, AniList, plus runtime and age rating badges.',
  },
  {
    q: 'What image formats does the API return?',
    a: 'The API can return posters in SVG (vector, perfect quality at any size), PNG, JPG, and WebP formats. Just change the file extension in the URL.',
  },
  {
    q: 'Can I use this for TV shows and anime?',
    a: 'Yes. Posterium supports movies, TV series, and anime. For anime, MyAnimeList and AniList score badges are available in addition to the standard badges.',
  },
  {
    q: 'How do I embed a poster in Notion or Discord?',
    a: 'Copy the API URL from the builder. In Notion, use an Image block and paste the URL. In Discord, paste the URL directly into a message — it will auto-embed as an image. For Discord bots, use the URL as the image field in a rich embed.',
  },
];

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <FadeSection>
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">FAQ</p>
            <h2 id="faq-heading" className="text-3xl sm:text-4xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
              Everything you need to know about Posterium.
            </p>
          </div>
        </FadeSection>

        <FadeSection delay={100}>
          {/* itemScope/itemType help Google parse the FAQ schema from HTML too */}
          <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
            {FAQS.map((item, i) => (
              <div
                key={i}
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
                className="rounded-xl border border-white/[0.07] bg-[#0d0d0f] overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                  aria-expanded={openIndex === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span
                    itemProp="name"
                    className="text-[13px] sm:text-[14px] font-semibold text-zinc-200"
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    size={15}
                    className={clsx(
                      'text-zinc-600 flex-shrink-0 transition-transform duration-200',
                      openIndex === i && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                  className={clsx(
                    'overflow-hidden transition-all duration-300',
                    openIndex === i ? 'max-h-96' : 'max-h-0',
                  )}
                >
                  <p
                    itemProp="text"
                    className="px-5 pb-5 pt-0 text-[13px] text-zinc-500 leading-relaxed"
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FadeSection>
      </div>
    </section>
  );
};

export default FaqSection;