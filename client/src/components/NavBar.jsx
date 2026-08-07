const TABS = [
  { id: 'today', label: 'Today', icon: '💪' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'body', label: 'Body', icon: '📈' },
  { id: 'more', label: 'More', icon: '⚙️' },
];

export default function NavBar({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
