
// Elements
const $msgs   = document.getElementById('messages');
const $input  = document.getElementById('input');
const $system = document.getElementById('system');
const $status = document.getElementById('status');
const $reset  = document.getElementById('resetChat');
const $settingsBtn = document.getElementById('settingsBtn');
const $themeToggle = document.getElementById('themeToggle');
const $drawer = document.getElementById('drawer');
const $closeDrawer = document.getElementById('closeDrawer');
const $modelInput = document.getElementById('modelInput');
const $tempInput = document.getElementById('tempInput');
const $toppInput = document.getElementById('toppInput');
const $presetSelect = document.getElementById('presetSelect');
const $saveSettings = document.getElementById('saveSettings');
const $convList = document.getElementById('convList');
const $newChat = document.getElementById('newChat');
const $exportAll = document.getElementById('exportAll');
const $importAll = document.getElementById('importAll');
const $convTitle = document.getElementById('convTitle');
const $renameChat = document.getElementById('renameChat');
const $deleteChat = document.getElementById('deleteChat');
const $exportChat = document.getElementById('exportChat');
const $tagInput = document.getElementById('tagInput');
const $tags = document.getElementById('tags');
const $chatPreset = document.getElementById('chatPreset');
const $colorPicker = document.getElementById('colorPicker');
const $colorDot = document.getElementById('colorDot');
const $pinToggle = document.getElementById('pinToggle');
const $tagFilter = document.getElementById('tagFilter');

document.getElementById('year').textContent = new Date().getFullYear();

// Theme handling
const THEME_KEY = 'core-theme';
function loadTheme(){ try{ return localStorage.getItem(THEME_KEY) || 'default'; }catch{return 'default'} }
function saveTheme(t){ try{ localStorage.setItem(THEME_KEY, t); }catch{} }
function applyTheme(t){ if(t === 'tech-dark'){ document.body.classList.add('tech-dark'); $themeToggle.setAttribute('aria-pressed','true'); $themeToggle.textContent='🧡'; } else { document.body.classList.remove('tech-dark'); $themeToggle.setAttribute('aria-pressed','false'); $themeToggle.textContent='🖤'; } }
let theme = loadTheme(); applyTheme(theme);
if($themeToggle) $themeToggle.onclick = ()=>{ theme = theme === 'tech-dark' ? 'default' : 'tech-dark'; applyTheme(theme); saveTheme(theme); };

// Storage keys
const SETTINGS_KEY = 'core-settings';
const INDEX_KEY    = 'core-conv-index';
const CONV_PREFIX  = 'core-conv:';
const UI_KEY       = 'core-ui';

// Settings
const defaults = { model: 'llama3.1:8b', temperature: 0.4, top_p: 0.9, preset: '' };
function loadSettings(){ try{const raw=localStorage.getItem(SETTINGS_KEY); return raw?{...defaults,...JSON.parse(raw)}:{...defaults};}catch{return {...defaults};} }
function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
let settings = loadSettings();
$modelInput.value = settings.model; $tempInput.value=String(settings.temperature); $toppInput.value=String(settings.top_p); $presetSelect.value=settings.preset;
function openDrawer(){ $drawer.setAttribute('aria-hidden','false'); $drawer.classList.add('open'); }
function closeDrawer(){ $drawer.setAttribute('aria-hidden','true'); $drawer.classList.remove('open'); }
$settingsBtn.onclick=openDrawer; $closeDrawer.onclick=closeDrawer;
$saveSettings.onclick=()=>{ settings={ model:($modelInput.value||defaults.model).trim(), temperature:Math.max(0,Math.min(1,parseFloat($tempInput.value||defaults.temperature))), top_p:Math.max(0,Math.min(1,parseFloat($toppInput.value||defaults.top_p))), preset:$presetSelect.value||'' }; saveSettings(settings); if(settings.preset) $system.value=settings.preset; closeDrawer(); };

// UI
function loadUI(){ try{ return JSON.parse(localStorage.getItem(UI_KEY) || '{"selectedTag":"__ALL__"}'); }catch{ return {selectedTag:'__ALL__'}; } }
function saveUI(u){ localStorage.setItem(UI_KEY, JSON.stringify(u)); }
let ui = loadUI();

