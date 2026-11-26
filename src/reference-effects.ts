// Small, self-contained replacements for the original hosted visual effects.
// No Squarespace application runtime or analytics are required.
export function initializeReferenceEffects(root: HTMLElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const namespace = 'http://www.w3.org/2000/svg';
  let disposed = false;
  const marquees = [...root.querySelectorAll<HTMLElement>('.Marquee')].map(element => {
    const svg = element.querySelector<SVGSVGElement>('.Marquee-svg')!;
    const path = element.querySelector<SVGPathElement>('.Marquee-path')!;
    const textPath = element.querySelector<SVGTextPathElement>('textPath.Marquee-svg-text')!;
    const items = [...element.querySelectorAll<HTMLElement>('.Marquee-measure .Marquee-item')];
    items.forEach(item => { item.style.marginRight = 'var(--marquee-item-spacing, .4em)'; });
    const id = `${element.dataset.blockId}-native-path`;
    path.id = id;
    textPath.setAttribute('href', `#${id}`);
    return { element, svg, path, textPath, items, period: 1, offset: 0, visible: false };
  });
  const highlights = [...root.querySelectorAll<HTMLElement>('.sqsrte-text-highlight')];
  // Match the original scale preset: larger headings, images and header items
  // scale from 90%; paragraphs and smaller headings fade in instead.
  const scaleSelector = 'h1,h2,h3,footer .sqs-block-content,[data-animation-role="image"]:not([data-animation-override]),[data-animation-role="quote"]:not([data-animation-override]),[data-animation-role="video"],[data-animation-role="section"],[data-animation-role="header-element"],.list-item-rich-animation,.sqs-block-marquee,.sqs-block-accordion,.sqs-block.sqs-background-enabled,.sqs-block-shape';
  const fadeSelector = 'h4,h5,p,[data-animation-role="button"],[data-animation-role="content"],[data-animation-role="date"],.list-item-basic-animation';
  const reveals = [...root.querySelectorAll<HTMLElement>(`${scaleSelector},${fadeSelector}`)].filter(element => !element.closest('.Marquee-measure,.form-wrapper.hidden,[data-has-block-animations]'));
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add(entry.target.classList.contains('preScale') ? 'scaleIn' : 'fadeIn');
      revealObserver.unobserve(entry.target);
    }
  });
  reveals.forEach((element, index) => {
    const scale = element.matches(scaleSelector);
    element.classList.add(scale ? 'preScale' : 'preFade');
    // Apply the delay only on reveal so the observer first sees the settled 90% scale.
    element.style.setProperty('--reference-reveal-delay', `${index * .6 / reveals.length}s`);
    if (motion.matches) element.classList.add(scale ? 'scaleIn' : 'fadeIn');
  });
  // Let the first layout and the header's ResizeObserver settle before observing.
  let revealFrame = requestAnimationFrame(() => {
    revealFrame = requestAnimationFrame(() => reveals.forEach(element => revealObserver.observe(element)));
  });

  const redraw = () => {
    if (disposed) return;
    for (const marquee of marquees) {
      const { element, svg, path, textPath, items } = marquee;
      const measured = items.map(item => ({
        width: item.clientWidth,
        spacing: parseFloat(getComputedStyle(item).marginRight) || 0,
        text: item.textContent!.trim(),
      }));
      const period = measured.reduce((total, item) => total + item.width + item.spacing, 0);
      if (!period || !items.length) continue;
      marquee.period = period;
      const height = items[0].clientHeight;
      const padding = 550; // Original wave-frequency setting is 4; intensity is 0.
      const count = Math.ceil((element.clientWidth + 2 * padding) / padding) + 1;
      const y = height * .662;
      let definition = `M${-padding},${y}`;
      for (let index = 0; index < count; index++) {
        const x = -padding + index * padding;
        definition += index === 0 ? ` L${x},${y}` : ` S${x - padding * .333},${y} ${x},${y}`;
      }
      path.setAttribute('d', definition);
      path.parentElement!.setAttribute('transform', `translate(0, ${height * .05})`);
      svg.style.height = `${height}px`;
      svg.style.transform = `translateY(${height * .1}px)`;
      svg.style.overflow = 'visible';
      const repetitions = Math.ceil((padding * count + period) / period);
      const spans: SVGTSpanElement[] = [];
      let x = 0;
      for (let index = 0; index < repetitions; index++) {
        for (const item of measured) {
          const span = document.createElementNS(namespace, 'tspan');
          span.setAttribute('class', 'Marquee-svg-text');
          span.setAttribute('x', String(x));
          span.textContent = item.text;
          spans.push(span);
          x += item.width + item.spacing;
        }
      }
      textPath.replaceChildren(...spans);
      element.dataset.ready = 'true';
    }
    for (const highlight of highlights) {
      const container = highlight.closest<HTMLElement>('.sqs-block-content')!;
      container.querySelectorAll('.reference-text-shape').forEach(shape => shape.remove());
      const range = document.createRange();
      range.selectNodeContents(highlight);
      const box = container.getBoundingClientRect();
      const fontSize = Math.floor(parseFloat(getComputedStyle(highlight).fontSize));
      for (const rectangle of range.getClientRects()) {
        if (rectangle.width < fontSize / 2) continue; // A trailing wrapped space.
        const width = Math.round(rectangle.width) + 2;
        const height = Math.round(rectangle.height);
        const shape = document.createElement('div');
        shape.className = 'reference-text-shape';
        shape.setAttribute('aria-hidden', 'true');
        Object.assign(shape.style, {
          left: `${Math.round(rectangle.left - box.left) - 1}px`,
          top: `${Math.round(rectangle.top - box.top)}px`,
          width: `${width}px`, height: `${height}px`, fontSize: `${fontSize}px`,
        });
        const svg = document.createElementNS(namespace, 'svg');
        const line = document.createElementNS(namespace, 'path');
        line.setAttribute('d', `M0,${height * .9} L${width},${height * .9}`);
        svg.append(line);
        shape.append(svg);
        container.append(shape);
      }
    }
  };
  let frame = 0;
  const tick = () => {
    for (const marquee of marquees) {
      if (!marquee.visible || motion.matches) continue;
      // The original advances one CSS pixel per animation frame, not per second.
      marquee.offset = (marquee.offset + 1) % marquee.period;
      marquee.textPath.setAttribute('startOffset', String(-marquee.offset));
    }
    if (!disposed) frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const marquee = marquees.find(item => item.element === entry.target);
      if (marquee) marquee.visible = entry.isIntersecting;
    }
  });
  marquees.forEach(item => observer.observe(item.element));
  redraw();
  void document.fonts.ready.then(redraw);
  window.addEventListener('resize', redraw);
  frame = requestAnimationFrame(tick);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(revealFrame);
    observer.disconnect();
    revealObserver.disconnect();
    reveals.forEach(element => {
      element.classList.remove('preScale', 'preFade', 'scaleIn', 'fadeIn');
      element.style.removeProperty('--reference-reveal-delay');
    });
    window.removeEventListener('resize', redraw);
    root.querySelectorAll('.reference-text-shape').forEach(shape => shape.remove());
  };
}
