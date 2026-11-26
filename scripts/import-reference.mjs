// Converts the owner's public Squarespace pages into a portable, script-free
// reference. Outputs JSON; callers apply the generated files as reviewed patches.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import postcss from 'postcss';

const [directory, mode = 'summary', pageName = 'home'] = process.argv.slice(2);
const names = ['home', 'about', 'schedule', 'participants', 'art', 'contact'];
const assets = new Map();
const documents = names.map(name => {
  const { document } = parseHTML(readFileSync(`${directory}/${name}.html`, 'utf8'));
  return { name, document };
});
const localAsset = value => {
  const url = new URL(value, 'https://enfoldsciart.com');
  url.search = '';
  const filename = decodeURIComponent(url.pathname.split('/').pop());
  const stem = filename.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const ext = filename.match(/\.[a-z0-9]+$/i)?.[0] || '.png';
  const path = `/images/original/${stem}-${createHash('sha256').update(url.href).digest('hex').slice(0,8)}${ext}`;
  assets.set(path, url.href);
  return path;
};
// Rich text uses white-space: pre-wrap. Reformatting HTML between inline tags
// introduces visible line breaks, so preserve every original text node.
const cleanWhitespace = html => html.replace(/<!--[\s\S]*?-->/g, '');
const baseline = document => [...document.querySelectorAll('#page .sqs-html-content, #page .accordion-item__title, #page .accordion-item__description')].map(e => ({
  text: e.textContent.replace(/\s+/g, ' ').trim(),
  links: [...e.querySelectorAll('a')].map(a => ({ text: a.textContent, href: a.getAttribute('href') })),
  emphasis: [...e.querySelectorAll('em,strong')].map(a => ({tag:a.tagName.toLowerCase(),text:a.textContent})),
}));

for (const { document } of documents) {
  for (const img of document.querySelectorAll('#siteWrapper img')) {
    const source = img.getAttribute('data-src') || img.getAttribute('src');
    if (source) img.setAttribute('src', localAsset(source));
    img.removeAttribute('srcset');
    img.removeAttribute('data-src');
    img.removeAttribute('data-image');
    img.removeAttribute('data-loader');
    img.setAttribute('decoding', 'async');
  }
}
const sourceBaselines = Object.fromEntries(documents.map(({name,document}) => [name, baseline(document)]));
const pageStyles = {};
for (const { name, document } of documents) {
  const styles = [...document.querySelectorAll('#siteWrapper style')].map(e => e.textContent);
  pageStyles[name] = styles.join('\n');
  if (name === 'home') {
    document.querySelector('img[alt="sand texture"]')?.closest('[data-animation-role="image"]')?.setAttribute('data-texture-reveal', '');
  }
  for (const video of document.querySelectorAll('[data-config-native-video]')) {
    const poster = video.querySelector('img')?.getAttribute('src');
    const strength = video.getAttribute('data-config-filter-strength') || '100';
    video.innerHTML = `<video class="reference-background-video" autoplay muted loop playsinline preload="auto" poster="${poster}" src="/media/header-bg.mp4"></video>`;
    video.setAttribute('style', `filter:opacity(${strength}%);`);
  }
  for (const embed of document.querySelectorAll('.sqs-video-wrapper[data-html]')) {
    embed.innerHTML = embed.getAttribute('data-html');
  }
  for (const map of document.querySelectorAll('.map-block .sqs-block-content')) {
    map.innerHTML = '<iframe class="reference-map" title="Burroughs Wellcome Fund map" loading="lazy" src="https://maps.google.com/maps?q=Burroughs+Wellcome+Fund&ll=35.9227101,-78.8710089&z=12&output=embed"></iframe>';
  }
  if (name === 'contact') {
    document.querySelector('.form-wrapper').innerHTML = readFileSync('scripts/reference-contact-form.html','utf8');
  }
  for (const el of document.querySelectorAll('#siteWrapper *')) {
    if (['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)) { el.remove(); continue; }
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name) || /^data-(block-scripts|block-css|controller|current-|config-|context|localized|website-component|block-type|html|test|section-model|regions-source|reg.*source|collection-id|item-id|sqsp-id)/.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.hasAttribute('class')) el.setAttribute('class', el.getAttribute('class').trim().replace(/\s+/g,' '));
  }
  document.querySelector('header')?.classList.add('header--menu-ready');
  for (const button of document.querySelectorAll('.header-burger-btn')) {
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-controls','header-menu');
  }
  document.querySelector('.header-menu')?.setAttribute('id','header-menu');
  for (const menu of document.querySelectorAll('.header-menu-nav-folder')) menu.classList.add('header-menu-nav-folder--active');
}

