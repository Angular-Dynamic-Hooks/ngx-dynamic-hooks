import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { SidebarSectionsWidget } from './widgets/sidebarSections';
import { ArticleTocWidget } from './widgets/articleToc';
import { bootstrapWidgets, Widget } from './widgetBootstrap';
import { VersionSelectWidget } from './widgets/version/versionSelect';
import { DarkmodeWidget } from './widgets/darkmode';
import { VersionWarningLinkWidget } from './widgets/version/versionWarningLink';
import { initCopyrightDate } from './misc';
import { SidebarToggleWidget } from './widgets/sidebarToggle';
import { StackblitzWidget } from './widgets/stackblitz';
import { CodeCopyWidget } from './widgets/codeCopy';
import { initLandingPage } from './landing';
import { LandingMenuWidget } from './widgets/landing/landingMenu';
import { SidebarVersionButtonWidget } from "./widgets/sidebarVersionButton";

// Setup
gsap.registerPlugin(ScrollTrigger);

// Landing page
if (!location.pathname.includes('documentation')) {
  initLandingPage();
  bootstrapWidgets(document.body, [
    LandingMenuWidget,
    CodeCopyWidget
  ]);

// Docs
} else {
  bootstrapWidgets(document.body, [
    VersionSelectWidget,
    DarkmodeWidget,
    SidebarToggleWidget,
    SidebarSectionsWidget,
    SidebarVersionButtonWidget,
    ArticleTocWidget,
    VersionWarningLinkWidget,
    StackblitzWidget,
    CodeCopyWidget
  ]);
}

// Misc
initCopyrightDate();