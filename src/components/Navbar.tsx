import { Box, Menu, X } from 'lucide-react';
import { useState } from 'react';

export type AppRoute =
  | 'home'
  | 'about'
  | 'services'
  | 'ventures'
  | 'projects'
  | 'testimonials'
  | 'contact'
  | 'project-detail';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

const NAV_ITEMS: { label: string; route: AppRoute; sectionId?: string }[] = [
  { label: 'Home', route: 'home', sectionId: 'top' },
  { label: 'About Us', route: 'about', sectionId: 'about-section' },
  { label: 'Services', route: 'services', sectionId: 'services-section' },
  { label: 'Ventures', route: 'ventures' },
  { label: 'Projects', route: 'projects', sectionId: 'projects-section' },
  { label: 'Testimonials', route: 'testimonials', sectionId: 'testimonials-section' },
  { label: 'Get in Touch', route: 'contact', sectionId: 'contact-section' },
];

export function Navbar({ activeRoute, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isNavActive = (itemRoute: AppRoute) => {
    if (itemRoute === 'ventures' && activeRoute === 'project-detail') return true;
    return activeRoute === itemRoute;
  };

  const handleClick = (route: AppRoute, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(route, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#0E3A3D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleClick('home', 'top')}
          className="font-editorial text-2xl font-semibold tracking-tight text-[#0E3A3D] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D9488]"
        >
          Meridian Estates
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#3B5557]"
        >
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.route);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleClick(item.route, item.sectionId)}
                className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D9488] ${
                  active
                    ? 'text-[#0E3A3D] font-semibold'
                    : 'text-[#4A6567] hover:text-[#0E3A3D]'
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#0D9488] transition-transform duration-150 origin-left ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Explorer Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleClick('project-detail')}
            className={`hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488] ${
              activeRoute === 'project-detail'
                ? 'bg-[#0D9488] text-white'
                : 'bg-[#0E3A3D] text-white hover:bg-[#164E52]'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>3D Explorer</span>
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#0E3A3D]/15 text-[#0E3A3D] hover:bg-[#F2ECE3] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#0E3A3D]/10 bg-white px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.route);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleClick(item.route, item.sectionId)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0E3A3D] text-white'
                    : 'text-[#0E3A3D] hover:bg-[#FAF7F2]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#0E3A3D]/10">
            <button
              type="button"
              onClick={() => handleClick('project-detail')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#0E3A3D] transition-colors cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>3D Explorer</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
