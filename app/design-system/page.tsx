import {
  Diamond,
  Fleuron,
  GoldRule,
  SmallCaps,
  RomanNumeral,
  CornerBrackets,
  EleganceCard,
  RitualSurface,
} from '@/components/ui';
import ModalPreviewTriggers from './_ModalPreviewTriggers';

export const metadata = { title: 'Design System — Quiet Inheritance' };

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-ivory text-dark">
      {/* HEADER */}
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <SmallCaps tone="muted" tracking="editorial">
            Quiet Inheritance · Vol. I
          </SmallCaps>
          <h1 className="type-display mt-6">Design System.</h1>
          <p className="type-subhead mt-4 text-muted">
            primitives for the year of becoming — observed, indexed, and quietly kept.
          </p>
          <GoldRule variant="fleuron" className="mt-10 max-w-md" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-24 px-8 py-16">
        {/* TYPOGRAPHY */}
        <section>
          <SectionLabel num={1} title="The Letterforms" />
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <p className="type-display">Become quietly.</p>
                <SmallCaps tone="muted" size="xs">
                  Display · Italiana
                </SmallCaps>
              </div>
              <div>
                <h2 className="type-heading text-forest">A Hundred Small Devotions</h2>
                <SmallCaps tone="muted" size="xs">
                  Heading · Gloock
                </SmallCaps>
              </div>
              <div>
                <p className="type-subhead">the days are kept like letters,</p>
                <SmallCaps tone="muted" size="xs">
                  Subhead · Crimson Italic
                </SmallCaps>
              </div>
              <div>
                <p className="type-body max-w-md">
                  Body text is set in Crimson Pro — humanist, calm, tolerant of long passages. A
                  typeface for ledgers and letters, not for billboards.
                </p>
                <SmallCaps tone="muted" size="xs" className="mt-1 block">
                  Body · Crimson Pro · 15/24
                </SmallCaps>
              </div>
              <div>
                <p className="type-caption">Caption — Instrument Sans, 12 pt, muted brown.</p>
                <SmallCaps>Index Label · Tracking 0.22em</SmallCaps>
              </div>
            </div>

            <div className="flex items-start justify-center">
              <EleganceCard variant="forest-deep" padding="lg" brackets className="w-full max-w-sm">
                <SmallCaps tone="gold-light">Numerals · Glyphs of Consequence</SmallCaps>
                <div className="mt-8 flex items-end justify-between">
                  <span className="font-display text-7xl leading-none">30</span>
                  <div className="text-right">
                    <RomanNumeral value={30} className="text-gold text-3xl" />
                    <p className="font-serif-body italic text-parchment mt-1">fifteen . eighteen</p>
                  </div>
                </div>
                <GoldRule variant="diamond" className="mt-6" />
                <p className="type-caption mt-6 font-display text-base text-parchment">
                  0 I II III IV V VI VII VIII IX
                </p>
              </EleganceCard>
            </div>
          </div>
        </section>

        {/* RULES */}
        <section>
          <SectionLabel num={2} title="The Marks" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-6">
              {(['plain', 'diamond', 'fleuron', 'jewel', 'circlet', 'constellation'] as const).map(
                (v) => (
                  <div key={v}>
                    <GoldRule variant={v} />
                    <SmallCaps tone="muted" size="xs" className="mt-2 block">
                      {v}
                    </SmallCaps>
                  </div>
                )
              )}
            </div>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <Diamond size={6} className="text-gold" />
                <Diamond size={10} className="text-gold" />
                <Diamond size={14} className="text-gold" />
                <Diamond size={18} className="text-gold" filled={false} />
                <SmallCaps tone="muted" size="xs">
                  Diamond — sizes & outline
                </SmallCaps>
              </div>
              <div className="flex items-center gap-6">
                <Fleuron size={16} className="text-gold" />
                <Fleuron size={24} className="text-gold" />
                <Fleuron size={32} className="text-gold-deep" />
                <SmallCaps tone="muted" size="xs">
                  Fleuron
                </SmallCaps>
              </div>
            </div>
          </div>
        </section>

        {/* CARDS / SURFACES */}
        <section>
          <SectionLabel num={3} title="The Apparatus" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Countdown – ivory variant */}
            <EleganceCard variant="ivory" padding="lg" brackets>
              <SmallCaps tone="muted">the day · recorded</SmallCaps>
              <p className="mt-6 text-center font-display text-7xl text-forest leading-none">047</p>
              <GoldRule variant="fleuron" className="mt-4" />
              <p className="mt-4 text-center font-serif-body italic text-muted">
                three hundred eighteen remain
              </p>
              <SmallCaps tone="gold" className="mt-4 block text-center">
                v · iv · mmxxvi
              </SmallCaps>
            </EleganceCard>

            {/* Achievement – ritual dark */}
            <EleganceCard variant="forest-deep" padding="lg" brackets grain>
              <div className="flex flex-col items-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold">
                  <div className="absolute inset-1 rounded-full border border-gold-light/40" />
                  <RomanNumeral value={7} className="text-ivory text-3xl" />
                </div>
                <h3 className="mt-6 font-heading text-xl text-ivory">Seventh Devotion</h3>
                <p className="font-serif-body italic text-parchment text-sm mt-1">
                  seven mornings, unbroken.
                </p>
                <GoldRule variant="diamond" className="mt-4 w-32" />
                <SmallCaps tone="gold-light" className="mt-3" size="xs">
                  unlocked · iii · v · mmxxvi
                </SmallCaps>
              </div>
            </EleganceCard>

            {/* Quest – cream */}
            <EleganceCard variant="cream" padding="md">
              <SmallCaps tone="gold-deep">side quest · no. xii</SmallCaps>
              <SmallCaps tone="muted" size="xs" className="block mt-1">
                pillar · style & aura
              </SmallCaps>
              <div className="hairline mt-3" />
              <h3 className="mt-4 font-heading text-xl leading-snug">
                Walk in linen,
                <br />
                say very little.
              </h3>
              <p className="mt-3 font-serif-body italic text-muted text-sm">
                an hour outside, alone, without the telephone.
              </p>
              <div className="mt-6">
                <div className="flex justify-between">
                  <SmallCaps size="xs">experience</SmallCaps>
                  <SmallCaps tone="gold" size="xs">
                    + xv
                  </SmallCaps>
                </div>
                <div className="mt-2 h-px w-full bg-hairline">
                  <div className="h-px w-[62%] bg-gold" />
                </div>
              </div>
              <SmallCaps className="mt-4 block">
                difficulty · <span className="text-gold">◆ ◆</span> ◇
              </SmallCaps>
            </EleganceCard>
          </div>
        </section>

        {/* SWATCHES */}
        <section>
          <SectionLabel num={4} title="The Canon · Seven Materials" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
            {[
              { name: 'Ivory', hex: '#FAF8F4', cls: 'bg-ivory text-dark border border-hairline' },
              { name: 'Cream', hex: '#F0EBE3', cls: 'bg-cream text-dark' },
              { name: 'Parchment', hex: '#E7DFD0', cls: 'bg-parchment text-dark' },
              { name: 'Muted', hex: '#6B5E52', cls: 'bg-muted text-ivory' },
              { name: 'Forest', hex: '#2C3B35', cls: 'bg-forest text-ivory' },
              { name: 'Dark', hex: '#0F1714', cls: 'bg-dark-deep text-ivory' },
              { name: 'Gold', hex: '#B8963E', cls: 'bg-gold text-ivory' },
            ].map((s, i) => (
              <div key={s.name}>
                <div className={`aspect-square ${s.cls} flex items-center justify-center`}>
                  <RomanNumeral value={i + 1} className="text-2xl" />
                </div>
                <SmallCaps tone="dark" className="mt-2 block">
                  {s.name}
                </SmallCaps>
                <p className="font-ui text-[10px] text-muted">{s.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MODAL PREVIEW */}
        <section>
          <SectionLabel num={5} title="The Ceremonial Modals" />
          <ModalPreviewTriggers />
        </section>

        {/* RITUAL SURFACE PREVIEW */}
        <section>
          <SectionLabel num={6} title="The Ritual Surface" />
          <RitualSurface tone="forest-deep" frame="double" className="min-h-[480px]">
            <div className="px-12 py-16 max-w-2xl mx-auto text-center">
              <SmallCaps tone="gold-light" tracking="editorial">
                Library at Dusk
              </SmallCaps>
              <p className="type-display mt-8 text-ivory">Weekly Review</p>
              <GoldRule variant="fleuron" className="mt-8 max-w-xs mx-auto" tone="gold" />
              <p className="font-serif-body italic text-parchment text-xl mt-8">
                "the days are kept like letters,
                <br />
                folded and pressed quietly between covers."
              </p>
              <SmallCaps tone="gold-light" className="mt-10 block">
                ex libris · natalia · mmxxvi
              </SmallCaps>
            </div>
          </RitualSurface>
        </section>
      </div>

      <footer className="border-t border-hairline mt-24">
        <div className="mx-auto max-w-6xl px-8 py-8 flex items-center justify-between">
          <SmallCaps tone="muted" size="xs">
            Design System · Plate I
          </SmallCaps>
          <Fleuron size={14} className="text-gold-deep" />
          <SmallCaps tone="muted" size="xs">
            Quiet Inheritance · MMXXVI
          </SmallCaps>
        </div>
      </footer>
    </main>
  );
}

function SectionLabel({ num, title }: { num: number; title: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-4">
        <RomanNumeral value={num} className="text-gold-deep text-xl" />
        <SmallCaps tone="gold-deep" tracking="editorial">
          {title}
        </SmallCaps>
      </div>
      <div className="hairline-gold mt-3 opacity-30" />
    </div>
  );
}
