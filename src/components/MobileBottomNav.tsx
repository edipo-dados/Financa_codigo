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
      <div className="bg-white dark:bg-fintech-dark-surface border-t border-gray-200 dark:border-fintech-dark-border">
        <div className="px-2 pt-1.5 pb-safe">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all duration-150 min-w-0 flex-1 max-w-[72px] ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-fintech-dark-accent'
                    : 'text-gray-400 dark:text-fintech-text-muted'
                }`}
              >
                <span className={`text-xl transition-transform duration-150 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</span>
                <span className={`text-[10px] font-medium truncate w-full text-center ${
                  activeTab === tab.id ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="w-4 h-0.5 bg-blue-600 dark:bg-fintech-dark-accent rounded-full mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
