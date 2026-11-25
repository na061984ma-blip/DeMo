import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  Compass,
  LandPlot,
  Layers,
  MapPin,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useVentures } from '../context/VenturesContext';
import { computeProjectStats } from '../data/venturesData';
import { ProjectStatus } from '../types/property';

interface VenturesPageProps {
  onSelectProject: (projectId: string) => void;
}

const STATUS_FILTERS: ('All' | ProjectStatus)[] = [
  'All',
  'Ready to Move',
  'Near Completion',
  'Under Construction',
  'Pre-Launch',
];

export function VenturesPage({ onSelectProject }: VenturesPageProps) {
  const { ventures } = useVentures();
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');

  const filteredVentures = useMemo(() => {
    if (statusFilter === 'All') return ventures;
    return ventures.filter((v) => v.status === statusFilter);
  }, [ventures, statusFilter]);

  const aggregateStats = useMemo(() => {
    return ventures.reduce(
      (acc, v) => {
        const s = computeProjectStats(v);
        acc.totalFlats += s.totalFlats;
        acc.totalFloors += s.totalFloors;
        return acc;
      },
      { totalFlats: 0, totalFloors: 0 }
    );
  }, [ventures]);

  const isSingleResult = filteredVentures.length === 1;

  return (
    <main className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="border-b border-[#0E3A3D]/10 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wider text-[#8D6A7B]">
                Meridian Residential Portfolio
              </p>
              <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#0E3A3D] mt-2 leading-[1.1] text-balance">
                Architectural Ventures &amp; Spatial Apartment Explorers
              </h1>
              <p className="text-[#4A6567] text-base mt-4 leading-relaxed">
                Filter by construction stage and open any development to walk through individual floors, apartment plans, 8-direction site orientations, and interactive 3D rooms.
              </p>
            </div>

            {/* Portfolio Architectural Summary */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 bg-white border border-[#0E3A3D]/10 rounded-xl p-4 sm:p-5 shrink-0">
              <div>
                <p className="text-xs text-[#4A6567]">Ventures</p>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums mt-1">
                  {ventures.length}
                </p>
              </div>
              <div className="border-l border-[#0E3A3D]/10 pl-4 sm:pl-6">
                <p className="text-xs text-[#4A6567]">Total Floors</p>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums mt-1">
                  {aggregateStats.totalFloors}
                </p>
              </div>
              <div className="border-l border-[#0E3A3D]/10 pl-4 sm:pl-6">
                <p className="text-xs text-[#4A6567]">Residences</p>
                <p className="font-mono text-2xl font-semibold text-[#0D9488] tabular-nums mt-1">
                  {aggregateStats.totalFlats}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive 4-Classification Filter Tabs */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0E3A3D] text-white'
                      : 'bg-white text-[#0E3A3D] border border-[#0E3A3D]/15 hover:border-[#0D9488]'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Responsive Project Cards — Full-Width Split when 1 project, Balanced Grid when multiple */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        {filteredVentures.length === 0 ? (
          <div className="bg-[#FAF7F2] border border-[#0E3A3D]/10 rounded-xl p-12 text-center">
            <Building2 className="w-8 h-8 text-[#8D6A7B] mx-auto mb-3" />
            <p className="text-base font-semibold text-[#0E3A3D]">
              No ventures match "{statusFilter}"
            </p>
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0D9488] text-white cursor-pointer"
            >
              Show All Ventures
            </button>
          </div>
        ) : isSingleResult ? (
          /* Single Filtered Result: Uses Full Available Screen Width cleanly */
          (() => {
            const project = filteredVentures[0];
            const stats = computeProjectStats(project);
            return (
              <article
                onClick={() => onSelectProject(project.id)}
                className="group bg-white rounded-2xl border border-[#0E3A3D]/12 overflow-hidden hover:border-[#0D9488]/70 hover:shadow-xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Wide Architectural Image (7 cols) */}
                <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] overflow-hidden bg-[#0E3A3D]/10">
                  <img
                    src={project.mainImage}
                    alt={project.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E3A3D]/80 via-[#0E3A3D]/15 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-xs font-medium text-[#14B8A6] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{project.location}</span>
                    </p>
                    <h2 className="font-editorial text-3xl sm:text-4xl font-semibold mt-1">
                      {project.name}
                    </h2>
                  </div>
                </div>

                {/* Full-Height Specifications & Launch Panel (5 cols) */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-white">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#4A6567]">
                      <span className="text-[#0D9488] font-semibold">{project.status}</span>
                      <span aria-hidden="true">·</span>
                      <span>{project.possessionTimeline}</span>
                      <span aria-hidden="true">·</span>
                      <span>{project.configurations.join(', ')}</span>
                    </div>

                    <p className="text-base text-[#0E3A3D] font-medium mt-4 leading-relaxed">
                      {project.tagline}
                    </p>
                    <p className="text-xs text-[#4A6567] mt-2">{project.address}</p>

                    <p className="text-sm text-[#3B5557] mt-4 leading-relaxed">
                      {project.overview}
                    </p>
                  </div>

                  {/* Architectural Icon Spec Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#0E3A3D]/10">
                    <div className="bg-[#FAF7F2] rounded-xl p-3.5 flex items-center gap-3">
                      <LandPlot className="w-4 h-4 text-[#0D9488] shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Land Area</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums">
                          {project.landAreaSqYds.toLocaleString()} sq.yd
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#FAF7F2] rounded-xl p-3.5 flex items-center gap-3">
                      <Layers className="w-4 h-4 text-[#0D9488] shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Floors</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums">
                          {stats.totalFloors} Levels
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#FAF7F2] rounded-xl p-3.5 flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-[#8D6A7B] shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Total Flats</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums">
                          {stats.totalFlats} Units
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#FAF7F2] rounded-xl p-3.5 flex items-center gap-3">
                      <ArrowUpDown className="w-4 h-4 text-[#8D6A7B] shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Elevators</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums">
                          {project.elevatorsCount} Lifts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#0E3A3D]/10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A6567]">
                      <Compass className="w-4 h-4 text-[#8D6A7B]" />
                      8-Direction Site Views &amp; Floor Explorer
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project.id);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Explore Project</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })()
        ) : (
          /* Multi-Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredVentures.map((project) => {
              const stats = computeProjectStats(project);
              return (
                <article
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="group bg-white rounded-xl border border-[#0E3A3D]/12 overflow-hidden hover:border-[#0D9488]/60 hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Main Project Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0E3A3D]/10">
                    <img
                      src={project.mainImage}
                      alt={project.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E3A3D]/75 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 text-[#FAF7F2]">
                      <div>
                        <p className="text-xs font-medium text-[#FAF7F2]/85 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                          <span>{project.location}</span>
                        </p>
                        <h2 className="font-editorial text-2xl sm:text-3xl font-semibold mt-0.5">
                          {project.name}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#4A6567]">
                        <span className="text-[#0D9488] font-semibold">{project.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.possessionTimeline}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.configurations.join(', ')}</span>
                      </div>

                      <p className="text-sm text-[#3B5557] mt-3 leading-relaxed">
                        {project.tagline}
                      </p>
                      <p className="text-xs text-[#4A6567] mt-2">{project.address}</p>
                    </div>

                    {/* Architectural Specification Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#0E3A3D]/10">
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Land Area</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                          {project.landAreaSqYds.toLocaleString()} sq.yd
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Floors</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                          {stats.totalFloors}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Total Flats</p>
                        <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                          {stats.totalFlats}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#4A6567]">Elevators</p>
                        <p className="font-mono text-sm font-semibold text-[#0D9488] tabular-nums mt-0.5">
                          {project.elevatorsCount} Lifts
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-3 text-xs text-[#4A6567]">
                        <span className="inline-flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-[#8D6A7B]" />
                          8 Directions
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#0D9488]" />
                          {stats.totalFloors} Floors
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project.id);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Explore Project</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