// Conversations
function newId(){ return 'c_' + Math.random().toString(36).slice(2,10); }
function loadIndex(){ try{ return JSON.parse(localStorage.getItem(INDEX_KEY)||'[]'); }catch{ return []; } }
function saveIndex(ids){ localStorage.setItem(INDEX_KEY, JSON.stringify(ids)); }
function normalizeConv(conv){
  return {
    id: conv.id,
    title: conv.title || 'Untitled Chat',
    messages: Array.isArray(conv.messages) ? conv.messages : [],
    tags: Array.isArray(conv.tags) ? conv.tags : [],
    color: conv.color || '#60a5fa',
    systemPreset: conv.systemPreset || '',
    systemText: conv.systemText || '',
    pinned: !!conv.pinned
  };
}
function loadConv(id){ try{ return normalizeConv(JSON.parse(localStorage.getItem(CONV_PREFIX+id)||'{}')); }catch{ return normalizeConv({id, title:'Untitled Chat', messages:[]}); } }
function saveConv(conv){ localStorage.setItem(CONV_PREFIX+conv.id, JSON.stringify(normalizeConv(conv))); }

let index = loadIndex();
if (!index.length) { const id = newId(); saveConv({id, title:'Untitled Chat', messages:[]}); index=[id]; saveIndex(index); }
let currentId = index[0];

function createConversation(title){
  const id = newId();
  const conv = normalizeConv({ id, title: title||'Untitled Chat', messages:[], tags:[], color:'#60a5fa', pinned:false });
  saveConv(conv);
  index = [id, ...index.filter(x=>x!==id)];
  saveIndex(index);
  renderEverything(); selectConversation(id);
  return id;
}

function deleteConversation(id){
  localStorage.removeItem(CONV_PREFIX+id);
  index = index.filter(x=>x!==id);
  saveIndex(index);
  if(currentId===id) currentId = index[0] || createConversation('Untitled Chat');
  renderEverything(); selectConversation(currentId);
}

function renameConversation(id, title){
  const conv = loadConv(id);
  conv.title = title || 'Untitled Chat';
  saveConv(conv);
  renderEverything();
  if(currentId===id) $convTitle.value = conv.title;
}

function togglePin(id){
  const conv = loadConv(id);
  conv.pinned = !conv.pinned;
  saveConv(conv);
  renderEverything();
}

function conversationPreview(conv){
  if (conv.title && conv.title !== 'Untitled Chat') return conv.title;
  const firstUser = conv.messages.find(m=>m.role==='user');
  return firstUser ? (firstUser.content.slice(0,40) + (firstUser.content.length>40?'…':'')) : 'Untitled Chat';
}

