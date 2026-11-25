import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useVentures } from '../context/VenturesContext';
import { computeProjectStats } from '../data/venturesData';
import { AppRoute } from './Navbar';
import { ServicesShowcase } from './ServicesShowcase';

interface HomePageProps {
  onNavigate: (route: AppRoute, sectionId?: string) => void;
  onSelectProject: (projectId: string) => void;
}

const TESTIMONIALS = [
  {
    quote:
      'Walking through the interactive floor model and checking afternoon sunlight orientation on Floor 3 gave our family complete confidence before signing.',
    name: 'Dr. Kavita Narayanan',
    role: 'Homeowner, Unit 302 · Saffron Quarter',
    outcome: 'Closed remotely in 14 days',
  },
  {
    quote:
      'Meridian’s structural transparency sets a completely different benchmark. Every carpet area measurement matched our architectural survey to the square foot.',
    name: 'Marcus & Claire Donovan',
    role: 'Residents, Penthouse 401 · Sky Crest Residences',
    outcome: 'Moved in Q3 handover',
  },
  {
    quote:
      'Being able to inspect every elevation corner and step through connected floor plans made comparing Aurelia Heights and BlueBay Terraces effortless.',
    name: 'Henrik Lindqvist',
    role: 'Principal, Nordic Capital Partners',
    outcome: 'Portfolio acquisition of 3 residences',
  },
];

