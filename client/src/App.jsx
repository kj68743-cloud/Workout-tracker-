import { useState } from 'react';
import NavBar from './components/NavBar.jsx';
import Onboarding from './components/Onboarding.jsx';
import TodayScreen from './components/TodayScreen.jsx';
import HistoryScreen from './components/HistoryScreen.jsx';
import BodyScreen from './components/BodyScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';

const ONBOARDING_KEY = 'fdst.onboardingSeen';

export default function App() {
  const [tab, setTab] = useState('today');
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  }

  return (
    <div className="app-shell">
      {showOnboarding && <Onboarding onDone={finishOnboarding} />}

      <main className="app-main">
        {tab === 'today' && <TodayScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'body' && <BodyScreen />}
        {tab === 'more' && (
          <SettingsScreen
            onReplayOnboarding={() => {
              localStorage.removeItem(ONBOARDING_KEY);
              setShowOnboarding(true);
            }}
          />
        )}
      </main>

      <NavBar active={tab} onChange={setTab} />
    </div>
  );
}