function uniqueTags(){
  const set = new Set();
  index.forEach(id => loadConv(id).tags.forEach(t => set.add(t)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function renderTagFilter(){
  $tagFilter.innerHTML='';
  const mk = (label, val) => {
    const span = document.createElement('span');
    span.className = 'tag-pill' + (ui.selectedTag===val ? ' active' : '');
    span.textContent = label;
    span.onclick = () => { ui.selectedTag = val; saveUI(ui); renderEverything(); };
    return span;
  };
  $tagFilter.appendChild(mk('All', '__ALL__'));
  uniqueTags().forEach(t => $tagFilter.appendChild(mk(t, t)));
}

function filterMatches(conv){
  if (ui.selectedTag==='__ALL__') return true;
  return conv.tags.includes(ui.selectedTag);
}

function byPinnedThenIndex(a, b){
  const ca = loadConv(a), cb = loadConv(b);
  if (ca.pinned && !cb.pinned) return -1;
  if (!ca.pinned && cb.pinned) return 1;
  return index.indexOf(a) - index.indexOf(b);
}

function renderSidebar(){
  const ids = index.slice().sort(byPinnedThenIndex).filter(id => filterMatches(loadConv(id)));
  $convList.innerHTML='';
  ids.forEach(id=>{
    const conv = loadConv(id);
    const item = document.createElement('div');
    item.className = 'conv-item' + (id===currentId?' active':'');

    const left = document.createElement('div');
    left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
    const dot = document.createElement('span'); dot.className='dot'; dot.style.background = conv.color || '#60a5fa';
    const title = document.createElement('div'); title.className='title'; title.textContent = conversationPreview(conv);
    left.append(dot, title);

    const right = document.createElement('div'); right.className='mini';
    const pin = document.createElement('button'); pin.textContent = conv.pinned ? '★' : '☆'; pin.title = conv.pinned?'Unpin':'Pin'; pin.onclick=(e)=>{e.stopPropagation(); togglePin(id);};
    const b1 = document.createElement('button'); b1.textContent='⎘'; b1.title='Export'; b1.onclick=(e)=>{e.stopPropagation(); exportSingle(conv);};
    const b2 = document.createElement('button'); b2.textContent='✎'; b2.title='Rename'; b2.onclick=(e)=>{e.stopPropagation(); const t=prompt('Rename chat', conv.title||''); if(t!=null) renameConversation(id, t.trim());};
    const b3 = document.createElement('button'); b3.textContent='🗑'; b3.title='Delete'; b3.onclick=(e)=>{e.stopPropagation(); if(confirm('Delete this chat?')) deleteConversation(id);};
    right.append(pin,b1,b2,b3);

    item.append(left, right);
    item.onclick=()=>selectConversation(id);
    $convList.appendChild(item);
  });
}

function renderTags(conv){
  $tags.innerHTML='';
  conv.tags.forEach((t, idx)=>{
    const chip = document.createElement('span');
    chip.className='tag';
    chip.innerHTML = `<span>${t}</span><span class="x" title="Remove">✕</span>`;
    chip.querySelector('.x').onclick = ()=>{
      const c = loadConv(currentId);
      c.tags.splice(idx,1);
      saveConv(c); renderEverything();
    };
    $tags.appendChild(chip);
  });
}

function selectConversation(id){
  currentId = id;
  const conv = loadConv(id);
  $convTitle.value = conv.title || 'Untitled Chat';
  $chatPreset.value = conv.systemPreset || '';
  $system.value = conv.systemText || conv.systemPreset || '';
  $colorPicker.value = conv.color || '#60a5fa';
  $colorDot.style.background = conv.color || '#60a5fa';
  $pinToggle.textContent = conv.pinned ? '★' : '☆';
  renderTags(conv);
  renderMessages(conv.messages);
}

function renderMessages(messages){
  $msgs.innerHTML='';
  messages.forEach(m => addBubble(m.role, m.content, m.time));
  $msgs.scrollTop = $msgs.scrollHeight;
}

function addBubble(role, text, time = new Date().toLocaleTimeString()) {
  const wrap = document.createElement('div');
  wrap.className = `bubble ${role}`;
  const content = document.createElement('div');
  content.className = 'text';
  content.textContent = text;
  wrap.appendChild(content);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<span>${time}</span><button class="copy" title="Copy">⧉</button>`;
  wrap.appendChild(meta);
  meta.querySelector('.copy').onclick = () => navigator.clipboard.writeText(text).catch(()=>{});
  $msgs.appendChild(wrap);
  $msgs.scrollTop = $msgs.scrollHeight;
  return wrap;
}

// Button handlers
$newChat.onclick = ()=> createConversation('Untitled Chat');
$renameChat.onclick = ()=>{ const t = prompt('Rename chat', $convTitle.value || ''); if(t!=null) { $convTitle.value=t.trim(); renameConversation(currentId, $convTitle.value);} };
$deleteChat.onclick = ()=>{ if (confirm('Delete this chat?')) deleteConversation(currentId); };
$exportChat.onclick = ()=>{ exportSingle(loadConv(currentId)); };
$pinToggle.onclick = ()=> togglePin(currentId);

// Export helpers
function download(filename, dataStr){
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  a.download = filename;
  a.click();
}
function exportSingle(conv){
  const payload = JSON.stringify(conv, null, 2);
  download(`${conv.title||'chat'}.json`, payload);
}
$exportAll.onclick = ()=>{
  const all = index.map(id => loadConv(id));
  download(`tacticdev-core-chats.json`, JSON.stringify({ version:4, conversations: all }, null, 2));
};

// Import
$importAll.onchange = (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(reader.result);
      const list = obj.conversations || (Array.isArray(obj) ? obj : []);
      if (!Array.isArray(list)) throw new Error('Invalid import format');
      list.forEach(conv=>{
        if(!conv.id) conv.id = newId();
        const normalized = normalizeConv(conv);
        saveConv(normalized);
        if(!index.includes(normalized.id)) index.unshift(normalized.id);
      });
      saveIndex(index);
      renderEverything();
      if (index.length) selectConversation(index[0]);
      alert(`Imported ${list.length} conversation(s).`);
    }catch(err){ alert('Import failed: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
};

// API Configuration
// Set API_BASE_URL to point to your backend server
// Examples: 'https://api.tacticdev.com', 'http://localhost:8787'
const API_BASE_URL = window.TACTICDEV_API_URL || '';

// Health indicator
async function ping(){
  try { 
    const url = API_BASE_URL ? `${API_BASE_URL}/healthz` : '/healthz';
    const r = await fetch(url); 
    $status.textContent = r.ok ? '● ready' : '● degraded'; 
    $status.className = r.ok ? 'ok' : 'warn'; 
  }
  catch { $status.textContent = '● offline'; $status.className = 'err'; }
}
ping(); setInterval(ping, 10000);

// Tagging
$tagInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = $tagInput.value.trim();
    if (!val) return;
    const conv = loadConv(currentId);
    if (!conv.tags.includes(val)) conv.tags.push(val);
    saveConv(conv);
    $tagInput.value = '';
    renderEverything();
  }
});

// Color
$colorPicker.addEventListener('input', ()=>{
  const conv = loadConv(currentId);
  conv.color = $colorPicker.value;
  saveConv(conv);
  $colorDot.style.background = conv.color;
  renderEverything();
});

// Per-chat preset
$chatPreset.addEventListener('change', ()=>{
  const conv = loadConv(currentId);
  conv.systemPreset = $chatPreset.value || '';
  if (conv.systemPreset && !$system.value) $system.value = conv.systemPreset;
  saveConv(conv);
});

// Persist system text on blur
$system.addEventListener('blur', ()=>{
  const conv = loadConv(currentId);
  conv.systemText = $system.value.trim();
  saveConv(conv);
});

// Composer behavior
$input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('composer').requestSubmit(); } });
document.getElementById('composer').addEventListener('submit', sendMsg);
$reset.onclick = () => {
  if (!confirm('Clear messages in this chat?')) return;
  const conv = loadConv(currentId);
  conv.messages = [];
  saveConv(conv);
  selectConversation(currentId);
};

function historyForApi(conv){
  return conv.messages.map(m => ({ role: m.role, content: m.content }));
}

function addMessage(convId, msg){
  const c = loadConv(convId);
  c.messages.push(msg);
  saveConv(c);
}

function renderMessages(messages){
  $msgs.innerHTML='';
  messages.forEach(m => addBubble(m.role, m.content, m.time));
  $msgs.scrollTop = $msgs.scrollHeight;
}

async function sendMsg(e){
  e.preventDefault();
  const userText = $input.value.trim();
  if (!userText) return;
  $input.value = '';

  let conv = loadConv(currentId);
  const userMsg = { role:'user', content:userText, time:new Date().toLocaleTimeString() };
  addMessage(conv.id, userMsg);
  renderMessages(loadConv(conv.id).messages);
  const aiWrap = addBubble('assistant', '…');

  conv = loadConv(currentId);
  const systemPrompt = (conv.systemText && conv.systemText.trim()) || conv.systemPreset || undefined;

  const payload = {
    system: systemPrompt,
    model: settings.model,
    temperature: settings.temperature,
    top_p: settings.top_p,
    history: historyForApi(loadConv(conv.id))
  };

  try{
    const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/chat` : '/api/chat';
    const res = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (!res.ok || !res.body) { 
      const errorMsg = (res.status === 405 || res.status === 501)
        ? 'API not configured. Please set window.TACTICDEV_API_URL to your backend server.' 
        : `Error: ${res.status}`;
      aiWrap.querySelector('.text').textContent = errorMsg; 
      return; 
    }
    const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf='', output='';
    while(true){
      const { value, done } = await reader.read(); if(done) break;
      buf += decoder.decode(value, { stream:true });
      for (const line of buf.split('\\n')){
        if(!line.trim()) continue;
        try{
          const obj = JSON.parse(line);
          if (obj.message?.content){
            output += obj.message.content;
            aiWrap.querySelector('.text').textContent = output;
            $msgs.scrollTop = $msgs.scrollHeight;
          }
        }catch{}
      }
      const i = buf.lastIndexOf('\\n'); if (i>=0) buf = buf.slice(i+1);
    }
    const aiMsg = { role:'assistant', content:output, time:new Date().toLocaleTimeString() };
    addMessage(conv.id, aiMsg);
    renderMessages(loadConv(conv.id).messages);
  }catch(err){
    const msg = API_BASE_URL 
      ? 'Connection error. Check if the API server is running.' 
      : 'API not configured. Please set window.TACTICDEV_API_URL to your backend server.';
    aiWrap.querySelector('.text').textContent = msg;
  }
}

// Full re-render
function renderEverything(){
  renderTagFilter();
  renderSidebar();
}

renderEverything();
selectConversation(currentId);
