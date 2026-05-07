import CycleTracker from "./CycleTracker";
import { LanguageProvider } from "./i18n";
import AppErrorBoundary from "./components/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <CycleTracker />
      </LanguageProvider>
    </AppErrorBoundary>
  );
}
