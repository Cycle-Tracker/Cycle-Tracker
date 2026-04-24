import CycleTracker from "./CycleTracker";
import { LanguageProvider } from "./i18n";

export default function App() {
  return (
    <LanguageProvider>
      <CycleTracker />
    </LanguageProvider>
  );
}
