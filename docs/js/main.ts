import { SidebarWidget } from './widgets/sidebar';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/version/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';
import { VersionWarningWidget } from './widgets/version/versionWarning';

// Init widgets
const widgets = bootstrapWidgets(document.body, [
  VersionSelectWidget,
  DarkmodeWidget,
  SidebarWidget,
  ArticleTocWidget,
  VersionWarningWidget
]);