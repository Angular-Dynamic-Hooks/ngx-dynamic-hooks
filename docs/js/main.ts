import { SidebarSectionsWidget } from './widgets/sidebarSections';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets, Widget } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/version/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';
import { VersionWarningLinkWidget } from './widgets/version/versionWarningLink';
import { initCopyrightDate } from './misc';
import { SidebarToggleWidget } from './widgets/sidebarToggle';
import { VersionLogoLinkWidget } from './widgets/version/versionLogoLink';
import { StackblitzWidget } from './widgets/stackblitz';
import { CodeCopyWidget } from './widgets/codeCopy';

// Init misc logic
initCopyrightDate();

const landingWidgets = [
  VersionLogoLinkWidget,
  CodeCopyWidget
];

const docsWidgets = [
  VersionLogoLinkWidget,
  VersionSelectWidget,
  DarkmodeWidget,
  SidebarToggleWidget,
  SidebarSectionsWidget,
  ArticleTocWidget,
  VersionWarningLinkWidget,
  StackblitzWidget,
  CodeCopyWidget
];

// Determine widgets to use
let widgetList = location.pathname.includes('documentation') ? docsWidgets : landingWidgets;

// Init widgets
const widgets = bootstrapWidgets(document.body, widgetList);