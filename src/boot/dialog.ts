import { boot } from 'quasar/wrappers';
import { QDialog } from 'quasar';

export default boot(() => {
  const backdropFilterProp = QDialog.props.backdropFilter as { default?: string };
  backdropFilterProp.default = 'blur(12px)';
});
