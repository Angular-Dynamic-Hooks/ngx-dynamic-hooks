import { SidebarSectionsWidget } from './widgets/sidebarSections';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/version/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';
import { VersionWarningLinkWidget } from './widgets/version/versionWarningLink';
import { initCopyrightDate } from './misc';
import { SidebarToggleWidget } from './widgets/sidebarToggle';
import { VersionLogoLinkWidget } from './widgets/version/versionLogoLink';

// Init misc logic
initCopyrightDate();

// Init widgets
const widgets = bootstrapWidgets(document.body, [
  VersionLogoLinkWidget,
  VersionSelectWidget,
  DarkmodeWidget,
  SidebarToggleWidget,
  SidebarSectionsWidget,
  ArticleTocWidget,
  VersionWarningLinkWidget
]);