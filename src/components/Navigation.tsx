import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: 'dashboard' | 'settings' | 'analytics') => void;
}

export const Navigation = ({ activeSection, onSectionChange }: NavigationProps) => {
  const sections = [
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'settings' as const, label: 'Settings' },
    { id: 'analytics' as const, label: 'Analytics' }
  ];

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Citizen AI
            </h1>
          </div>
          
          <div className="flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};