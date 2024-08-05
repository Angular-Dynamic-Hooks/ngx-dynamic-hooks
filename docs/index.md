---
layout: landing
highlights:
  - title: Easy dynamic loading
    icon: ⭐
    desc: Loads fully-functional Angular components dynamically with native Angular tools
  - title: Parse any content
    icon: 📖
    desc: Can parse both HTML strings and already-existing HTML trees for components
  - title: Standalone mode
    icon: 🚀
    desc: Can be used <a href="documentation/v3/standalone-mode" target="_blank">fully standalone</a> to load components into HTML without Angular.
  - title: No JiT compiler needed
    icon: 🏃
    desc: Keeps package sizes small by not relying on the Angular compiler to create components
  - title: SSR-ready
    icon: 💻
    desc: Works with the native Server-Side-Rendering functionality added in Angular 17
  - title: Load anywhere
    icon: 🔍
    desc: Loads components by their selectors, custom selectors or <a href="documentation/v3/parsers#writing-your-own-hookparser" target="_blank">any text pattern of your choice</a>
  - title: No constraints
    icon: ⚙️
    desc: All standard features like services, inputs/outputs, lifecycle methods, etc. work normally
  - title: Lazy-loading
    icon: 💤
    desc: Optionally allows <a href="documentation/v3/configuration#lazy-loading-components" target="_blank">lazy-loading components</a> only if they appear in the content
  - title: Easy communication
    icon: 🔒
    desc: Utilize a <a href="documentation/v3/component-features" target="_blank">context object</a> to pass data safely to your dynamic components
---

<header class="l-header">
  <div class="l-wrapper">
    <div class="l-header-inner">
      <div class="l-header-left">
        <a class="l-title" href="{{ "/documentation/v3/" | relative_url }}" rel="author">
          <img class="l-site-logo" src="{{ "/assets/images/ngx-dynamic-hooks-logo-white.svg" | relative_url }}">
          <span class="l-site-name">Angular Dynamic Hooks</span>
        </a>
      </div>
      <div class="l-header-right">
        <div class="l-site-links">
          <a class="l-site-link home" href="{{ '/documentation/v3/' | relative_url }}" target="_blank">
            <div class="l-site-link-icon">📄</div>
            <span class="l-site-link-text">Docs</span>
          </a>
          <a class="l-site-link npm" href="https://www.npmjs.com/package/ngx-dynamic-hooks" target="_blank">
            <div class="l-site-link-icon">
              <img src="{{ "/assets/images/npm.svg" | relative_url }}">
            </div>
            <span class="l-site-link-text">npm</span>
          </a>
          <a class="l-site-link github" href="https://github.com/MTobisch/ngx-dynamic-hooks" target="_blank">
            <div class="l-site-link-icon">
              <img src="{{ "/assets/images/github-mark-white.svg" | relative_url }}">
            </div>
            <span class="l-site-link-text">Github</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</header>

<article class="l-content">
  <section class="l-hero">
    <div class="l-hero-wrapper">
      <h1 class="l-hero-title">Load Angular components anywhere</h1>
      <p class="l-hero-desc">Angular Dynamic Hooks can load Angular components into <b>any dynamic content</b>, such as HTML strings (like "dynamic" templates), individual HTML elements or the whole browser page.</p>
      <div class="l-hero-teaser">
        <div class="l-hero-teaser-aspect">
          <img class="l-hero-teaser-img" src="https://github.com/MTobisch/ngx-dynamic-hooks/assets/12670925/ef27d405-4663-48a5-97b5-ca068d7b67d8" alt="ngx-dynamic-hooks-optimize">
        </div>
      </div>
      <div class="l-hero-buttons">
        <a class="l-hero-button" href="{{ "documentation/v3/quickstart" | relative_url }}" target="_blank">Quickstart</a>
        <a class="l-hero-button secondary" href="{{ "documentation/v3" | relative_url }}" target="_blank">Docs</a>
      </div>
    </div>
    <div class="l-hero-bg">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 626.4 36.2" preserveAspectRatio="none" xml:space="preserve">
        <path d="M0,36.2h313.2C129.4,36.2,0,0,0,0V36.2z"/>
        <path d="M313.2,36.2h313.2V0C626.4,0,497,36.2,313.2,36.2z"/>
      </svg>
    </div>
  </section>

  <section class="l-cards">
    <div class="l-wrapper">
      <div class="l-cards-inner">
        <h2 class="l-cards-title">
          <img class="l-cards-title-logo" src="{{ "/assets/images/ngx-dynamic-hooks-logo.svg" | relative_url }}">
          Features overview and highlights
        </h2>
        <div class="l-cards-list"> 
          {% for item in page.highlights %}
            <div class="l-card">
              <div class="l-card-inner">
                <div class="l-card-top">
                  <span class="l-card-icon">{{ item.icon }}</span>
                  <h3 class="l-card-title">{{ item.title }}</h3>
                </div>
                <div class="l-card-bottom">{{ item.desc }}</div>
              </div>
            </div>
          {% endfor %}
        </div>
      </div>
    </div>

  </section>

  <section class="l-snippet">
    <div class="l-snippet-wrapper">
      <div class="l-snippet-image">
        <img src="{{ "/assets/images/landing_hook_illustration.svg" | relative_url }}">
      </div>
      <div class="l-snippet-text">
        <p class="l-snippet-line">What if you wanted to load components not just from static templates, but from <b>dynamic content</b> - such as string variables, HTML elements or even the whole browser DOM?</p>
        <p class="l-snippet-line">By default, this is <b>not easily possible</b>.</p>
        <p class="l-snippet-line">Angular Dynamic Hooks aims to solve this problem. It offers an easy way to load Angular components into <b>hooks</b> in dynamic content. Hooks can be HTML elements and even text patterns.</p>
      </div>
    </div>
  </section>

