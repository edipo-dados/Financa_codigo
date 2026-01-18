'use client'

interface Tab {
  id: string
  label: string
  icon: string
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function MobileBottomNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-fintech-dark-surface/90 backdrop-blur-xl border-t fintech-border" />
      
      {/* Safe area padding for devices with home indicator */}
      <div className="relative px-4 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] ${
                activeTab === tab.id
                  ? 'bg-apple-blue/10 dark:bg-fintech-dark-accent/20 text-apple-blue dark:text-fintech-dark-accent scale-105'
                  : 'text-gray-500 dark:text-fintech-text-muted hover:text-gray-700 dark:hover:text-fintech-text-secondary'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}