interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  emoji: string;
  adminOnly?: boolean;
}

export default function TabNavigation({ activeTab, onTabChange, isAdmin }: TabNavigationProps) {
  const tabs: TabConfig[] = [
    { id: "dashboard", label: "Dashboard", emoji: "🏠" },
    { id: "commesse", label: "Commesse", emoji: "📁" },
    { id: "economia", label: "Economia", emoji: "💰", adminOnly: true },
    { id: "costi", label: "Costi", emoji: "📊" },
    { id: "operativita", label: "Operatività", emoji: "📋" },
    { id: "anagrafica", label: "Anagrafica", emoji: "👥", adminOnly: true },
    { id: "sistema", label: "Sistema", emoji: "⚙️" },
  ];

  // Filtra i tab in base al ruolo utente
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <nav className="bg-g2-accent border-b-2 border-primary" role="tablist" data-testid="tab-navigation">
      <div className="flex overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            data-testid={`tab-${tab.id}`}
          >
            <span className="text-xl">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
