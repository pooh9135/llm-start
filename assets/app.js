/* Browser-local interactions only. No telemetry, API calls, or remote imports. */
(() => {
  'use strict';
  const core = window.LLMCore;
  const catalog = window.LLMCatalog;
  if (!core || !catalog) return;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const key = 'llm-start-state-v3';
  const legacyKey = 'llm-start-state-v2';
  let storageAvailable = true;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem(legacyKey) ?? 'null'); } catch (e) { if (!(e instanceof SyntaxError)) storageAvailable = false; }
  let state = core.normalizeState(raw);
  const announce = text => { $('#announcement').textContent = text; };
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { storageAvailable = false; }
    const notice = $('#storage-notice');
    notice.hidden = storageAvailable;
    $$('[data-save-label]').forEach(el => { el.textContent = storageAvailable ? 'このブラウザに保存' : 'この画面内のみ'; });
  }
  document.body.classList.add('enhanced');

  // Keep ordinary navigation and all articles usable when JavaScript is absent.
  const toggle = $('.menu-toggle');
  toggle.hidden = false;
  const menu = $('#main-menu');
  function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); }
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });

  function renderProgress() {
    const count = state.completed.length;
    $$('[data-progress-count]').forEach(el => { el.textContent = count; });
    $$('[data-progress-percent]').forEach(el => { el.textContent = `${Math.round(count / core.stepCount * 100)}%`; });
    $$('[data-progress]').forEach(el => { el.value = count; el.setAttribute('aria-valuetext', `${count} / ${core.stepCount} ステップ完了`); });
    $$('[data-complete]').forEach(el => { el.disabled = false; el.checked = state.completed.includes(Number(el.dataset.complete)); });
    $$('[data-step-link]').forEach(el => { const done = state.completed.includes(Number(el.dataset.stepLink)); el.classList.toggle('is-complete', done); $('.step-state', el).textContent = done ? '（完了）' : ''; });
    $$('[data-start]').forEach(el => {
      el.href = `guide.html#step-${state.currentStep}`;
      const started = count > 0 || state.currentStep > 1;
      el.firstChild.textContent = started ? 'ガイドを再開 ' : 'ガイドを始める ';
    });
    $$('[data-resume]').forEach(el => { el.href = `guide.html#step-${state.currentStep}`; });
    const homeResume = $('#home-resume');
    if (homeResume) homeResume.hidden = count === 0 && state.currentStep === 1;
    const allDone = $('#all-done');
    if (allDone) allDone.hidden = count !== core.stepCount;
  }

  function renderModel() {
    const result = core.recommend(state.specs);
    const id = core.selectedModel(state);
    const model = catalog.models[id];
    for (const name of ['ram', 'gpu', 'vram']) { const el = $(`#${name}`); if (el) el.value = state.specs[name]; }
    const vram = $('#vram');
    if (vram) vram.disabled = state.specs.gpu === 'integrated';
    const choice = $('#model-choice');
    if (choice) choice.value = state.manualModel || 'auto';
    const name = $('#recommend-name');
    if (name) {
      name.replaceChildren(document.createTextNode(model.name + ' '));
      const scale = document.createElement('span'); scale.textContent = model.scale; name.append(scale);
      $('#recommend-size').textContent = model.size;
      $('#recommend-reason').textContent = state.manualModel ? `手動で${model.scale}を選択しています。${model.description}` : result.reason;
      const warn = $('#recommend-warning');
      const warning = state.manualModel ? `手動選択はPC条件で制限していません。${model.ram}。実際の空きメモリとGPU対応を確認してください。` : result.warning;
      warn.textContent = warning; warn.hidden = !warning;
    }
    $$('[data-model-tag]').forEach(el => { el.textContent = id; });
    $$('[data-model-size]').forEach(el => { el.textContent = model.size; });
    $$('[data-model-command]').forEach(el => { el.textContent = `ollama ${el.dataset.modelCommand} ${id}`; });
    $$('[data-model-config]').forEach(el => { el.textContent = core.configFor(id); });
  }
  for (const name of ['ram', 'gpu', 'vram']) {
    const el = $(`#${name}`);
    if (el) el.addEventListener('change', () => { state.specs[name] = el.value; state = core.normalizeState(state); renderModel(); save(); });
  }
  const modelChoice = $('#model-choice');
  if (modelChoice) modelChoice.addEventListener('change', () => { state.manualModel = modelChoice.value === 'auto' ? null : modelChoice.value; state = core.normalizeState(state); renderModel(); save(); });

  const steps = $$('[data-step]');
  const stepMenu = $('.step-menu');
  const mobileGuide = window.matchMedia('(max-width: 860px)');
  if (stepMenu) {
    stepMenu.open = !mobileGuide.matches;
    mobileGuide.addEventListener('change', e => { stepMenu.open = !e.matches; });
  }
  function showStep({navigate = false} = {}) {
    if (!steps.length) return;
    const match = /^#step-([1-8])$/.exec(location.hash);
    const requested = match ? Number(match[1]) : state.currentStep;
    const number = core.stepIds.includes(requested) ? requested : requested === 2 ? 3 : state.currentStep;
    state.currentStep = number;
    const target = $(`#step-${number}`);
    steps.forEach(el => { el.hidden = Number(el.dataset.step) !== number; });
    $$('[data-step-link]').forEach(el => {
      if (Number(el.dataset.stepLink) === number) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    document.title = `STEP ${core.stepIds.indexOf(number) + 1}：${$('h2', target).textContent} — LLM START`;
    if (!match || number !== requested) history.replaceState(null, '', `#step-${number}`);
    if (navigate) {
      if (stepMenu && mobileGuide.matches) stepMenu.open = false;
      requestAnimationFrame(() => { target.scrollIntoView({block: 'start', behavior: 'instant'}); $('h2', target).focus({preventScroll: true}); });
    }
    renderProgress(); save();
  }
  $$('[data-complete]').forEach(el => el.addEventListener('change', () => {
    state = core.setComplete(state, Number(el.dataset.complete), el.checked);
    renderProgress(); save();
    announce(state.completed.length === core.stepCount ? '全7ステップが完了しました。' : `${state.completed.length} / ${core.stepCount} ステップ完了。${storageAvailable ? '進捗を保存しました。' : 'この画面内でチェックしました。'}`);
  }));
  const reset = $('#reset-progress');
  if (reset) reset.addEventListener('click', () => { state.completed = []; renderProgress(); save(); const panel = reset.closest('details'); panel.open = false; $('summary', panel).focus(); announce('完了チェックをリセットしました。'); });
  $$('a[href^="#step-"]').forEach(link => link.addEventListener('click', () => { if (link.getAttribute('href') === location.hash) showStep({navigate: true}); }));

  async function copyText(text) {
    try { if (!navigator.clipboard?.writeText) throw new Error('Unavailable'); await navigator.clipboard.writeText(text); return true; }
    catch {
      const active = document.activeElement;
      const area = document.createElement('textarea');
      area.value = text; area.className = 'clipboard-helper'; area.setAttribute('aria-label', 'コピーするテキスト');
      document.body.append(area); area.focus(); area.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* User can select text manually. */ }
      finally { area.remove(); if (active instanceof HTMLElement) active.focus({preventScroll: true}); }
      return Boolean(copied);
    }
  }
  const timers = new WeakMap();
  $$('[data-copy]').forEach(button => {
    button.hidden = false;
    const label = $('.code-head > span', button.closest('.code-box'))?.textContent || 'テキスト';
    button.setAttribute('aria-label', `${label}をコピー`);
    button.addEventListener('click', async () => {
      const source = document.getElementById(button.dataset.copy);
      if (!source) return;
      const text = source.textContent.trim();
      const success = await copyText(text);
      clearTimeout(timers.get(button));
      button.textContent = success ? 'コピーしました' : 'コピーできません';
      let feedback = $('.copy-feedback', button.closest('.code-box'));
      if (!feedback) { feedback = document.createElement('p'); feedback.className = 'copy-feedback'; button.closest('.code-box').append(feedback); }
      feedback.textContent = success ? 'コピーしました。指定された入力先に貼り付けてください。' : 'コピーできませんでした。コードの文字を選択してコピーしてください。';
      feedback.classList.toggle('copy-error', !success);
      announce(feedback.textContent);
      timers.set(button, setTimeout(() => { button.textContent = 'コピー'; feedback.remove(); }, 3500));
    });
  });

  const search = $('#faq-search');
  if (search) {
    $('.faq-search').hidden = false;
    search.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('ja');
      let count = 0;
      $$('.faq-item').forEach(item => { const matches = item.textContent.toLocaleLowerCase('ja').includes(query); item.hidden = !matches; if (matches) count++; });
      $('#faq-count').textContent = `${count}件の質問`;
      $('#faq-empty').hidden = count !== 0;
    });
  }
  function openHashDetail() {
    if (!location.hash || steps.length) return;
    const id = location.hash.slice(1);
    const item = document.getElementById(id);
    if (item instanceof HTMLDetailsElement) { item.hidden = false; item.open = true; requestAnimationFrame(() => item.scrollIntoView({block: 'start', behavior: 'instant'})); }
  }
  window.addEventListener('hashchange', () => { showStep({navigate: true}); openHashDetail(); });
  window.addEventListener('storage', e => {
    if (e.key !== key && e.key !== null) return;
    try { state = core.normalizeState(JSON.parse(e.newValue || 'null')); } catch { state = core.normalizeState(null); }
    const ownStep = /^#step-([1-8])$/.exec(location.hash);
    if (steps.length && ownStep && core.stepIds.includes(Number(ownStep[1]))) state.currentStep = Number(ownStep[1]);
    renderModel(); renderProgress();
  });
  renderModel(); renderProgress(); showStep(); openHashDetail(); save();
})();
