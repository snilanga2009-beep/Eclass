const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'client', 'src', 'components', 'StudentProfileModal.tsx');
let code = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');

const oldTabStrip = `        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`
                  flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                  \${isActive 
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
                \`}
              >
                <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-bold \${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'
                  }\`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>`;

const newTabStrip = `        {/* Mobile Tab Quick Dropdown (Visible on Small Phone Screens < sm) */}
        <div className="sm:hidden px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Select Tab:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-brand-500"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.count !== undefined && tab.count > 0 ? \`(\${tab.count})\` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation Strip (All 10 Tabs with Left/Right Scroll Arrows for Desktop & Tablets) */}
        <div className="relative border-b border-slate-200 bg-slate-50 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors z-10 shrink-0 cursor-pointer hidden sm:flex items-center justify-center border-r border-slate-200"
            title="Scroll tabs left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsRef}
            className="flex-1 flex items-center space-x-1 px-3 py-2 overflow-x-auto scroll-smooth scrollbar-none"
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`
                    flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer
                    \${isActive 
                      ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-bold ring-1 ring-brand-500/20' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}
                  \`}
                >
                  <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-bold \${
                      isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                    }\`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors z-10 shrink-0 cursor-pointer hidden sm:flex items-center justify-center border-l border-slate-200"
            title="Scroll tabs right"
          >
            <ChevronRight size={16} />
          </button>
        </div>`;

if (code.includes(oldTabStrip)) {
  code = code.replace(oldTabStrip, newTabStrip);
  fs.writeFileSync(targetFile, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Tab navigation strip successfully replaced!');
} else {
  console.log('Target tab strip not found in file');
}