export function HomePage({ onNavigate, onSelectProject }: HomePageProps) {
  const { ventures, submitEnquiry } = useVentures();
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    phone: '',
    projectId: ventures[0]?.id || '',
    message: '',
  });
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totals = useMemo(() => {
    return ventures.reduce(
      (acc, v) => {
        const s = computeProjectStats(v);
        acc.totalFlats += s.totalFlats;
        acc.totalFloors += s.totalFloors;
        acc.landYds += v.landAreaSqYds;
        return acc;
      },
      { totalFlats: 0, totalFloors: 0, landYds: 0 }
    );
  }, [ventures]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formState.fullName.trim() || !formState.email.includes('@') || !formState.phone.trim()) {
      setFormError('Please provide your name, a valid email address, and a contact number.');
      return;
    }
    const proj = ventures.find((v) => v.id === formState.projectId) || ventures[0];
    submitEnquiry({
      projectId: proj.id,
      projectName: proj.name,
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      message: formState.message.trim() || 'General residential & architectural walkthrough enquiry.',
    });
    setSubmitted(true);
    setFormState({
      fullName: '',
      email: '',
      phone: '',
      projectId: ventures[0]?.id || '',
      message: '',
    });
  };

  return (
    <main id="top" className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-[#0E3A3D]/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">
                Meridian Estates · Coastal &amp; Midtown Developments
              </p>
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#0E3A3D] mt-3 leading-[1.08] text-balance">
                Architectural Residences Built for Light, Longevity &amp; Spatial Clarity
              </h1>
              <p className="text-[#4A6567] text-base sm:text-lg mt-5 leading-relaxed max-w-xl">
                Explore four curated residential ventures across Marina Boulevard, Botanical Arts Quarter, Heritage Garden Precinct, and Emerald Ridge with interactive floor-by-floor 3D walkthroughs.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('ventures')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Ventures</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] sm:min-h-[380px] rounded-xl overflow-hidden border border-[#0E3A3D]/12 shadow-sm">
                <img
                  src="/assets/aistudio/Sky_Crest_Residences_building_ex__1843255c_16729b8b.jpg"
                  alt="Sky Crest Residences architectural corner facade"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E3A3D]/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-[#FAF7F2]">
                  <div>
                    <p className="text-xs text-[#14B8A6] font-semibold">Featured Venture</p>
                    <p className="font-editorial text-2xl font-semibold">Sky Crest Residences</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectProject('sky-crest-residences')}
                    className="px-4 py-2 rounded-lg bg-white/15 hover:bg-[#0D9488] text-xs font-semibold text-white border border-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Explore Project
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Portfolio Architectural Summary Strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#FAF7F2] border border-[#0E3A3D]/10 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#0D9488] shrink-0" />
              <div>
                <p className="text-xs text-[#4A6567]">Signature Ventures</p>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                  {ventures.length}
                </p>
              </div>
            </div>
            <div className="lg:border-l border-[#0E3A3D]/10 lg:pl-6 flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#0D9488] shrink-0" />
              <div>
                <p className="text-xs text-[#4A6567]">Total Residences</p>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                  {totals.totalFlats}
                </p>
              </div>
            </div>
            <div className="lg:border-l border-[#0E3A3D]/10 lg:pl-6 flex items-center gap-3">
              <Compass className="w-5 h-5 text-[#8D6A7B] shrink-0" />
              <div>
                <p className="text-xs text-[#4A6567]">Mapped Elevations</p>
                <p className="font-mono text-2xl font-semibold text-[#0D9488] tabular-nums mt-0.5">
                  {totals.totalFloors} Floors
                </p>
              </div>
            </div>
            <div className="lg:border-l border-[#0E3A3D]/10 lg:pl-6 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#8D6A7B] shrink-0" />
              <div>
                <p className="text-xs text-[#4A6567]">Combined Development Land</p>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                  {totals.landYds.toLocaleString()} sq.yd
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-section" className="border-b border-[#0E3A3D]/10 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#0E3A3D]/12 shadow-sm">
                <img
                  src="/assets/aistudio/Aurelia_Heights_architectural_ex__97f0b4b8_6ae1b964.jpg"
                  alt="Aurelia Heights terraced architecture"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">About Us</p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#0E3A3D] mt-2 text-balance">
                Two Decades of Precision Construction &amp; Transparent Property Discovery
              </h2>
              <p className="text-[#3B5557] text-base mt-4 leading-relaxed">
                Meridian Estates develops low-density apartment communities anchored by enduring materials—kiln-fired brick, anodized bronze, natural travertine, and generous botanical podiums. Every residence we deliver is backed by verifiable carpet-to-super-built-up ratios, solar orientation studies, and spatial room walkthroughs.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#0E3A3D]/10">
                  <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0E3A3D]">Verified Area Audits</p>
                    <p className="text-xs text-[#4A6567] mt-1">
                      Carpet, built-up, and land share measurements published upfront for every flat.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#0E3A3D]/10">
                  <Compass className="w-5 h-5 text-[#8D6A7B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0E3A3D]">8-Direction Site Intelligence</p>
                    <p className="text-xs text-[#4A6567] mt-1">
                      Inspect every building corner, floor level, and interior room flow interactively.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Redesigned Visual Services Section */}
      <ServicesShowcase
        onExploreVentures={() => onNavigate('ventures')}
        onOpenExplorer={() => onSelectProject('sky-crest-residences')}
      />

      {/* Projects / Ventures Preview Section */}
      <section id="projects-section" className="border-b border-[#0E3A3D]/10 bg-[#0E3A3D] text-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#14B8A6]">
                Signature Projects
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold mt-2">
                Explore Our Four Residential Ventures
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ventures')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#0D9488] text-[#0E3A3D] hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View All Ventures</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ventures.map((proj) => {
              const s = computeProjectStats(proj);
              return (
                <article
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="group bg-[#164E52] rounded-xl overflow-hidden border border-white/10 hover:border-[#14B8A6] transition-colors cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={proj.mainImage}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] text-[#14B8A6] font-medium">{proj.status}</p>
                      <h3 className="font-editorial text-xl font-semibold text-[#FAF7F2] mt-1">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-[#FAF7F2]/75 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#14B8A6] shrink-0" />
                        <span className="truncate">{proj.location}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-[#FAF7F2]/80">
                        {s.totalFloors} Floors · {s.totalFlats} Flats
                      </span>
                      <span className="text-[#14B8A6] font-sans font-semibold inline-flex items-center gap-1">
                        Explore
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials-section" className="border-b border-[#0E3A3D]/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">
              Resident Perspectives
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#0E3A3D] mt-2">
              Trusted by Homeowners &amp; Architectural Buyers
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="bg-[#FAF7F2] border border-[#0E3A3D]/10 rounded-xl p-6 flex flex-col justify-between"
              >
                <p className="text-sm text-[#3B5557] leading-relaxed">“{t.quote}”</p>
                <footer className="mt-6 pt-4 border-t border-[#0E3A3D]/10">
                  <p className="text-sm font-semibold text-[#0E3A3D]">{t.name}</p>
                  <p className="text-xs text-[#4A6567] mt-0.5">{t.role}</p>
                  <p className="text-xs font-medium text-[#0D9488] mt-1">{t.outcome}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section id="contact-section" className="bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">
                Get in Touch
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#0E3A3D] mt-2">
                Speak With Our Private Advisory Desk
              </h2>
              <p className="text-sm text-[#4A6567] mt-4 leading-relaxed">
                Arrange an on-site architectural walkthrough, request floor-specific pricing schedules, or explore our residences with a senior project advisor.
              </p>

              <div className="mt-8 space-y-4 text-sm text-[#0E3A3D]">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Meridian House, 420 Harbourfront Crescent</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#0D9488]" />
                  <span className="font-mono">+1 (305) 555-0180</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleContactSubmit}
                className="bg-white border border-[#0E3A3D]/12 rounded-xl p-6 sm:p-8 space-y-4"
              >
                {submitted && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-[#DCFCE7] text-[#15803D] text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Your enquiry has been received by our advisory desk. A senior project advisor will follow up shortly.
                    </span>
                  </div>
                )}
                {formError && (
                  <div className="p-3 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-xs font-medium">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0E3A3D] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formState.fullName}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, fullName: e.target.value }))
                      }
                      placeholder="Jordan Mercer"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0E3A3D] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, email: e.target.value }))
                      }
                      placeholder="jordan@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0E3A3D] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, phone: e.target.value }))
                      }
                      placeholder="+1 (305) 555-0142"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0E3A3D] mb-1.5">
                      Venture of Interest
                    </label>
                    <select
                      value={formState.projectId}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, projectId: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm bg-white focus:outline-none focus:border-[#0D9488]"
                    >
                      {ventures.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.location})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1.5">
                    Preferred Configurations or Questions
                  </label>
                  <textarea
                    rows={3}
                    value={formState.message}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, message: e.target.value }))
                    }
                    placeholder="Interested in 3 BHK corner units, floor plans, or architectural guidance..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Request Advisory Callback
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
