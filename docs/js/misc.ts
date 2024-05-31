export const initCopyrightDate = () => {
  const copyrightDateElements = document.querySelectorAll('.copyright-date');
  for (const copyrightDateElement of copyrightDateElements) {
    copyrightDateElement.innerHTML = new Date().getFullYear().toString();
  }
}