const layouts = new WeakMap();

/** Réserver la phrase complète pour que sa révélation ne déplace aucun mot. */
export function revealQuestion(node, text, count = 0) {
  let layout = layouts.get(node);
  if (!layout || layout.text !== text || layout.root.parentNode !== node) {
    const root = document.createElement('span');
    root.setAttribute('aria-hidden', 'true');
    const letters = [];
    let offset = 0;
    for (const token of text.match(/\s+|\S+/gu) || []) {
      if (/^\s+$/u.test(token)) {
        root.append(document.createTextNode(token));
        offset += token.length;
        continue;
      }
      const word = document.createElement('span');
      word.className = 'question-word';
      for (const char of token) {
        const letter = document.createElement('span');
        letter.textContent = char;
        offset += char.length;
        letters.push({ node: letter, end: offset });
        word.append(letter);
      }
      root.append(word);
    }
    node.replaceChildren(root);
    layout = { text, root, letters };
    layouts.set(node, layout);
  }
  const visible = Math.max(0, Math.min(text.length, count));
  for (const letter of layout.letters) {
    letter.node.style.visibility = letter.end <= visible ? 'visible' : 'hidden';
  }
  node.setAttribute('aria-label', text.slice(0, visible));
}
