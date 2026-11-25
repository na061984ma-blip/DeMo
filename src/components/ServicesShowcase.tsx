import {
  ArrowRight,
  Compass,
  DraftingCompass,
  KeyRound,
  Layers,
  MapPin,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useState } from 'react';

interface ServicesShowcaseProps {
  onExploreVentures?: () => void;
  onOpenExplorer?: () => void;
}

interface ServiceCardData {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  summary: string;
  imageUrl: string;
  icon: 'compass' | 'architecture' | 'spatial' | 'stewardship';
  metrics: { label: string; value: string }[];
}

const SERVICE_CARDS: ServiceCardData[] = [
  {
    id: 'masterplanning',
    num: '01',
    title: 'Masterplanning & Land Curation',
    subtitle: 'Solar Orientation & Green Buffers',
    summary:
      'Dual-avenue site selection engineered for cross-breeze corridors and uninterrupted daylight access.',
    imageUrl: '/assets/aistudio/Sky_Crest_Residences_exterior_re__0a5c2d41_fd0f8f3f.jpg',
    icon: 'compass',
    metrics: [
      { label: 'Open Landscape', value: '62%' },
      { label: 'Solar Aspects', value: '8-Dir' },
    ],
  },
  {
    id: 'architecture',
    num: '02',
    title: 'Bespoke Residential Architecture',
    subtitle: 'Structural Clarity & Craft Materials',
    summary:
      'Stepped biophilic terraces framed in anodized bronze louvers, kiln-fired brick, and timber soffits.',
    imageUrl: '/assets/aistudio/Aurelia_Heights_architectural_ex__97f0b4b8_6ae1b964.jpg',
    icon: 'architecture',
    metrics: [
      { label: 'Slab Height', value: '11.2 ft' },
      { label: 'Glazing', value: 'Acoustic' },
    ],
  },
  {
    id: 'spatial-tour',
    num: '03',
    title: 'Interactive Spatial Exploration',
    subtitle: 'Floor-to-Flat Digital Twin Walkthroughs',
    summary:
      'Step seamlessly from building elevation to your exact floor, flat layout, and furnished 3D rooms.',
    imageUrl: '/assets/aistudio/3D_architectural_floor_plan_cutaway_61c14620_c312f326.jpg',
    icon: 'spatial',
    metrics: [
      { label: 'Floor Plans', value: '3D Cut' },
      { label: 'Room Links', value: 'Direct' },
    ],
  },
  {
    id: 'stewardship',
    num: '04',
    title: 'Handover & Residency Stewardship',
    subtitle: 'Measured Carpet Verification & Care',
    summary:
      'Verified carpet-to-super-built-up geometry paired with dedicated preventative building management.',
    imageUrl: '/assets/aistudio/Saffron_Quarters_building_exteri__c369f494_2fe1be16.jpg',
    icon: 'stewardship',
    metrics: [
      { label: 'Area Audit', value: '100%' },
      { label: 'Concierge', value: '24 / 7' },
    ],
  },
];

const JOURNEY_STEPS = [
  { step: '01', title: 'Site Study', detail: '8-direction wind & sun mapping', icon: Sun },
  { step: '02', title: 'Structural Frame', detail: 'Podium & stepped floorplates', icon: Layers },
  { step: '03', title: '3D Twin Review', detail: 'Flat-level room inspection', icon: DraftingCompass },
  { step: '04', title: 'Key Handover', detail: 'Verified survey & concierge', icon: KeyRound },
];

