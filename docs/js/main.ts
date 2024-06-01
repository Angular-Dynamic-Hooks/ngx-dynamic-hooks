import { SidebarSectionsWidget } from './widgets/sidebarSections';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/version/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';
import { VersionWarningWidget } from './widgets/version/versionWarning';
import { initCopyrightDate } from './misc';
import { SidebarToggleWidget } from './widgets/sidebarToggle';

// Init misc logic
initCopyrightDate();

// Init widgets
const widgets = bootstrapWidgets(document.body, [
  VersionSelectWidget,
  DarkmodeWidget,
  SidebarToggleWidget,
  SidebarSectionsWidget,
  ArticleTocWidget,
  VersionWarningWidget
]);