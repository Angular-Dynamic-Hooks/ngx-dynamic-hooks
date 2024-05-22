import { SidebarWidget } from './widgets/sidebar';
import { ArticleTocWidget } from './widgets/article-toc';
import { bootstrapWidgets } from './widgetBootstrap';

// Init widgets
const widgets = bootstrapWidgets(document.body, [
  SidebarWidget,
  ArticleTocWidget
]);