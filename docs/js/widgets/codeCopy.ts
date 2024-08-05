import { GenericWidgetController, Widget } from "../widgetBootstrap";

export class CodeCopyWidget implements Widget {
  static selector: string = 'pre > code';
  wrapperElement: HTMLElement|null = null;
  button = document.createElement('button');

  onMount(hostElement: Element, data: {[key: string]: any}, controller: GenericWidgetController) {
    this.wrapperElement = (hostElement as HTMLElement).parentElement!.parentElement!;
    this.wrapperElement.style.position = 'relative';

    this.button.classList.add('copyToClipboard');
    this.button.textContent = '📄 Copy';
    this.wrapperElement.appendChild(this.button);

    this.button.addEventListener('click', event => {
      this.copyToClipboard();
      this.button.textContent = 'Copied!';
    });

    // Reset when unhovering
    ['blur', 'mouseleave'].forEach(eventName => {
      this.wrapperElement!.addEventListener(eventName, event => {
        this.button.textContent = '📄 Copy';
      })
    });
  }

  async copyToClipboard() {
    const copyText = (this.wrapperElement as HTMLElement).querySelector('code')!.textContent!;
    await navigator.clipboard.writeText(copyText);
  }
}