{% capture guideFirstStep %}
<div class="l-guide-step-code" markdown="1">
```bash
npm install ngx-dynamic-hooks
```
</div>
{% endcapture %}

{% capture guideSecondStep %}
<div class="l-guide-step-code" markdown="1">
```ts
import { DynamicHooksComponent } from 'ngx-dynamic-hooks';

@Component({
  ...
  imports: [DynamicHooksComponent]
})
```
</div>
{% endcapture %}

{% capture guideThirdStep %}
<div class="l-guide-step-code" markdown="1">
```ts
// The content to parse
content = 'Load a component here: <app-example></app-example>';
// A list of components to look for
parsers = [ExampleComponent];
```
</div>
{% endcapture %}

{% capture guideFourthStep %}
<div class="l-guide-step-code" markdown="1">
```html
<ngx-dynamic-hooks [content]="content" [parsers]="parsers"></ngx-dynamic-hooks>
```
</div>
{% endcapture %}

  <section class="l-guide">
    <div class="l-guide-wrapper">
      <h2 class="l-guide-title">Getting started is <span class="l-guide-title-highlight">simple 👍</span></h2>
      <div class="l-guide-steps">

        <div class="l-guide-step">
          <div class="l-guide-step-nr">1</div>
          <div class="l-guide-step-content">
            <div class="l-guide-step-text">
              <p>Install the library with</p>
            </div>
            {{ guideFirstStep }}
          </div>
        </div>

        <div class="l-guide-arrow"><img src="{{ "/assets/images/narrow_arrow_down.png" | relative_url }}"></div>

        <div class="l-guide-step">
          <div class="l-guide-step-nr">2</div>
          <div class="l-guide-step-content">
            <div class="l-guide-step-text">
              <p>Import the <b>DynamicHooksComponent</b> wherever you need it</p>
            </div>
            {{ guideSecondStep }}
          </div>
        </div>

        <div class="l-guide-arrow"><img src="{{ "/assets/images/narrow_arrow_down.png" | relative_url }}"></div>

        <div class="l-guide-step">
          <div class="l-guide-step-nr">3</div>
          <div class="l-guide-step-content">
            <div class="l-guide-step-text">
              <p>Get your content and components to load</p>
            </div>
            {{ guideThirdStep }}
          </div>
        </div>

        <div class="l-guide-arrow"><img src="{{ "/assets/images/narrow_arrow_down.png" | relative_url }}"></div>

        <div class="l-guide-step">
          <div class="l-guide-step-nr">4</div>
          <div class="l-guide-step-content">
            <div class="l-guide-step-text">
              <p>And pass them to <i>&lt;ngx-dynamic-hooks&gt;</i></p>
            </div>
            {{ guideFourthStep }}
          </div>
        </div>
      </div>

      <div class="l-guide-result">
        <p class="l-guide-result-line"><b>That's it!</b> The content will now be rendered with a working <b>ExampleComponent</b> in it! 🎉</p>
        <a class="l-guide-result-button" href="{{ "documentation/v3" | relative_url }}" target="_blank">📄 To the full documentation </a>
      </div>

    </div>
  </section>

</article>