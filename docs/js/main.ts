import { SidebarWidget } from './widgets/sidebar';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';

// Init widgets
const widgets = bootstrapWidgets(document.body, [
  VersionSelectWidget,
  DarkmodeWidget,
  SidebarWidget,
  ArticleTocWidget
]);