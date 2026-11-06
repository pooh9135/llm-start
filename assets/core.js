/* Pure state and recommendation rules. No browser APIs or network calls. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LLMCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const modelIds = Object.freeze(['qwen2.5-coder:0.5b', 'qwen2.5-coder:1.5b', 'qwen2.5-coder:7b', 'qwen2.5-coder:14b']);
  const values = Object.freeze({ram: ['unknown', 'low', '8', '16', '32', '64'], gpu: ['unknown', 'integrated', 'nvidia', 'amd', 'intel', 'other'], vram: ['unknown', 'low', '4', '8', '12', '16', '24']});
  function normalizeState(input) {
    const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const s = raw.specs && typeof raw.specs === 'object' ? raw.specs : {};
    const specs = {};
    for (const key of Object.keys(values)) specs[key] = values[key].includes(s[key]) ? s[key] : 'unknown';
    if (specs.gpu === 'integrated') specs.vram = 'unknown';
    return {
      version: 2,
      completed: Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= 8))].sort((a, b) => a - b) : [],
      currentStep: Number.isInteger(raw.currentStep) && raw.currentStep >= 1 && raw.currentStep <= 8 ? raw.currentStep : 1,
      specs,
      manualModel: modelIds.includes(raw.manualModel) ? raw.manualModel : null
    };
  }
  function recommend(specs) {
    const s = normalizeState({specs}).specs;
    if (s.ram === 'low') return {id: modelIds[0], reason: 'RAMが8 GB未満のため、標準コースの対象外です。試すなら最小のモデルで基本動作だけを確認します。', warning: '0.5Bでも動作するとは限りません。アプリを閉じてもメモリが足りなければ、導入を中断してください。'};
    if (s.ram === 'unknown' || s.ram === '8') return {id: modelIds[1], reason: 'まずは軽量な1.5Bで、回答の様子とPCへの負荷を確認します。専用GPUがなくてもCPUで試せますが、速度はPCによって変わります。', warning: s.ram === 'unknown' ? 'RAMが不明なため動作可否は判断できません。STEP 1で確認してからダウンロードしてください。' : ''};
    const dedicated = ['nvidia', 'amd', 'intel', 'other'].includes(s.gpu);
    const gpuMemory = dedicated && ['8', '12', '16', '24'].includes(s.vram);
    if (s.ram === '64' && dedicated && ['16', '24'].includes(s.vram)) return {id: modelIds[3], reason: 'RAMと専用GPUメモリに余裕がある選択です。14Bも追加候補になりますが、初回は1.5Bで接続を確かめてから切り替えても構いません。', warning: 'GPUの製品名・ドライバーによる対応確認が必要です。VRAMだけではGPUで動くことを保証できません。'};
    if (s.ram === '32' || s.ram === '64' || (s.ram === '16' && gpuMemory)) return {id: modelIds[2], reason: 'メモリに余裕がある選択のため、7Bを試す候補にできます。動作が重ければ1.5Bに戻し、会話も短くしてください。', warning: 'GPUの対応や実際の空きメモリは未確認です。CPU実行では回答に時間がかかることがあります。'};
    return {id: modelIds[1], reason: '16 GBのRAMでは、ほかのアプリの余裕も残して1.5Bから始めます。接続できた後に大きなモデルを検討できます。', warning: ''};
  }
  function selectedModel(state) {
    const s = normalizeState(state);
    return s.manualModel || recommend(s.specs).id;
  }
  function setComplete(state, step, checked) {
    const s = normalizeState(state);
    if (!Number.isInteger(step) || step < 1 || step > 8) return s;
    s.completed = checked ? [...new Set([...s.completed, step])].sort((a,b) => a-b) : s.completed.filter(n => n !== step);
    return s;
  }
  function configFor(tag) {
    const id = modelIds.includes(tag) ? tag : modelIds[1];
    return ['name: My Local AI', 'version: 1.0.0', 'schema: v1', 'models:', '  - name: Local Coder', '    provider: ollama', `    model: ${id}`, '    apiBase: http://127.0.0.1:11434', '    roles:', '      - chat', '    defaultCompletionOptions:', '      contextLength: 4096'].join('\n');
  }
  return Object.freeze({modelIds, normalizeState, recommend, selectedModel, setComplete, configFor});
});
