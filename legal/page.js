import { SELLER, sellerComplete } from '../js/legal-config.js';
for (const node of document.querySelectorAll('[data-seller]')) node.textContent = SELLER[node.dataset.seller] || 'À compléter avant ouverture des ventes';
for (const node of document.querySelectorAll('[data-contact]')) {
  node.href = 'mailto:' + SELLER.email;
  node.textContent = SELLER.email;
}
const draft = document.querySelector('#legalDraft');
if (draft) draft.hidden = sellerComplete();
document.querySelector('#printLegal')?.addEventListener('click', () => window.print());
const headings = [...document.querySelectorAll('main > h2')];
if (headings.length > 2) {
  const toc = document.createElement('nav');
  toc.className = 'legal-toc';
  toc.setAttribute('aria-label', 'Sommaire');
  headings.forEach((h, i) => {
    h.id ||= 'section-' + (i + 1);
    const link = document.createElement('a');
    link.href = '#' + h.id;
    link.textContent = h.textContent;
    toc.append(link);
  });
  document.querySelector('#printLegal').after(toc);
}