function ServiceDiagram({ type }: { type: ServiceCardData['icon'] }) {
  if (type === 'compass') {
    return (
      <svg viewBox="0 0 180 76" className="w-full h-16" aria-hidden="true">
        <rect x="6" y="8" width="168" height="60" rx="8" fill="#FAF7F2" stroke="#0E3A3D" strokeOpacity="0.12" />
        <circle cx="44" cy="38" r="20" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" />
        <path d="M44 21 L49 38 L44 55 L39 38 Z" fill="#0D9488" fillOpacity="0.25" />
        <path d="M44 22 L47 38 L44 38 Z" fill="#0E3A3D" />
        <circle cx="44" cy="38" r="2.5" fill="#0E3A3D" />
        <path d="M80 28 H156 M80 40 H142 M80 52 H126" stroke="#0E3A3D" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
        <circle cx="156" cy="28" r="3" fill="#0D9488" />
        <circle cx="142" cy="40" r="3" fill="#8D6A7B" />
        <circle cx="126" cy="52" r="3" fill="#14B8A6" />
      </svg>
    );
  }
  if (type === 'architecture') {
    return (
      <svg viewBox="0 0 180 76" className="w-full h-16" aria-hidden="true">
        <rect x="6" y="8" width="168" height="60" rx="8" fill="#FAF7F2" stroke="#0E3A3D" strokeOpacity="0.12" />
        <rect x="24" y="48" width="76" height="10" rx="2" fill="#0E3A3D" fillOpacity="0.85" />
        <rect x="30" y="36" width="64" height="10" rx="2" fill="#0D9488" fillOpacity="0.8" />
        <rect x="38" y="24" width="48" height="10" rx="2" fill="#14B8A6" fillOpacity="0.7" />
        <rect x="46" y="14" width="32" height="8" rx="2" fill="#8D6A7B" fillOpacity="0.75" />
        <line x1="116" y1="18" x2="116" y2="58" stroke="#0E3A3D" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="124" y="30" fontSize="8" fill="#0E3A3D" fontFamily="monospace">TERRACE</text>
        <text x="124" y="44" fontSize="8" fill="#0D9488" fontFamily="monospace">PODIUM</text>
        <text x="124" y="56" fontSize="8" fill="#4A6567" fontFamily="monospace">BASE</text>
      </svg>
    );
  }
  if (type === 'spatial') {
    return (
      <svg viewBox="0 0 180 76" className="w-full h-16" aria-hidden="true">
        <rect x="6" y="8" width="168" height="60" rx="8" fill="#FAF7F2" stroke="#0E3A3D" strokeOpacity="0.12" />
        <rect x="22" y="20" width="36" height="36" rx="4" fill="#FFFFFF" stroke="#0E3A3D" strokeWidth="1.5" />
        <rect x="64" y="20" width="48" height="20" rx="4" fill="#0D9488" fillOpacity="0.14" stroke="#0D9488" strokeWidth="1.5" />
        <rect x="64" y="44" width="22" height="12" rx="3" fill="#8D6A7B" fillOpacity="0.18" stroke="#8D6A7B" strokeWidth="1.2" />
        <rect x="90" y="44" width="22" height="12" rx="3" fill="#FFFFFF" stroke="#0E3A3D" strokeOpacity="0.4" strokeWidth="1.2" />
        <path d="M124 38 L156 38 M149 32 L156 38 L149 44" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="40" cy="38" r="4" fill="#0D9488" />
        <circle cx="88" cy="30" r="3" fill="#0E3A3D" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 76" className="w-full h-16" aria-hidden="true">
      <rect x="6" y="8" width="168" height="60" rx="8" fill="#FAF7F2" stroke="#0E3A3D" strokeOpacity="0.12" />
      <rect x="22" y="22" width="136" height="10" rx="5" fill="#E6EFEF" />
      <rect x="22" y="22" width="106" height="10" rx="5" fill="#0D9488" />
      <rect x="22" y="40" width="136" height="10" rx="5" fill="#E6EFEF" />
      <rect x="22" y="40" width="122" height="10" rx="5" fill="#0E3A3D" />
      <text x="22" y="61" fontSize="7.5" fill="#4A6567" fontFamily="monospace">CARPET 78% · STRUCTURAL 22%</text>
    </svg>
  );
}

function CardIcon({ type }: { type: ServiceCardData['icon'] }) {
  if (type === 'compass') return <Compass className="w-5 h-5 text-[#0D9488]" />;
  if (type === 'architecture') return <DraftingCompass className="w-5 h-5 text-[#0D9488]" />;
  if (type === 'spatial') return <Layers className="w-5 h-5 text-[#0D9488]" />;
  return <ShieldCheck className="w-5 h-5 text-[#0D9488]" />;
}

export function ServicesShowcase({ onExploreVentures, onOpenExplorer }: ServicesShowcaseProps) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="services-section" className="border-b border-[#0E3A3D]/10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">
              Visual Engineering &amp; Advisory
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#0E3A3D] mt-2">
              How Every Meridian Residence Is Crafted
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenExplorer && (
              <button
                type="button"
                onClick={onOpenExplorer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E3A3D] hover:bg-[#164E52] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Open 3D Explorer</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#14B8A6]" />
              </button>
            )}
            {onExploreVentures && (
              <button
                type="button"
                onClick={onExploreVentures}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0E3A3D]/15 hover:border-[#0D9488] text-[#0E3A3D] text-xs font-semibold transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Browse Ventures</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Image + Diagram Cards Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICE_CARDS.map((card) => (
            <article
              key={card.id}
              className="group bg-white border border-[#0E3A3D]/12 rounded-xl overflow-hidden hover:border-[#0D9488] hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Top Architectural Image Banner */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-[#0E3A3D]/5">
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E3A3D]/80 via-[#0E3A3D]/20 to-transparent" />
                <div className="absolute top-3.5 left-3.5 w-10 h-10 rounded-lg bg-white/95 flex items-center justify-center shadow-sm">
                  <CardIcon type={card.icon} />
                </div>
                <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-[11px] font-medium text-[#14B8A6]">
                      {card.num} · {card.subtitle}
                    </p>
                    <h3 className="font-editorial text-2xl font-semibold leading-tight mt-0.5">
                      {card.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Concise Copy + Visual Metrics + SVG Infographic */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-[#3B5557] leading-relaxed">{card.summary}</p>

                <ServiceDiagram type={card.icon} />

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#0E3A3D]/10">
                  {card.metrics.map((m) => (
                    <div key={m.label} className="bg-[#FAF7F2] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-[#4A6567]">{m.label}</span>
                      <span className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Interactive 4-Stage Architectural Workflow Diagram */}
        <div className="mt-10 bg-[#FAF7F2] border border-[#0E3A3D]/12 rounded-xl p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-semibold text-[#0E3A3D]">
                Interactive Delivery &amp; Spatial Blueprint Flow
              </h3>
            </div>
            <span className="text-xs text-[#4A6567]">
              Select a stage to inspect workflow details
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {JOURNEY_STEPS.map((st, idx) => {
              const Icon = st.icon;
              const active = activeStep === idx;
              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`text-left rounded-xl p-4 border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0E3A3D] text-white border-[#0E3A3D] shadow-sm'
                      : 'bg-white text-[#0E3A3D] border-[#0E3A3D]/10 hover:border-[#0D9488]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        active ? 'text-[#14B8A6]' : 'text-[#8D6A7B]'
                      }`}
                    >
                      {st.step}
                    </span>
                    <Icon className={`w-4 h-4 ${active ? 'text-[#14B8A6]' : 'text-[#0D9488]'}`} />
                  </div>
                  <p className="text-sm font-semibold mt-2">{st.title}</p>
                  <p
                    className={`text-xs mt-1 ${
                      active ? 'text-white/80' : 'text-[#4A6567]'
                    }`}
                  >
                    {st.detail}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
