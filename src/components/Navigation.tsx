import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: 'dashboard' | 'leads' | 'settings') => void;
}

export const Navigation = ({ activeSection, onSectionChange }: NavigationProps) => {
  const sections = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'settings' as const, label: 'Settings' },
    { id: 'leads' as const, label: 'Leads' }
  ];

  return (
    <nav className="bg-background border-b px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Logo */}
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
          Citizen <span className="block md:inline">AI</span>
        </h1>

        {/* Middle: Navigation buttons (horizontal always) */}
        <div className="flex flex-row flex-wrap gap-4 justify-center flex-1 md:justify-center">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Right: Sign Out */}
        <div className="flex-shrink-0">
          <Button variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};