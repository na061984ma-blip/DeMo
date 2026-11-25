import { useCallback, useEffect, useState } from 'react';
import { HomePage } from './components/HomePage';
import { AppRoute, Navbar } from './components/Navbar';
import { ProjectExplorePage } from './components/ProjectExplorePage';
import { ServicesShowcase } from './components/ServicesShowcase';
import { VenturesPage } from './components/VenturesPage';
import { VenturesProvider } from './context/VenturesContext';

function AppShell() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    'sky-crest-residences'
  );
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  const handleNavigate = useCallback((route: AppRoute, sectionId?: string) => {
    if (
      route === 'home' ||
      route === 'about' ||
      route === 'projects' ||
      route === 'testimonials' ||
      route === 'contact'
    ) {
      setActiveRoute(route);
      if (sectionId) {
        setPendingScrollId(sectionId);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setPendingScrollId(null);
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!pendingScrollId) return;
    const timer = window.setTimeout(() => {
      if (pendingScrollId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(pendingScrollId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      setPendingScrollId(null);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [pendingScrollId, activeRoute]);

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveRoute('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isHomeSectionRoute =
    activeRoute === 'home' ||
    activeRoute === 'about' ||
    activeRoute === 'projects' ||
    activeRoute === 'testimonials' ||
    activeRoute === 'contact';

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0E3A3D]">
      <Navbar activeRoute={activeRoute} onNavigate={handleNavigate} />

      <div className="flex-1">
        {isHomeSectionRoute && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
          />
        )}

        {activeRoute === 'services' && (
          <div className="bg-white">
            <ServicesShowcase
              onExploreVentures={() => handleNavigate('ventures')}
              onOpenExplorer={() => handleSelectProject(selectedProjectId)}
            />
          </div>
        )}

        {activeRoute === 'ventures' && (
          <VenturesPage onSelectProject={handleSelectProject} />
        )}

        {activeRoute === 'project-detail' && (
          <ProjectExplorePage
            projectId={selectedProjectId}
            onSelectProject={handleSelectProject}
            onBackToVentures={() => handleNavigate('ventures')}
          />
        )}
      </div>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#0E3A3D] text-[#FAF7F2] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="font-editorial text-2xl font-semibold">Meridian Estates</p>
              <p className="text-xs text-[#FAF7F2]/70 mt-1">
                420 Harbourfront Crescent · Residential Ventures &amp; Spatial Residence Explorer
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-[#FAF7F2]/80">
              <button
                type="button"
                onClick={() => handleNavigate('home', 'top')}
                className="hover:text-[#14B8A6] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('services')}
                className="hover:text-[#14B8A6] transition-colors cursor-pointer"
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('ventures')}
                className="hover:text-[#14B8A6] transition-colors cursor-pointer"
              >
                Ventures
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('project-detail')}
                className="hover:text-[#14B8A6] transition-colors cursor-pointer"
              >
                3D Explorer
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('contact', 'contact-section')}
                className="hover:text-[#14B8A6] transition-colors cursor-pointer"
              >
                Get in Touch
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#FAF7F2]/60">
            <span>© {new Date().getFullYear()} Meridian Estates Development Group.</span>
            <span>Architectural floorplates &amp; 3D unit walkthroughs.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <VenturesProvider>
      <AppShell />
    </VenturesProvider>
  );
}
