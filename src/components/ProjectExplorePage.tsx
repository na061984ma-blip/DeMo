import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bath,
  BedDouble,
  Box,
  Building2,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Expand,
  LandPlot,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVentures } from '../context/VenturesContext';
import { computeProjectStats } from '../data/venturesData';
import {
  DirectionKey,
  FlatUnit,
  GalleryCategory,
  GalleryItem,
} from '../types/property';
import { Apartment3DWalkthrough } from './Apartment3DWalkthrough';

interface ProjectExplorePageProps {
  projectId: string;
  onSelectProject: (projectId: string) => void;
  onBackToVentures: () => void;
}

const DIRECTION_ORDER: DirectionKey[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const DIRECTION_ANGLES: Record<DirectionKey, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

type ExploreStep = 1 | 2 | 3 | 4;

export function ProjectExplorePage({
  projectId,
  onSelectProject,
  onBackToVentures,
}: ProjectExplorePageProps) {
  const { ventures, submitEnquiry } = useVentures();
  const project = useMemo(
    () => ventures.find((v) => v.id === projectId) || ventures[0],
    [ventures, projectId]
  );

  const stats = useMemo(() => computeProjectStats(project), [project]);

  // 4-Step Flow State: 1 Apartment -> 2 Floor -> 3 Flat -> 4 Explore
  const [activeStep, setActiveStep] = useState<ExploreStep>(4);
  const [explorerTab, setExplorerTab] = useState<'spatial3d' | 'compass'>('spatial3d');
  const [activeDirection, setActiveDirection] = useState<DirectionKey>('N');
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(
    project.floors[1]?.floorNumber ?? project.floors[0]?.floorNumber ?? 0
  );
  const [selectedFlatId, setSelectedFlatId] = useState<string>(
    project.floors[1]?.flats[0]?.id ?? project.floors[0]?.flats[0]?.id ?? ''
  );

  // Modals & Gallery
  const [detailModalFlat, setDetailModalFlat] = useState<FlatUnit | null>(null);
  const [galleryCategory, setGalleryCategory] = useState<'All' | GalleryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [floorPlanZoomOpen, setFloorPlanZoomOpen] = useState(false);

  // Enquiry Form
  const enquirySectionRef = useRef<HTMLElement | null>(null);
  const explorerSectionRef = useRef<HTMLElement | null>(null);
  const [enquiryFlatRef, setEnquiryFlatRef] = useState<string>('');
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredVisitDate: '',
    message: '',
  });
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  // Sync defaults when switching project
  useEffect(() => {
    const defaultFloor = project.floors[1] || project.floors[0];
    setSelectedFloorNum(defaultFloor?.floorNumber ?? 0);
    setSelectedFlatId(defaultFloor?.flats[0]?.id ?? '');
    setDetailModalFlat(null);
    setGalleryCategory('All');
    setEnquiryFlatRef('');
  }, [project.id]);

  const activeFloor = useMemo(
    () =>
      project.floors.find((f) => f.floorNumber === selectedFloorNum) ||
      project.floors[0],
    [project.floors, selectedFloorNum]
  );

  const activeFlat: FlatUnit = useMemo(() => {
    const found = activeFloor?.flats.find((f) => f.id === selectedFlatId);
    return found || activeFloor?.flats[0];
  }, [activeFloor, selectedFlatId]);

  const activeDirView = useMemo(
    () =>
      project.directionalViews.find((d) => d.direction === activeDirection) ||
      project.directionalViews[0],
    [project.directionalViews, activeDirection]
  );

  const galleryCategories = useMemo(() => {
    const cats = Array.from(new Set(project.gallery.map((g) => g.category)));
    return ['All', ...cats] as ('All' | GalleryCategory)[];
  }, [project.gallery]);

  const filteredGallery = useMemo(() => {
    if (galleryCategory === 'All') return project.gallery;
    return project.gallery.filter((g) => g.category === galleryCategory);
  }, [project.gallery, galleryCategory]);

  const handleChooseFloor = (floorNum: number, advanceStep = false) => {
    setSelectedFloorNum(floorNum);
    const fl = project.floors.find((f) => f.floorNumber === floorNum);
    if (fl && fl.flats[0]) {
      setSelectedFlatId(fl.flats[0].id);
    }
    if (advanceStep) setActiveStep(3);
  };

  const handleExploreFlat3D = (flat: FlatUnit) => {
    setSelectedFloorNum(flat.floorNumber);
    setSelectedFlatId(flat.id);
    setDetailModalFlat(null);
    setActiveStep(4);
    setExplorerTab('spatial3d');
    explorerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToEnquiry = (flatNum?: string) => {
    if (flatNum) {
      setEnquiryFlatRef(flatNum);
      setEnquiryForm((prev) => ({
        ...prev,
        message: `Enquiring about Flat ${flatNum} at ${project.name}. Please share architectural floor sheets and advisory consultation details.`,
      }));
    }
    setDetailModalFlat(null);
    enquirySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnquiryError('');
    if (
      !enquiryForm.fullName.trim() ||
      !enquiryForm.email.includes('@') ||
      !enquiryForm.phone.trim()
    ) {
      setEnquiryError('Please enter your full name, valid email, and phone number.');
      return;
    }
    submitEnquiry({
      projectId: project.id,
      projectName: project.name,
      flatNumber: enquiryFlatRef || undefined,
      fullName: enquiryForm.fullName.trim(),
      email: enquiryForm.email.trim(),
      phone: enquiryForm.phone.trim(),
      preferredVisitDate: enquiryForm.preferredVisitDate || undefined,
      message:
        enquiryForm.message.trim() ||
        `Property enquiry for ${project.name}${enquiryFlatRef ? ` (Flat ${enquiryFlatRef})` : ''}.`,
    });
    setEnquirySuccess(true);
    setEnquiryForm({
      fullName: '',
      email: '',
      phone: '',
      preferredVisitDate: '',
      message: '',
    });
  };

  const activeLightboxItem: GalleryItem | null =
    lightboxIndex !== null ? filteredGallery[lightboxIndex] || null : null;

  const builtUpRatioPct = Math.min(
    95,
    Math.round((project.totalBuiltUpAreaSqFt / (project.landAreaSqYds * 32)) * 100)
  );

  return (
    <main className="min-h-screen bg-white">
      {/* TOP BAR: Project Title, Location, Back Link & Quick Launch */}
      <section className="border-b border-[#0E3A3D]/10 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={onBackToVentures}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] hover:text-[#0E3A3D] transition-colors cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Ventures</span>
              </button>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#0E3A3D]">
                  {project.name}
                </h1>
                <span className="text-xs font-semibold text-[#0D9488]">
                  {project.status} · {project.possessionTimeline}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#4A6567] mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8D6A7B] shrink-0" />
                <span>{project.address}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveStep(4);
                  setExplorerTab('spatial3d');
                  explorerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Box className="w-4 h-4" />
                <span>Open 3D Explorer</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToEnquiry()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0E3A3D]/20 bg-white text-[#0E3A3D] hover:bg-[#FAF7F2] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Advisory Contact</span>
              </button>
            </div>
          </div>

          {/* 4-STEP INTERACTIVE FLOW BAR: Apartment -> Floor -> Flat -> Explore */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                step: 1 as ExploreStep,
                title: '1. Select Apartment',
                value: project.name,
                icon: Building2,
              },
              {
                step: 2 as ExploreStep,
                title: '2. Select Floor',
                value: activeFloor?.floorLabel || 'Ground Floor',
                icon: Layers,
              },
              {
                step: 3 as ExploreStep,
                title: '3. Select Flat',
                value: activeFlat ? `Flat ${activeFlat.flatNumber} · ${activeFlat.bhkConfig}` : 'Choose Flat',
                icon: BedDouble,
              },
              {
                step: 4 as ExploreStep,
                title: '4. 3D Exploration',
                value: 'Interactive Walkthrough',
                icon: Box,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeStep === item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    setActiveStep(item.step);
                    explorerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0E3A3D] text-white border-[#0E3A3D] shadow-sm'
                      : 'bg-white text-[#0E3A3D] border-[#0E3A3D]/12 hover:border-[#0D9488]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      active ? 'bg-[#0D9488] text-white' : 'bg-[#FAF7F2] text-[#0D9488]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-medium ${
                        active ? 'text-[#14B8A6]' : 'text-[#8D6A7B]'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs font-semibold truncate mt-0.5">{item.value}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-STEP CONNECTED EXPLORER WORKSPACE */}
      <section
        ref={explorerSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-[#0E3A3D]/10"
      >
        {/* STEP 1 PANEL: Select Apartment Venture */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#8D6A7B]">Step 1 of 4</p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D]">
                  Select Residential Apartment Venture
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer self-start"
              >
                <span>Continue to Floor Selection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ventures.map((v) => {
                const isSelected = v.id === project.id;
                const vStats = computeProjectStats(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(v.id);
                      setActiveStep(2);
                    }}
                    className={`group text-left rounded-xl border overflow-hidden transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-md'
                        : 'border-[#0E3A3D]/12 hover:border-[#0D9488]'
                    }`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={v.mainImage}
                        alt={v.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#0D9488] text-white text-[10px] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] font-semibold text-[#0D9488]">{v.status}</p>
                      <h3 className="font-editorial text-xl font-semibold text-[#0E3A3D] mt-0.5">
                        {v.name}
                      </h3>
                      <p className="text-xs text-[#4A6567] mt-1 truncate">{v.location}</p>
                      <div className="mt-3 pt-2.5 border-t border-[#0E3A3D]/10 flex items-center justify-between text-xs text-[#4A6567]">
                        <span>{vStats.totalFloors} Floors</span>
                        <span>{vStats.totalFlats} Flats</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 PANEL: Visual Floor Elevation Selection */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#8D6A7B]">
                  Step 2 of 4 · {project.name}
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D]">
                  Select Building Floor Level
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-semibold cursor-pointer self-start"
              >
                <span>Select Flat on {activeFloor?.floorLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Interactive Vertical Building Floor Stack */}
              <div className="lg:col-span-5 bg-[#FAF7F2] border border-[#0E3A3D]/12 rounded-xl p-5 space-y-2.5">
                <p className="text-xs font-semibold text-[#0E3A3D] mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Architectural Elevation Stack</span>
                </p>
                {[...project.floors].reverse().map((fl) => {
                  const active = fl.floorNumber === activeFloor?.floorNumber;
                  const configs = Array.from(new Set(fl.flats.map((f) => f.bhkConfig)));
                  return (
                    <button
                      key={fl.floorNumber}
                      type="button"
                      onClick={() => handleChooseFloor(fl.floorNumber, true)}
                      className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0E3A3D] text-white border-[#0E3A3D]'
                          : 'bg-white text-[#0E3A3D] border-[#0E3A3D]/10 hover:border-[#0D9488]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                            active ? 'bg-[#0D9488] text-white' : 'bg-[#FAF7F2] text-[#0E3A3D]'
                          }`}
                        >
                          {fl.floorNumber === 0 ? 'G' : `F${fl.floorNumber}`}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{fl.floorLabel}</p>
                          <p className={`text-[11px] ${active ? 'text-white/75' : 'text-[#4A6567]'}`}>
                            {configs.join(' · ')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold inline-flex items-center gap-1 ${
                          active ? 'text-[#14B8A6]' : 'text-[#0D9488]'
                        }`}
                      >
                        {fl.flats.length} Flats
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Floor Cutaway Visual */}
              {activeFloor && (
                <div className="lg:col-span-7 bg-white border border-[#0E3A3D]/12 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#0E3A3D]/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#0E3A3D]">
                        {activeFloor.floorLabel} Architectural Floorplate
                      </p>
                      <p className="text-xs text-[#4A6567]">{activeFloor.floorPlanNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFloorPlanZoomOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#FAF7F2] hover:bg-[#F2ECE3] text-xs font-medium text-[#0E3A3D] cursor-pointer"
                    >
                      <Expand className="w-3.5 h-3.5" />
                      <span>Zoom</span>
                    </button>
                  </div>
                  <div
                    onClick={() => setFloorPlanZoomOpen(true)}
                    className="aspect-[16/9] overflow-hidden bg-[#FAF7F2] cursor-zoom-in"
                  >
                    <img
                      src={activeFloor.floorPlanImage}
                      alt={`${activeFloor.floorLabel} 3D plan`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 PANEL: Select Flat on Floor */}
        {activeStep === 3 && activeFloor && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#8D6A7B]">
                  Step 3 of 4 · {project.name} · {activeFloor.floorLabel}
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D]">
                  Select Residence Unit to Explore in 3D
                </h2>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {project.floors.map((fl) => (
                  <button
                    key={fl.floorNumber}
                    type="button"
                    onClick={() => handleChooseFloor(fl.floorNumber, false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      fl.floorNumber === activeFloor.floorNumber
                        ? 'bg-[#0E3A3D] text-white'
                        : 'bg-[#FAF7F2] text-[#0E3A3D] border border-[#0E3A3D]/10'
                    }`}
                  >
                    {fl.floorLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {activeFloor.flats.map((flat) => {
                const selected = flat.id === activeFlat?.id;
                return (
                  <div
                    key={flat.id}
                    className={`rounded-xl border p-5 transition-all bg-white flex flex-col justify-between ${
                      selected
                        ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20 shadow-md'
                        : 'border-[#0E3A3D]/12 hover:border-[#0D9488]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xl font-bold text-[#0E3A3D] tabular-nums">
                            Flat {flat.flatNumber}
                          </p>
                          <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                            {flat.bhkConfig}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#8D6A7B]">
                          <Compass className="w-3.5 h-3.5" />
                          {flat.facing}
                        </span>
                      </div>

                      {/* Architectural Room Icons */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#3B5557]">
                        <div className="bg-[#FAF7F2] rounded-lg p-2 flex flex-col items-center text-center">
                          <BedDouble className="w-4 h-4 text-[#0D9488]" />
                          <span className="font-mono font-semibold mt-1">{flat.bedrooms} Bed</span>
                        </div>
                        <div className="bg-[#FAF7F2] rounded-lg p-2 flex flex-col items-center text-center">
                          <Bath className="w-4 h-4 text-[#0D9488]" />
                          <span className="font-mono font-semibold mt-1">{flat.bathrooms} Bath</span>
                        </div>
                        <div className="bg-[#FAF7F2] rounded-lg p-2 flex flex-col items-center text-center">
                          <Sun className="w-4 h-4 text-[#8D6A7B]" />
                          <span className="font-mono font-semibold mt-1">{flat.facing}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#0E3A3D]/10 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#4A6567]">Carpet Area</span>
                          <p className="font-mono font-semibold text-[#0E3A3D] tabular-nums">
                            {flat.carpetAreaSqFt.toLocaleString()} sq.ft
                          </p>
                        </div>
                        <div>
                          <span className="text-[#4A6567]">Built-Up</span>
                          <p className="font-mono font-semibold text-[#0E3A3D] tabular-nums">
                            {flat.superBuiltUpAreaSqFt.toLocaleString()} sq.ft
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#0E3A3D]/10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExploreFlat3D(flat)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Explore 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailModalFlat(flat)}
                        className="px-3 py-2.5 rounded-lg border border-[#0E3A3D]/15 hover:border-[#0D9488] text-[#0E3A3D] text-xs font-semibold cursor-pointer"
                      >
                        Specs
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 PANEL: 3D Apartment Exploration + 8-Direction Compass Site Explorer */}
        {activeStep === 4 && activeFloor && activeFlat && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center p-1 rounded-lg bg-[#FAF7F2] border border-[#0E3A3D]/10">
                <button
                  type="button"
                  onClick={() => setExplorerTab('spatial3d')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    explorerTab === 'spatial3d'
                      ? 'bg-[#0E3A3D] text-white'
                      : 'text-[#0E3A3D] hover:bg-white'
                  }`}
                >
                  Interactive 3D Residence Explorer
                </button>
                <button
                  type="button"
                  onClick={() => setExplorerTab('compass')}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    explorerTab === 'compass'
                      ? 'bg-[#0E3A3D] text-white'
                      : 'text-[#0E3A3D] hover:bg-white'
                  }`}
                >
                  8-Direction Compass Views
                </button>
              </div>

              {/* Quick Flat & Floor Switcher directly inside Step 4 */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="Select Floor"
                  value={activeFloor.floorNumber}
                  onChange={(e) => handleChooseFloor(Number(e.target.value), false)}
                  className="px-3 py-1.5 rounded-lg border border-[#0E3A3D]/15 bg-white text-[#0E3A3D] font-semibold focus:outline-none focus:border-[#0D9488]"
                >
                  {project.floors.map((fl) => (
                    <option key={fl.floorNumber} value={fl.floorNumber}>
                      {fl.floorLabel}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Select Flat"
                  value={activeFlat.id}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#0E3A3D]/15 bg-white text-[#0E3A3D] font-semibold focus:outline-none focus:border-[#0D9488]"
                >
                  {activeFloor.flats.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      Flat {fl.flatNumber} ({fl.bhkConfig} · {fl.facing})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                {explorerTab === 'spatial3d' ? (
                  <Apartment3DWalkthrough
                    project={project}
                    floor={activeFloor}
                    flat={activeFlat}
                    viewpoints={project.viewpoints}
                  />
                ) : (
                  /* 8-DIRECTIONAL SITE COMPASS EXPLORER */
                  <div className="bg-white rounded-xl border border-[#0E3A3D]/15 overflow-hidden">
                    <div className="px-4 py-3 bg-[#0E3A3D] text-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#14B8A6]" />
                        <span className="text-xs sm:text-sm font-semibold">
                          8-Direction Site &amp; Elevation Explorer
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#14B8A6]">
                        {activeDirection} ({DIRECTION_ANGLES[activeDirection]}°)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-5 p-5 bg-[#FAF7F2] border-b md:border-b-0 md:border-r border-[#0E3A3D]/10 flex flex-col items-center justify-center">
                        <div className="relative w-56 h-56 rounded-full border-2 border-[#0E3A3D]/15 bg-white flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full border border-[#0E3A3D]/15 bg-[#FAF7F2] flex flex-col items-center justify-center text-center">
                            <Compass
                              className="w-6 h-6 text-[#0D9488] transition-transform duration-300"
                              style={{
                                transform: `rotate(${DIRECTION_ANGLES[activeDirection]}deg)`,
                              }}
                            />
                            <span className="font-mono text-sm font-bold text-[#0E3A3D] mt-1">
                              {activeDirection}
                            </span>
                          </div>

                          {DIRECTION_ORDER.map((dir) => {
                            const rad = ((DIRECTION_ANGLES[dir] - 90) * Math.PI) / 180;
                            const r = 88;
                            const x = Math.cos(rad) * r;
                            const y = Math.sin(rad) * r;
                            const active = dir === activeDirection;
                            return (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => setActiveDirection(dir)}
                                style={{ transform: `translate(${x}px, ${y}px)` }}
                                className={`absolute w-9 h-9 rounded-full text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                                  active
                                    ? 'bg-[#0D9488] text-white shadow-sm'
                                    : 'bg-[#F2ECE3] text-[#0E3A3D] hover:bg-[#0E3A3D] hover:text-white'
                                }`}
                              >
                                {dir}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-1.5 w-full">
                          {DIRECTION_ORDER.map((dir) => (
                            <button
                              key={dir}
                              type="button"
                              onClick={() => setActiveDirection(dir)}
                              className={`py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                                dir === activeDirection
                                  ? 'bg-[#0E3A3D] text-white'
                                  : 'bg-white border border-[#0E3A3D]/10 text-[#0E3A3D] hover:border-[#0D9488]'
                              }`}
                            >
                              {dir}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-7 flex flex-col">
                        <div className="relative aspect-[16/10] bg-[#0B292C] overflow-hidden">
                          {activeDirView && (
                            <img
                              src={activeDirView.imageUrl}
                              alt={`${project.name} ${activeDirView.label}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0E3A3D]/80 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-white">
                            <p className="text-xs font-mono text-[#14B8A6]">
                              {activeDirView?.direction} · {DIRECTION_ANGLES[activeDirection]}°
                            </p>
                            <p className="text-base font-semibold">{activeDirView?.label}</p>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold text-[#8D6A7B]">
                              Verified Site Orientation
                            </p>
                            <p className="text-sm text-[#3B5557] mt-1.5 leading-relaxed">
                              {activeDirView?.orientationNote}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#0E3A3D]/10 flex items-center justify-between text-xs text-[#4A6567]">
                            <span>{project.name}</span>
                            <button
                              type="button"
                              onClick={() => setExplorerTab('spatial3d')}
                              className="text-[#0D9488] font-semibold hover:underline cursor-pointer"
                            >
                              Return to 3D Apartment →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CLEAN ARCHITECTURAL SIDE SUMMARY (Zero Admin / Ledger Cards) */}
              <aside className="lg:col-span-4 bg-[#FAF7F2] rounded-xl border border-[#0E3A3D]/12 p-5 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-2 pb-4 border-b border-[#0E3A3D]/10">
                  <div>
                    <p className="text-xs font-semibold text-[#8D6A7B]">Active Residence</p>
                    <h3 className="font-editorial text-2xl font-semibold text-[#0E3A3D] mt-0.5">
                      Flat {activeFlat.flatNumber}
                    </h3>
                    <p className="text-xs font-medium text-[#0D9488] mt-0.5">
                      {activeFlat.bhkConfig} · {activeFloor.floorLabel}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#0E3A3D]">
                    {activeFlat.priceLabel}
                  </span>
                </div>

                {/* Visual Flat Spec Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-3 border border-[#0E3A3D]/10 flex items-center gap-2.5">
                    <BedDouble className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#4A6567]">Bedrooms</p>
                      <p className="font-mono font-semibold text-[#0E3A3D]">
                        {activeFlat.bedrooms} Rooms
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#0E3A3D]/10 flex items-center gap-2.5">
                    <Bath className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#4A6567]">Bathrooms</p>
                      <p className="font-mono font-semibold text-[#0E3A3D]">
                        {activeFlat.bathrooms} Baths
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#0E3A3D]/10 flex items-center gap-2.5">
                    <Sun className="w-4 h-4 text-[#8D6A7B] shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#4A6567]">Facing</p>
                      <p className="font-mono font-semibold text-[#0E3A3D]">
                        {activeFlat.facing} Aspect
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#0E3A3D]/10 flex items-center gap-2.5">
                    <Maximize2 className="w-4 h-4 text-[#8D6A7B] shrink-0" />
                    <div>
                      <p className="text-[11px] text-[#4A6567]">Carpet Area</p>
                      <p className="font-mono font-semibold text-[#0E3A3D]">
                        {activeFlat.carpetAreaSqFt.toLocaleString()} sf
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3.5 border border-[#0E3A3D]/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4A6567] inline-flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-[#0D9488]" />
                      Balconies
                    </span>
                    <span className="font-medium text-[#0E3A3D] text-right">
                      {activeFlat.balconies}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#4A6567] inline-flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#0D9488]" />
                      Parking
                    </span>
                    <span className="font-medium text-[#0E3A3D] text-right">
                      {activeFlat.parking}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToEnquiry(activeFlat.flatNumber)}
                    className="w-full py-2.5 rounded-lg bg-[#0E3A3D] hover:bg-[#164E52] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Request Floor Sheet &amp; Brochure
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="w-full py-2 rounded-lg border border-[#0E3A3D]/15 bg-white hover:border-[#0D9488] text-[#0E3A3D] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Compare Other Flats on Floor
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </section>

      {/* VISUAL FLOOR-WISE RESIDENCY & PLAN EXPLORATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#0E3A3D]/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#8D6A7B]">Architectural Floorplates</p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D] mt-1">
              Floor-Wise Residency &amp; Plan Exploration
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {project.floors.map((fl) => {
              const active = fl.floorNumber === activeFloor?.floorNumber;
              return (
                <button
                  key={fl.floorNumber}
                  type="button"
                  onClick={() => handleChooseFloor(fl.floorNumber, false)}
                  className={`shrink-0 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0E3A3D] text-white border-[#0E3A3D]'
                      : 'bg-white text-[#0E3A3D] border-[#0E3A3D]/15 hover:border-[#0D9488]'
                  }`}
                >
                  {fl.floorLabel}
                </button>
              );
            })}
          </div>
        </div>

        {activeFloor && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 3D Floor Plan Card + Architectural Diagram */}
            <div className="lg:col-span-5 bg-white border border-[#0E3A3D]/12 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#0E3A3D]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0D9488]" />
                  <div>
                    <p className="text-sm font-semibold text-[#0E3A3D]">
                      {activeFloor.floorLabel} Plan
                    </p>
                    <p className="text-[11px] text-[#4A6567]">
                      {activeFloor.flats.length} Architectural Units
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloorPlanZoomOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#FAF7F2] hover:bg-[#F2ECE3] text-xs font-medium text-[#0E3A3D] cursor-pointer"
                >
                  <Expand className="w-3.5 h-3.5" />
                  <span>Enlarge</span>
                </button>
              </div>

              <div
                onClick={() => setFloorPlanZoomOpen(true)}
                className="relative aspect-[16/10] bg-[#FAF7F2] cursor-zoom-in overflow-hidden"
              >
                <img
                  src={activeFloor.floorPlanImage}
                  alt={`${project.name} ${activeFloor.floorLabel} 3D floor plan`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                />
              </div>

              <div className="p-4 bg-[#FAF7F2] border-t border-[#0E3A3D]/10 flex items-center justify-between gap-4 text-xs text-[#3B5557]">
                <span>{activeFloor.floorPlanNote}</span>
              </div>
            </div>

            {/* Visual Residence Plan Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeFloor.flats.map((flat) => {
                const isSelected = flat.id === activeFlat?.id;
                return (
                  <div
                    key={flat.id}
                    className={`rounded-xl border p-5 transition-all bg-white ${
                      isSelected
                        ? 'border-[#0D9488] shadow-sm'
                        : 'border-[#0E3A3D]/12 hover:border-[#0D9488]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-lg font-bold text-[#0E3A3D] tabular-nums">
                          Flat {flat.flatNumber}
                        </p>
                        <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                          {flat.bhkConfig}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#8D6A7B]">
                        <Compass className="w-3.5 h-3.5" />
                        {flat.facing} Facing
                      </span>
                    </div>

                    {/* Visual Icon Specs */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-[#3B5557]">
                      <div className="bg-[#FAF7F2] rounded-lg px-2.5 py-2 flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                        <span className="font-mono font-semibold">{flat.bedrooms} Bed</span>
                      </div>
                      <div className="bg-[#FAF7F2] rounded-lg px-2.5 py-2 flex items-center gap-1.5">
                        <Bath className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                        <span className="font-mono font-semibold">{flat.bathrooms} Bath</span>
                      </div>
                      <div className="bg-[#FAF7F2] rounded-lg px-2.5 py-2 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#8D6A7B] shrink-0" />
                        <span className="font-mono font-semibold">Bay</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#0E3A3D]/10 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#4A6567]">Carpet Area</span>
                        <p className="font-mono font-semibold text-[#0E3A3D] tabular-nums">
                          {flat.carpetAreaSqFt.toLocaleString()} sq. ft.
                        </p>
                      </div>
                      <div>
                        <span className="text-[#4A6567]">Super Built-Up</span>
                        <p className="font-mono font-semibold text-[#0E3A3D] tabular-nums">
                          {flat.superBuiltUpAreaSqFt.toLocaleString()} sq. ft.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleExploreFlat3D(flat)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Walkthrough in 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailModalFlat(flat)}
                        className="text-xs font-semibold text-[#0E3A3D] hover:text-[#0D9488] cursor-pointer"
                      >
                        Floor Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* VISUAL BUILDING INFORMATION & HIGHLIGHTS (Icons + Visual Spec Cards + SVG Diagram) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#0E3A3D]/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Building Visual Spec Cards & SVG Architectural Diagram */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#8D6A7B]">Visual Architectural Specs</p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D] mt-1">
                Building Information &amp; Highlights
              </h2>
            </div>

            {/* Clean Architectural Icon Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[
                {
                  icon: LandPlot,
                  label: 'Total Land Area',
                  value: `${project.landAreaSqYds.toLocaleString()} sq. yd`,
                },
                {
                  icon: Maximize2,
                  label: 'Total Built-Up',
                  value: `${project.totalBuiltUpAreaSqFt.toLocaleString()} sq. ft`,
                },
                {
                  icon: Building2,
                  label: 'Towers & Floors',
                  value: `${project.totalBlocks} Block · ${stats.totalFloors} Floors`,
                },
                {
                  icon: ArrowUpDown,
                  label: 'High-Speed Lifts',
                  value: `${project.elevatorsCount} Elevators`,
                },
                {
                  icon: BedDouble,
                  label: 'Configurations',
                  value: project.configurations.join(' · '),
                },
                {
                  icon: Car,
                  label: 'Basement Parking',
                  value: 'EV-Ready Bays',
                },
              ].map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="bg-[#FAF7F2] border border-[#0E3A3D]/10 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#0E3A3D]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#4A6567]">{spec.label}</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#0E3A3D] mt-0.5 truncate">
                        {spec.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Architectural SVG Footprint & Elevation Schematic */}
            <div className="bg-[#FAF7F2] border border-[#0E3A3D]/12 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#0E3A3D] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                  Structural Section &amp; Footprint Diagram
                </span>
                <span className="font-mono text-xs text-[#0D9488]">
                  {project.constructionProgressPct}% Built
                </span>
              </div>

              <svg viewBox="0 0 640 165" className="w-full h-36 sm:h-40" aria-hidden="true">
                <rect x="8" y="8" width="624" height="148" rx="10" fill="#FFFFFF" stroke="#0E3A3D" strokeOpacity="0.12" />
                {/* Tower Elevation Schematic */}
                {[0, 1, 2, 3, 4].slice(0, stats.totalFloors).map((idx) => {
                  const yPos = 114 - idx * 20;
                  return (
                    <g key={idx}>
                      <rect
                        x="36"
                        y={yPos}
                        width="170"
                        height="16"
                        rx="3"
                        fill={idx === stats.totalFloors - 1 ? '#0D9488' : '#0E3A3D'}
                        fillOpacity={0.16 + idx * 0.14}
                        stroke="#0E3A3D"
                        strokeOpacity="0.3"
                      />
                      <text x="46" y={yPos + 11} fontSize="9" fill="#0E3A3D" fontFamily="monospace">
                        {idx === 0 ? 'GROUND PODIUM' : `LEVEL 0${idx}`}
                      </text>
                    </g>
                  );
                })}
                {/* Elevator Core Shaft */}
                <rect x="218" y="34" width="26" height="96" rx="4" fill="#8D6A7B" fillOpacity="0.2" stroke="#8D6A7B" />
                <path d="M231 46 L231 118 M226 52 L231 46 L236 52 M226 112 L231 118 L236 112" stroke="#8D6A7B" strokeWidth="1.5" fill="none" />

                {/* Land vs Built-up visual bars */}
                <text x="275" y="42" fontSize="11" fontWeight="600" fill="#0E3A3D">
                  LAND &amp; BUILT-UP DISTRIBUTION
                </text>
                <rect x="275" y="54" width="320" height="14" rx="7" fill="#E6EFEF" />
                <rect x="275" y="54" width={Math.max(80, builtUpRatioPct * 3.1)} height="14" rx="7" fill="#0D9488" />
                <text x="275" y="84" fontSize="9.5" fill="#4A6567" fontFamily="monospace">
                  SITE: {project.landAreaSqYds.toLocaleString()} SQ.YD · BUILT-UP: {project.totalBuiltUpAreaSqFt.toLocaleString()} SQ.FT
                </text>
                <rect x="275" y="98" width="320" height="12" rx="6" fill="#E6EFEF" />
                <rect x="275" y="98" width={(project.constructionProgressPct / 100) * 320} height="12" rx="6" fill="#0E3A3D" />
                <text x="275" y="126" fontSize="9.5" fill="#0D9488" fontFamily="monospace">
                  PARKING: {project.parkingFacilities.slice(0, 48)}
                </text>
              </svg>
            </div>

            {/* Highlights & Amenities Visual Lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-[#0E3A3D]/12 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0E3A3D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  <span>Key Highlights</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-[#3B5557] leading-relaxed">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-[#0E3A3D]/12 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0E3A3D] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#8D6A7B]" />
                  <span>Amenities &amp; Facilities</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-[#3B5557] leading-relaxed">
                  {project.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8D6A7B] shrink-0 mt-1.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Google Maps Location */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#0E3A3D]/12 rounded-xl overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-[#0E3A3D]/10">
                <p className="text-xs font-semibold text-[#8D6A7B]">Site Location</p>
                <h3 className="text-base font-semibold text-[#0E3A3D] mt-1">
                  Google Maps Location &amp; Access
                </h3>
                <p className="text-xs text-[#4A6567] mt-1">{project.address}</p>
              </div>
              <div className="relative flex-1 min-h-[320px] bg-[#FAF7F2]">
                <iframe
                  title={`${project.name} Google Maps Location`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    project.mapCoordinates.embedQuery
                  )}&z=15&output=embed`}
                  className="w-full h-full min-h-[320px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="px-5 py-3 bg-[#FAF7F2] flex items-center justify-between text-xs text-[#4A6567]">
                <span className="font-mono tabular-nums">
                  {project.mapCoordinates.lat.toFixed(4)}° N,{' '}
                  {Math.abs(project.mapCoordinates.lng).toFixed(4)}° W
                </span>
                <a
                  href={`https://maps.google.com/?q=${project.mapCoordinates.embedQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#0D9488] hover:underline"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROPERTY IMAGE GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#0E3A3D]/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#8D6A7B]">Visual Archive</p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D] mt-1">
              Property Image Gallery
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {galleryCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  galleryCategory === cat
                    ? 'bg-[#0E3A3D] text-white'
                    : 'bg-white border border-[#0E3A3D]/15 text-[#0E3A3D] hover:border-[#0D9488]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGallery.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setLightboxIndex(idx);
                setLightboxZoom(1);
              }}
              className="group text-left bg-white border border-[#0E3A3D]/12 rounded-xl overflow-hidden hover:border-[#0D9488] transition-colors cursor-pointer"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0E3A3D]/10">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                />
                <span className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-[#0E3A3D]/80 text-white opacity-90 group-hover:opacity-100">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold text-[#0D9488]">{item.category}</p>
                <p className="text-sm font-semibold text-[#0E3A3D] mt-0.5">{item.title}</p>
                <p className="text-xs text-[#4A6567] mt-1 line-clamp-2">{item.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CONTACT & ENQUIRY SECTION */}
      <section ref={enquirySectionRef} className="bg-[#FAF7F2] py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#0E3A3D]/12 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#0E3A3D]/10">
              <div>
                <p className="text-xs font-semibold text-[#8D6A7B]">Direct Project Desk</p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#0E3A3D] mt-0.5">
                  Enquire About {project.name}
                </h2>
              </div>
              {enquiryFlatRef && (
                <span className="text-xs font-mono font-semibold text-[#0D9488]">
                  Selected Unit: Flat {enquiryFlatRef}
                </span>
              )}
            </div>

            <form onSubmit={handleEnquirySubmit} className="mt-6 space-y-4">
              {enquirySuccess && (
                <div className="p-3.5 rounded-lg bg-[#DCFCE7] text-[#15803D] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Thank you! Your enquiry for {project.name} has been received by our advisory desk.
                  </span>
                </div>
              )}
              {enquiryError && (
                <div className="p-3 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-xs font-medium">
                  {enquiryError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={enquiryForm.fullName}
                    onChange={(e) =>
                      setEnquiryForm((s) => ({ ...s, fullName: e.target.value }))
                    }
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={enquiryForm.email}
                    onChange={(e) =>
                      setEnquiryForm((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={enquiryForm.phone}
                    onChange={(e) =>
                      setEnquiryForm((s) => ({ ...s, phone: e.target.value }))
                    }
                    placeholder="+1 (305) 555-0165"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                    Flat Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={enquiryFlatRef}
                    onChange={(e) => setEnquiryFlatRef(e.target.value)}
                    placeholder="e.g. 201"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm font-mono focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                    Preferred Site Visit Date
                  </label>
                  <input
                    type="date"
                    value={enquiryForm.preferredVisitDate}
                    onChange={(e) =>
                      setEnquiryForm((s) => ({
                        ...s,
                        preferredVisitDate: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0E3A3D] mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={enquiryForm.message}
                  onChange={(e) =>
                    setEnquiryForm((s) => ({ ...s, message: e.target.value }))
                  }
                  placeholder="Request floor-wise architectural sheet, payment milestones, or guided consultation..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#0E3A3D]/20 text-sm focus:outline-none focus:border-[#0D9488]"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Submit Property Enquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* INDIVIDUAL FLAT SPECIFICATIONS MODAL (No Admin Status Badges) */}
      {detailModalFlat && (
        <div
          className="fixed inset-0 z-50 bg-[#0E3A3D]/70 flex items-center justify-center p-4"
          onClick={() => setDetailModalFlat(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-[#0E3A3D]/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-[#0E3A3D]/10 flex items-center justify-between gap-4 bg-[#FAF7F2]">
              <div>
                <p className="text-xs font-semibold text-[#8D6A7B]">
                  {project.name} · {detailModalFlat.floorLabel}
                </p>
                <h3 className="font-editorial text-2xl font-semibold text-[#0E3A3D]">
                  Flat {detailModalFlat.flatNumber} — {detailModalFlat.bhkConfig}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close flat details"
                onClick={() => setDetailModalFlat(null)}
                className="p-2 rounded-lg hover:bg-[#F2ECE3] text-[#0E3A3D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
                  <Compass className="w-4 h-4" />
                  {detailModalFlat.facing} Facing Residence
                </span>
                <p className="font-mono text-2xl font-semibold text-[#0E3A3D] tabular-nums">
                  {detailModalFlat.priceLabel}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Carpet Area</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.carpetAreaSqFt.toLocaleString()} sq. ft.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Built-Up Area</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.builtUpAreaSqFt.toLocaleString()} sq. ft.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Super Built-Up</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.superBuiltUpAreaSqFt.toLocaleString()} sq. ft.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Undivided Land Share</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.landShareSqYds
                      ? `${detailModalFlat.landShareSqYds} sq. yds.`
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Bedrooms</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.bedrooms} Bedrooms
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF7F2]">
                  <span className="text-[#4A6567]">Bathrooms</span>
                  <p className="font-mono text-sm font-semibold text-[#0E3A3D] tabular-nums mt-0.5">
                    {detailModalFlat.bathrooms} Baths
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs border-t border-[#0E3A3D]/10 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[#4A6567]">Balcony &amp; Terrace Details</span>
                  <span className="font-medium text-[#0E3A3D] text-right">
                    {detailModalFlat.balconies}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[#4A6567] inline-flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" />
                    <span>Allocated Parking</span>
                  </span>
                  <span className="font-medium text-[#0E3A3D] text-right">
                    {detailModalFlat.parking}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#0E3A3D]/10">
                <button
                  type="button"
                  onClick={() => handleExploreFlat3D(detailModalFlat)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Box className="w-4 h-4" />
                  <span>Open 3D Residence Explorer</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToEnquiry(detailModalFlat.flatNumber)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0E3A3D] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact for Enquiry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOOR PLAN ZOOM MODAL */}
      {floorPlanZoomOpen && activeFloor && (
        <div
          className="fixed inset-0 z-50 bg-[#0B292C]/90 flex flex-col p-4"
          onClick={() => setFloorPlanZoomOpen(false)}
        >
          <div className="flex items-center justify-between text-white mb-3">
            <p className="text-sm font-semibold">
              {project.name} — {activeFloor.floorLabel} Architectural Floor Plan
            </p>
            <button
              type="button"
              onClick={() => setFloorPlanZoomOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center overflow-auto"
          >
            <img
              src={activeFloor.floorPlanImage}
              alt={`${activeFloor.floorLabel} plan enlarged`}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* GALLERY LIGHTBOX MODAL */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#0B292C]/95 flex flex-col p-4 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-4 text-white mb-4"
          >
            <div>
              <p className="text-xs text-[#14B8A6] font-semibold">
                {activeLightboxItem.category} ({lightboxIndex + 1}/
                {filteredGallery.length})
              </p>
              <p className="text-base font-semibold">{activeLightboxItem.title}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(z + 0.25, 2.5))}
                aria-label="Zoom in gallery image"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(z - 0.25, 1))}
                aria-label="Zoom out gallery image"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close gallery"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center overflow-hidden"
          >
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => {
                setLightboxZoom(1);
                setLightboxIndex(
                  (lightboxIndex - 1 + filteredGallery.length) %
                    filteredGallery.length
                );
              }}
              className="absolute left-2 z-10 p-2.5 rounded-full bg-[#0E3A3D]/85 text-white hover:bg-[#0D9488] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="max-h-[75vh] max-w-[90vw] overflow-auto">
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                referrerPolicy="no-referrer"
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-h-[72vh] w-auto object-contain rounded-lg transition-transform duration-200 origin-center"
              />
            </div>

            <button
              type="button"
              aria-label="Next image"
              onClick={() => {
                setLightboxZoom(1);
                setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
              }}
              className="absolute right-2 z-10 p-2.5 rounded-full bg-[#0E3A3D]/85 text-white hover:bg-[#0D9488] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-xs text-white/80 mt-3">
            {activeLightboxItem.caption}
          </p>
        </div>
      )}
    </main>
  );
}
