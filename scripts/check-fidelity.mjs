import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { createHash } from 'node:crypto';

const baseline = JSON.parse(readFileSync('tests/fidelity-baseline.json', 'utf8'));
const assetBaseline = JSON.parse(readFileSync('tests/fidelity-assets.json', 'utf8'));
for (const [path, hash] of Object.entries(assetBaseline)) {
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), hash, `Original asset changed: ${path}`);
}
let blocks = 0;
let images = new Set();
for (const [name, expected] of Object.entries(baseline)) {
  const source = readFileSync(`src/content/pages/${name}.html`, 'utf8');
  const { document } = parseHTML(source);
  const actual = [...document.querySelectorAll('#page .sqs-html-content, #page .accordion-item__title, #page .accordion-item__description')].map(element => ({
    text: element.textContent.replace(/\s+/g, ' ').trim(),
    links: [...element.querySelectorAll('a')].map(a => ({ text: a.textContent, href: a.getAttribute('href') })),
    emphasis: [...element.querySelectorAll('em,strong')].map(a => ({ tag: a.tagName.toLowerCase(), text: a.textContent })),
  }));
  assert.deepEqual(actual, expected, `${name}: original copy, links, or emphasis changed`);
  assert.equal(document.querySelectorAll('script').length, 0, `${name}: unexpected script`);
  assert.ok(!source.includes('[object Object]'), `${name}: invalid serialized SVG attribute`);
  for (const marquee of document.querySelectorAll('.Marquee')) {
    assert.ok(marquee.querySelector('.Marquee-svg') && marquee.querySelector('.Marquee-path') && marquee.querySelector('.Marquee-svg-text'), `${name}: missing marquee SVG structure`);
  }
  for (const element of document.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      assert.ok(!/^on/i.test(attribute.name), `${name}: inline event handler`);
    }
  }
  for (const image of document.querySelectorAll('img')) {
    const path = image.getAttribute('src');
    assert.ok(path.startsWith('/images/original/'), `${name}: image is not stored locally`);
    assert.ok(existsSync(`public${path}`), `${name}: missing image ${path}`);
    images.add(path);
  }
  for (const video of document.querySelectorAll('video')) {
    assert.ok(existsSync(`public${video.getAttribute('src')}`), `${name}: missing video`);
    assert.ok(video.hasAttribute('muted') && video.hasAttribute('playsinline'));
    assert.ok(existsSync(`public${video.getAttribute('poster')}`), `${name}: missing video poster`);
  }
  const buttons = [...document.querySelectorAll('.accordion-item__click-target')];
  for (const button of buttons) {
    assert.ok(document.getElementById(button.getAttribute('aria-controls')), `${name}: missing accordion panel`);
  }
  blocks += actual.length;
  console.log(`${name}: ${actual.length} original content blocks match; ${buttons.length} accordion controls checked`);
}

const { document: contact } = parseHTML(readFileSync('src/content/pages/contact.html', 'utf8'));
const form = contact.querySelector('form');
assert.equal(form.getAttribute('name'), 'contact');
assert.equal(form.getAttribute('method').toLowerCase(), 'post');
assert.equal(form.getAttribute('action'), '/thank-you');
for (const name of ['firstName', 'lastName', 'email', 'subject', 'message']) {
  const input = form.querySelector(`[name="${name}"]`);
  assert.ok(input && input.hasAttribute('required'), `contact: missing required field ${name}`);
}
console.log(`PASS: ${blocks} content blocks, original links and emphasis, ${images.size} local image assets, video assets, and contact-form structure.`);
console.log(`PASS: ${Object.keys(assetBaseline).length} original image/video files match their saved SHA-256 fingerprints.`);
