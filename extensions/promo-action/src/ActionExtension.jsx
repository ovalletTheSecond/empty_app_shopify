import { reactExtension } from '@shopify/ui-extensions-react/admin';

// The target used here must match the target used in the extension's toml file
const TARGET = 'admin.discount-code-basic.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
  // Use the admin action APIs to render UI or trigger actions
  return null;
}