if (mode === 'assets') {
  const urls = new Set();
  for (const {document} of documents) for (const link of document.querySelectorAll('link[rel="stylesheet"]')) urls.add(new URL(link.href,'https://enfoldsciart.com').href);
  console.log(JSON.stringify({images:[...assets].map(([path,url])=>({path,url})),styles:[...urls].map((url,i)=>({path:`${directory}/style-${i}.css`,url}))}));
} else if (mode === 'page' || mode === 'page-chunk') {
  const {document} = documents.find(d=>d.name===pageName);
  const data={html:cleanWhitespace(document.querySelector('#page').outerHTML),css:pageStyles[pageName],title:document.querySelector('title').textContent,bodyClass:document.body.className};
  if(mode==='page-chunk') {
    const field=process.argv[5]||'html';
    const offset=Number(process.argv[6]||0);
    console.log(JSON.stringify({chunk:data[field].slice(offset,offset+12000),total:data[field].length}));
  } else console.log(JSON.stringify(data));
} else if (mode === 'common') {
  const d=documents[0].document;
  const fullClasses=d.body.className.split(/\s+/).filter(c=>c&&!c.startsWith('collection-')&&c!=='homepage'&&!c.startsWith('tweak-blog')&&!c.startsWith('tweak-portfolio')&&!c.startsWith('tweak-product')&&!c.startsWith('tweak-events')&&!c.startsWith('hide-opentable')&&!c.startsWith('opentable-')&&!c.startsWith('native-currency'));
  console.log(JSON.stringify({header:cleanWhitespace(d.querySelector('header').outerHTML),footer:cleanWhitespace(d.querySelector('footer').outerHTML),bodyClass:fullClasses.join(' '),baseline:sourceBaselines}));
} else if (mode === 'styles') {
  const styleFiles=readdirSync(directory).filter(f=>/^style-.*\.css$/.test(f));
  const root=postcss.parse(styleFiles.map(f=>readFileSync(`${directory}/${f}`,'utf8')).join('\n'));
  // Preserve all state-dependent selectors while eliminating unrelated commerce,
  // blog, account, and portfolio styles. Retain unknown selectors conservatively.
  const neverRelevant=/\.(?:product-|Product|blog-|Blog|portfolio-|Portfolio|sqs-account|customer-|checkout-|cart-|Cart|course-|Course|lesson-|Lesson|calendar-|Calendar|collection-type-blog|collection-type-products|collection-type-events)/;
  root.walkRules(rule=>{
    if(rule.parent?.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
    const selectors=rule.selectors.filter(selector=>{
      if(neverRelevant.test(selector))return false;
      if(/header|burger|accordion|form-item|form-input|react-form|form-button|sqs-site-style-form|form-submit/.test(selector))return true;
      const staticSelector=selector.replace(/::?[a-z-]+(?:\([^()]*\))?/gi,(match)=>/^:(?:root|not|is|where|has|first-child|last-child|nth-child|only-child|first-of-type|last-of-type|nth-of-type)/.test(match)?match:'');
      try { return documents.some(({document})=>document.querySelector(staticSelector)); }
      catch { return true; }
    });
    if(!selectors.length)rule.remove();else rule.selectors=selectors;
  });
  root.walkComments(c=>c.remove());
  root.walkAtRules(r=>{if(r.nodes&&!r.nodes.length)r.remove();});
  const css=root.toString();
  const offset=Number(process.argv[5]||0);
  console.log(JSON.stringify({chunk:css.slice(offset,offset+12000),total:css.length}));
} else {
  console.log(JSON.stringify(documents.map(({name,document})=>({name,blocks:document.querySelectorAll('#page .sqs-block').length,html:document.querySelector('#page').outerHTML.length,css:pageStyles[name].length}))));
}
