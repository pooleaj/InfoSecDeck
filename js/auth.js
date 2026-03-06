/* InfoSecDeck — Supabase Auth (Phase 2 v2) */
var SUPA_URL = 'https://eaynqvgeqdnaswwuwbha.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVheW5xdmdlcWRuYXN3d3V3YmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDA3NTAsImV4cCI6MjA4ODMxNjc1MH0.YSh3xe5VOfQiE3AnyLhk5_11WBEe0jxpvEWzednZLMY';

var _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
var _currentUser = null;

// ─── INIT ────────────────────────────────────────────────────
_sb.auth.getSession().then(function(res) {
  if (res.data && res.data.session) {
    _currentUser = res.data.session.user;
    _syncFromDB();
  }
  _updateAuthUI();
});

_sb.auth.onAuthStateChange(function(event, session) {
  _currentUser = session ? session.user : null;
  _updateAuthUI();
  if (event === 'SIGNED_IN') {
    _syncFromDB();
    showToast('Signed in! \u2705');
  }
});

// ─── JOIN CARD (home page) ───────────────────────────────────
function joinFreeFromCard() {
  var email = ((document.getElementById('hsc-email') || {}).value || '').trim();
  var pass = (document.getElementById('hsc-pass') || {}).value || '';
  var errEl = document.getElementById('hsc-form-error');
  function showErr(msg) { if (errEl) { errEl.style.color = ''; errEl.textContent = msg; } }
  if (!email) { showErr('Please enter your email address.'); return; }
  if (!pass) { showErr('Please create a password.'); return; }
  if (pass.length < 6) { showErr('Password must be at least 6 characters.'); return; }
  var btn = document.querySelector('#hsc-email-form .hsc-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating\u2026'; }
  _sb.auth.signUp({ email: email, password: pass }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Create Account'; }
    if (res.error) { showErr(res.error.message); return; }
    if (errEl) { errEl.style.color = '#00d4c8'; errEl.textContent = 'Account created! Check your email to confirm. \u2705'; }
  });
}

// ─── AUTH MODAL ──────────────────────────────────────────────
function openAuthModal(tab) {
  var m = document.getElementById('auth-modal');
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  _switchAuthTab(tab || 'signin');
  _clearAuthErrors();
  setTimeout(function() {
    var input = document.getElementById('auth-magic-email');
    if (input) input.focus();
  }, 120);
}

function closeAuthModal() {
  var m = document.getElementById('auth-modal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
  _clearAuthErrors();
}

function switchAuthTab(tab) { _switchAuthTab(tab); }

function _switchAuthTab(tab) {
  var si = document.getElementById('auth-signin-panel');
  var su = document.getElementById('auth-signup-panel');
  var ti = document.getElementById('auth-tab-signin');
  var tu = document.getElementById('auth-tab-signup');
  if (si) si.style.display = tab === 'signin' ? 'block' : 'none';
  if (su) su.style.display = tab === 'signup' ? 'block' : 'none';
  if (ti) ti.classList.toggle('active', tab === 'signin');
  if (tu) tu.classList.toggle('active', tab === 'signup');
}

function _clearAuthErrors() {
  var ei = document.getElementById('auth-error-in');
  var eu = document.getElementById('auth-error-up');
  var em = document.getElementById('auth-error-magic');
  if (ei) ei.textContent = '';
  if (eu) eu.textContent = '';
  if (em) { em.textContent = ''; em.style.color = ''; }
}

function _setAuthLoading(loading, panel) {
  var btn = document.getElementById('auth-submit-' + panel);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait\u2026' : (panel === 'up' ? 'Create Account' : 'Sign In');
}

// ─── SIGN IN ─────────────────────────────────────────────────
function doSignIn() {
  var email = ((document.getElementById('auth-email-in') || {}).value || '').trim();
  var pass = (document.getElementById('auth-pass-in') || {}).value || '';
  var errEl = document.getElementById('auth-error-in');
  if (!email || !pass) { if (errEl) errEl.textContent = 'Please fill in all fields.'; return; }
  _setAuthLoading(true, 'in');
  _sb.auth.signInWithPassword({ email: email, password: pass }).then(function(res) {
    _setAuthLoading(false, 'in');
    if (res.error) { if (errEl) errEl.textContent = res.error.message; return; }
    closeAuthModal();
  });
}

// ─── SIGN UP ─────────────────────────────────────────────────
function doSignUp() {
  var email = ((document.getElementById('auth-email-up') || {}).value || '').trim();
  var pass = (document.getElementById('auth-pass-up') || {}).value || '';
  var confirm = (document.getElementById('auth-pass-confirm') || {}).value || '';
  var errEl = document.getElementById('auth-error-up');
  if (!email || !pass) { if (errEl) errEl.textContent = 'Please fill in all fields.'; return; }
  if (pass !== confirm) { if (errEl) errEl.textContent = 'Passwords do not match.'; return; }
  if (pass.length < 6) { if (errEl) errEl.textContent = 'Password must be at least 6 characters.'; return; }
  _setAuthLoading(true, 'up');
  _sb.auth.signUp({ email: email, password: pass }).then(function(res) {
    _setAuthLoading(false, 'up');
    if (res.error) { if (errEl) errEl.textContent = res.error.message; return; }
    closeAuthModal();
    showToast('Account created! Check your email to confirm. \u2705');
  });
}

// ─── SIGN OUT ────────────────────────────────────────────────
function doSignOut() {
  _sb.auth.signOut().then(function() {
    showToast('Signed out.');
    showPage('home');
  });
}

// ─── UI UPDATE ───────────────────────────────────────────────
function _updateAuthUI() {
  _updateNavBtn();
  _updateProfilePage();
  _updateJoinCard();
}

function _updateNavBtn() {
  var btn = document.getElementById('nav-profile-btn');
  if (!btn) return;
  if (_currentUser) {
    var p = loadProfile ? loadProfile() : {};
    var initial = p.username ? p.username[0].toUpperCase() : (_currentUser.email ? _currentUser.email[0].toUpperCase() : '?');
    btn.innerHTML = '<span class="nav-profile-initial">' + initial + '</span>';
    btn.title = _currentUser.email;
  } else {
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
    btn.title = 'Sign In / My Profile';
  }
}

function _updateProfilePage() {
  // Header auth area
  var authArea = document.getElementById('ph-auth-area');
  if (authArea) {
    if (_currentUser) {
      var p = loadProfile ? loadProfile() : {};
      var displayName = p.username || p.name || _currentUser.email.split('@')[0];
      authArea.innerHTML = '<div class="ph-signed-in"><span class="ph-si-dot"></span><span class="ph-si-text">Signed in as <strong>' + _currentUser.email + '</strong></span></div>';
      var nameEl = document.getElementById('ph-name-display');
      var roleEl = document.getElementById('ph-role-display');
      if (nameEl) nameEl.textContent = p.username ? '@' + p.username : (p.name || 'My Account');
      if (roleEl) roleEl.textContent = p.currentRole || (p.targetRole ? 'Targeting: ' + p.targetRole : _currentUser.email);
    } else {
      authArea.innerHTML = '<div class="ph-supabase-note"><div class="ph-note-icon">\uD83D\uDD10</div><div><strong>Sign in to sync your data</strong><p>Your progress saves locally. Sign in to access it across all devices.</p><div class="ph-auth-btns"><button class="pss-btn pss-primary" onclick="openAuthModal(\'signin\')">Sign In</button><button class="pss-btn" onclick="openAuthModal(\'signup\')">Join Free</button></div></div></div>';
    }
  }

  // Show/hide the gated content block
  var gatedContent = document.getElementById('profile-auth-content');
  if (gatedContent) gatedContent.style.display = _currentUser ? 'block' : 'none';

  // Static email display in form
  var emailStatic = document.getElementById('pf-email-static');
  if (emailStatic) emailStatic.textContent = _currentUser ? _currentUser.email : '\u2014';

  // Account section email
  var userEmailEl = document.getElementById('pss-user-email');
  if (userEmailEl && _currentUser) userEmailEl.textContent = _currentUser.email;

  // Salary save button: only show when logged in
  var saveSalBtn = document.getElementById('sc-save-btn');
  if (saveSalBtn) saveSalBtn.style.display = _currentUser ? 'inline-flex' : 'none';
}

function _updateJoinCard() {
  var guestEl = document.getElementById('hsc-guest');
  var memberEl = document.getElementById('hsc-member');
  if (!guestEl || !memberEl) return;

  if (_currentUser) {
    guestEl.style.display = 'none';
    memberEl.style.display = 'flex';
    _renderMemberBanner();
  } else {
    guestEl.style.display = '';
    memberEl.style.display = 'none';
  }
}

function _renderMemberBanner() {
  var p = (typeof loadProfile === 'function') ? loadProfile() : {};

  // Name + avatar initial
  var displayName = p.username ? '@' + p.username : (p.name || (_currentUser.email ? _currentUser.email.split('@')[0] : 'Cyber Pro'));
  var nameEl = document.getElementById('hmv-name');
  if (nameEl) nameEl.textContent = displayName;
  var avatarEl = document.getElementById('hmv-avatar-initial');
  if (avatarEl) avatarEl.textContent = displayName[0].toUpperCase();

  // Role row
  var roleEl = document.getElementById('hmv-role-text');
  if (roleEl) {
    if (p.currentRole && p.targetRole) {
      roleEl.innerHTML = '<strong>' + p.currentRole + '</strong> &rarr; <strong style="color:#00d4c8">' + p.targetRole + '</strong>';
    } else if (p.currentRole) {
      roleEl.innerHTML = 'Currently: <strong>' + p.currentRole + '</strong>';
    } else if (p.targetRole) {
      roleEl.innerHTML = 'Targeting: <strong style="color:#00d4c8">' + p.targetRole + '</strong>';
    } else {
      roleEl.innerHTML = '<span style="color:var(--mt)">Set your role in <strong style="color:var(--tx);cursor:pointer" onclick="showPage(\'profile\')">My Profile</strong></span>';
    }
  }

  // Salary card sub-label
  var salSubEl = document.getElementById('hmv-sal-sub');
  if (salSubEl) {
    if (p.savedSalaryRole) {
      var parts = p.savedSalaryRole.split(' ').slice(0, 3).join(' ');
      salSubEl.textContent = parts;
    } else {
      salSubEl.textContent = 'Salary Guide';
    }
  }

  // Job board card sub-label
  var jobSubEl = document.getElementById('hmv-job-sub');
  if (jobSubEl) {
    if (p.savedJobFilters && p.savedJobFilters.domain) {
      jobSubEl.textContent = p.savedJobFilters.domain;
    } else {
      jobSubEl.textContent = 'Job Search';
    }
  }

  // Career ladder card sub-label
  var ladderSubEl = document.getElementById('hmv-ladder-sub');
  if (ladderSubEl) {
    var cl = p.careerLadder;
    if (cl && cl.steps && cl.steps.length > 2) {
      ladderSubEl.textContent = cl.steps.length + ' milestones';
    } else {
      ladderSubEl.textContent = 'Build your path';
    }
  }

  // Profile card sub-label
  var profSubEl = document.getElementById('hmv-profile-sub');
  if (profSubEl) {
    var certCount = (p.myCerts || []).length;
    profSubEl.textContent = certCount > 0 ? certCount + ' cert' + (certCount !== 1 ? 's' : '') : 'Account';
  }

  // Radar visual label
  var certLabelEl = document.getElementById('hmv-cert-count-label');
  if (certLabelEl) {
    var mc = p.myCerts || [];
    certLabelEl.textContent = mc.length > 0 ? mc.length + ' cert' + (mc.length !== 1 ? 's' : '') + ' earned' : 'No certs added yet';
  }

  // Status text
  var stEl = document.getElementById('hmv-status-txt');
  if (stEl) stEl.textContent = 'Synced \u2014 ' + _currentUser.email;
}

// ─── PATCH showPage to close auth modal ──────────────────────
var _origShowPage = showPage;
showPage = function(p) {
  var m = document.getElementById('auth-modal');
  if (m && m.classList.contains('open')) closeAuthModal();
  _origShowPage(p);
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

// ─── DB SYNC: pull from Supabase → localStorage ──────────────
function _syncFromDB() {
  if (!_currentUser) return;

  // Profile
  _sb.from('profiles').select('*').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    if (res.error) { console.error('[ISD] Profile sync read error:', res.error); return; }
    if (res.data) {
      var d = res.data;
      var existing = {};
      try { existing = JSON.parse(localStorage.getItem('isd_profile') || '{}'); } catch(e) {}
      var dbCerts = [];
      try { dbCerts = JSON.parse(d.my_certs || '[]'); } catch(e) {}
      var dbLadder = {};
      try { dbLadder = JSON.parse(d.career_ladder || '{}'); } catch(e) {}
      var merged = {
        name: d.name || existing.name || '',
        username: d.username || existing.username || '',
        currentRole: d.curr_role || existing.currentRole || '',
        targetRole: d.target_role || existing.targetRole || '',
        exp: d.experience || existing.exp || '',
        location: d.location || existing.location || '',
        bio: d.bio || existing.bio || '',
        savedSalary: d.saved_salary || existing.savedSalary || '',
        savedSalaryNums: existing.savedSalaryNums || [],
        savedSalaryRole: existing.savedSalaryRole || '',
        savedSalaryExp: existing.savedSalaryExp || '',
        savedSalaryLoc: existing.savedSalaryLoc || '',
        myCerts: dbCerts.length ? dbCerts : (existing.myCerts || []),
        careerLadder: (dbLadder && dbLadder.steps) ? dbLadder : (existing.careerLadder || {}),
        savedJobFilters: existing.savedJobFilters || null
      };
      try { localStorage.setItem('isd_profile', JSON.stringify(merged)); } catch(e) {}
      if (typeof initProfile === 'function') initProfile();
      if (typeof renderMyCerts === 'function') renderMyCerts();
      if (typeof initCareerLadder === 'function') initCareerLadder();
      _updateAuthUI();
      _renderMemberBanner();
    }
  });

  // Streak
  _sb.from('challenge_streaks').select('*').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    if (res.error) { console.error('[ISD] Streak sync read error:', res.error); return; }
    if (res.data) {
      var sk = { count: res.data.streak_count || 0, last: res.data.last_date || null, total: res.data.total_answered || 0 };
      try { localStorage.setItem('isd_streak', JSON.stringify(sk)); } catch(e) {}
      if (typeof initNavDCBadge === 'function') initNavDCBadge();
      if (typeof initProfile === 'function') initProfile();
    }
  });

  // Cert progress
  _sb.from('cert_progress').select('cert_key,status').eq('user_id', _currentUser.id).then(function(res) {
    if (res.error) { console.error('[ISD] Cert sync read error:', res.error); return; }
    if (res.data && res.data.length) {
      var cp = {};
      res.data.forEach(function(r) { cp[r.cert_key] = r.status; });
      try { localStorage.setItem('isd_cert_prog', JSON.stringify(cp)); } catch(e) {}
      if (typeof initProfile === 'function') initProfile();
      if (typeof initCertTracker === 'function') initCertTracker();
      _updateJoinCard();
    }
  });
}

// ─── DB SYNC: push to Supabase ───────────────────────────────
function syncProfileToDB(p) {
  if (!_currentUser) return;
  _sb.from('profiles').upsert({
    id: _currentUser.id,
    name: p.name || '',
    username: p.username || '',
    curr_role: p.currentRole || '',
    target_role: p.targetRole || '',
    experience: p.exp || '',
    location: p.location || '',
    bio: p.bio || '',
    saved_salary: p.savedSalary || '',
    my_certs: JSON.stringify(p.myCerts || []),
    career_ladder: JSON.stringify(p.careerLadder || {}),
    updated_at: new Date().toISOString()
  }).then(function(res) {
    if (res.error) console.error('[ISD] Profile sync write error:', res.error);
  });
}

function syncStreakToDB(sk) {
  if (!_currentUser) return;
  _sb.from('challenge_streaks').upsert({
    id: _currentUser.id,
    streak_count: sk.count || 0,
    last_date: sk.last || null,
    total_answered: sk.total || 0,
    updated_at: new Date().toISOString()
  }).then(function(res) {
    if (res.error) console.error('[ISD] Streak sync write error:', res.error);
  });
}

function syncCertProgressToDB(certKey, status) {
  if (!_currentUser) return;
  if (!status) {
    _sb.from('cert_progress').delete().eq('user_id', _currentUser.id).eq('cert_key', certKey)
      .then(function(res) { if (res.error) console.error('[ISD] Cert delete error:', res.error); });
  } else {
    _sb.from('cert_progress').upsert({
      user_id: _currentUser.id,
      cert_key: certKey,
      status: status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,cert_key' })
      .then(function(res) { if (res.error) console.error('[ISD] Cert upsert error:', res.error); });
  }
}

// ══════════════════════ v15 AUTH UPDATES ══════════════════════

// ─── ADMIN ROLE CHECK ────────────────────────────────────────
var _currentUserRole = 'user'; // 'user' or 'admin'

function _checkAdminRole() {
  if (!_currentUser) { _currentUserRole = 'user'; _applyAdminUI(); return; }
  _sb.from('profiles').select('role').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    _currentUserRole = (res.data && res.data.role === 'admin') ? 'admin' : 'user';
    _applyAdminUI();
  });
}

function _applyAdminUI() {
  var adminEls = document.querySelectorAll('.admin-only');
  adminEls.forEach(function(el) {
    el.style.display = _currentUserRole === 'admin' ? '' : 'none';
  });
}

function isAdmin() { return _currentUserRole === 'admin'; }

// ─── ANIMATED ROLE ILLUSTRATIONS ─────────────────────────────
// Domain → SVG animation mapping. Same stick-figure style, different scenes.
var _roleAnims = {
  iam: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.ra-head{animation:ra-bob 2s ease-in-out infinite}.ra-arm{animation:ra-arm 1.8s ease-in-out infinite}.ra-btn-y{animation:ra-btny 2.4s ease-in-out infinite}.ra-btn-n{animation:ra-btnn 2.4s 1.2s ease-in-out infinite}'
    + '@keyframes ra-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}'
    + '@keyframes ra-arm{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-15deg)}}'
    + '@keyframes ra-btny{0%,60%,100%{opacity:.4}70%,90%{opacity:1;filter:drop-shadow(0 0 3px #10e87e)}}'
    + '@keyframes ra-btnn{0%,60%,100%{opacity:.4}70%,90%{opacity:1;filter:drop-shadow(0 0 3px #f05d78)}}'
    + '</style>'
    + '<rect x="60" y="20" width="44" height="36" rx="4" fill="none" stroke="rgba(77,158,255,.3)" stroke-width="1"/>'
    + '<rect x="65" y="25" width="34" height="20" rx="2" fill="rgba(13,212,200,.06)" stroke="rgba(13,212,200,.2)" stroke-width=".8"/>'
    + '<text x="82" y="37" font-size="5" fill="#7a90a8" text-anchor="middle" font-family="monospace">ACCESS?</text>'
    + '<rect class="ra-btn-y" x="66" y="48" width="13" height="5" rx="2" fill="#10e87e" opacity=".5"/>'
    + '<text x="72.5" y="52" font-size="3.5" fill="#fff" text-anchor="middle" font-family="monospace">GRANT</text>'
    + '<rect class="ra-btn-n" x="82" y="48" width="13" height="5" rx="2" fill="#f05d78" opacity=".5"/>'
    + '<text x="88.5" y="52" font-size="3.5" fill="#fff" text-anchor="middle" font-family="monospace">DENY</text>'
    // person
    + '<g transform="translate(40,36)">'
    + '<circle class="ra-head" cx="0" cy="-22" r="5" fill="none" stroke="#4d9eff" stroke-width="1.4"/>'
    + '<line x1="0" y1="-17" x2="0" y2="-5" stroke="#4d9eff" stroke-width="1.4"/>'
    + '<g class="ra-arm"><line x1="0" y1="-14" x2="10" y2="-8" stroke="#4d9eff" stroke-width="1.4"/></g>'
    + '<line x1="0" y1="-14" x2="-8" y2="-9" stroke="#4d9eff" stroke-width="1.4"/>'
    + '<line x1="0" y1="-5" x2="-5" y2="5" stroke="#4d9eff" stroke-width="1.4"/>'
    + '<line x1="0" y1="-5" x2="5" y2="5" stroke="#4d9eff" stroke-width="1.4"/>'
    + '</g>'
    + '</svg>',

  soc: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.sa-alert{animation:sa-flash 1.6s ease-in-out infinite}.sa-alert2{animation:sa-flash 1.6s .5s ease-in-out infinite}.sa-alert3{animation:sa-flash 1.6s .9s ease-in-out infinite}.sa-head{animation:ra-bob 2.2s ease-in-out infinite}'
    + '@keyframes sa-flash{0%,100%{opacity:.2}50%{opacity:1}}'
    + '@keyframes ra-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}'
    + '</style>'
    // 3 monitors
    + '<rect x="12" y="18" width="28" height="18" rx="2" fill="rgba(77,158,255,.06)" stroke="rgba(77,158,255,.25)" stroke-width=".8"/>'
    + '<rect class="sa-alert" x="15" y="22" width="22" height="2" rx="1" fill="#f05d78"/>'
    + '<rect x="15" y="26" width="16" height="1.5" rx=".75" fill="rgba(255,255,255,.12)"/>'
    + '<rect x="15" y="29" width="20" height="1.5" rx=".75" fill="rgba(255,255,255,.08)"/>'
    + '<rect x="46" y="16" width="28" height="20" rx="2" fill="rgba(13,212,200,.06)" stroke="rgba(13,212,200,.25)" stroke-width=".8"/>'
    + '<rect class="sa-alert2" x="49" y="20" width="22" height="2" rx="1" fill="#f5c842"/>'
    + '<rect x="49" y="24" width="18" height="1.5" rx=".75" fill="rgba(255,255,255,.12)"/>'
    + '<rect x="49" y="27" width="22" height="1.5" rx=".75" fill="rgba(255,255,255,.08)"/>'
    + '<rect x="80" y="18" width="28" height="18" rx="2" fill="rgba(16,232,126,.06)" stroke="rgba(16,232,126,.25)" stroke-width=".8"/>'
    + '<rect class="sa-alert3" x="83" y="22" width="22" height="2" rx="1" fill="#10e87e"/>'
    + '<rect x="83" y="26" width="16" height="1.5" rx=".75" fill="rgba(255,255,255,.12)"/>'
    // person at desk
    + '<g transform="translate(60,52)">'
    + '<circle class="sa-head" cx="0" cy="-16" r="4.5" fill="none" stroke="#00d4c8" stroke-width="1.3"/>'
    + '<line x1="0" y1="-12" x2="0" y2="-3" stroke="#00d4c8" stroke-width="1.3"/>'
    + '<line x1="0" y1="-10" x2="-9" y2="-6" stroke="#00d4c8" stroke-width="1.3"/>'
    + '<line x1="0" y1="-10" x2="9" y2="-6" stroke="#00d4c8" stroke-width="1.3"/>'
    + '<line x1="0" y1="-3" x2="-4" y2="5" stroke="#00d4c8" stroke-width="1.3"/>'
    + '<line x1="0" y1="-3" x2="4" y2="5" stroke="#00d4c8" stroke-width="1.3"/>'
    + '</g>'
    + '<rect x="20" y="56" width="80" height="2" rx="1" fill="rgba(255,255,255,.08)"/>'
    + '</svg>',

  red: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.rd-cursor{animation:rd-blink 1.1s step-end infinite}.rd-line{animation:rd-type 2s linear infinite}.rd-head{animation:ra-bob 1.8s ease-in-out infinite}'
    + '@keyframes rd-blink{0%,100%{opacity:1}50%{opacity:0}}'
    + '@keyframes rd-type{0%{width:0}80%{width:50px}100%{width:50px}}'
    + '@keyframes ra-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}'
    + '</style>'
    // terminal window
    + '<rect x="28" y="14" width="64" height="40" rx="4" fill="#080c18" stroke="rgba(244,63,94,.3)" stroke-width="1"/>'
    + '<rect x="28" y="14" width="64" height="7" rx="4" fill="rgba(244,63,94,.12)"/>'
    + '<circle cx="34" cy="17.5" r="1.8" fill="#f05d78" opacity=".6"/>'
    + '<circle cx="40" cy="17.5" r="1.8" fill="#f5c842" opacity=".6"/>'
    + '<circle cx="46" cy="17.5" r="1.8" fill="#10e87e" opacity=".6"/>'
    + '<text x="33" y="31" font-size="4.5" fill="#10e87e" font-family="monospace">$ nmap -sV target</text>'
    + '<text x="33" y="38" font-size="4.5" fill="#f05d78" font-family="monospace">PORT OPEN: 22,80</text>'
    + '<text x="33" y="45" font-size="4.5" fill="#10e87e" font-family="monospace">$ exploit --CVE</text>'
    + '<rect class="rd-cursor" x="33" y="47" width="3" height="5" fill="#10e87e"/>'
    // person
    + '<g transform="translate(14,42)">'
    + '<circle class="rd-head" cx="0" cy="-16" r="4.5" fill="none" stroke="#f05d78" stroke-width="1.3"/>'
    + '<line x1="0" y1="-12" x2="0" y2="-2" stroke="#f05d78" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="8" y2="-5" stroke="#f05d78" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="-7" y2="-5" stroke="#f05d78" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="-4" y2="6" stroke="#f05d78" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="4" y2="6" stroke="#f05d78" stroke-width="1.3"/>'
    + '</g>'
    + '</svg>',

  grc: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.gc-check{animation:gc-appear .8s 1s ease-out both;transform-origin:center}.gc-check2{animation:gc-appear .8s 1.6s ease-out both;transform-origin:center}.gc-check3{animation:gc-appear .8s 2.2s ease-out both;transform-origin:center}'
    + '@keyframes gc-appear{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}'
    + '</style>'
    // clipboard/document
    + '<rect x="42" y="10" width="36" height="46" rx="3" fill="rgba(0,212,200,.04)" stroke="rgba(0,212,200,.25)" stroke-width="1"/>'
    + '<rect x="50" y="8" width="20" height="5" rx="2" fill="rgba(0,212,200,.2)" stroke="rgba(0,212,200,.3)" stroke-width=".8"/>'
    + '<line x1="48" y1="22" x2="72" y2="22" stroke="rgba(255,255,255,.15)" stroke-width=".8"/>'
    + '<line x1="48" y1="28" x2="72" y2="28" stroke="rgba(255,255,255,.15)" stroke-width=".8"/>'
    + '<line x1="48" y1="34" x2="72" y2="34" stroke="rgba(255,255,255,.15)" stroke-width=".8"/>'
    + '<line x1="48" y1="40" x2="72" y2="40" stroke="rgba(255,255,255,.15)" stroke-width=".8"/>'
    + '<text class="gc-check" x="46" y="25" font-size="6" fill="#10e87e">&#x2714;</text>'
    + '<text class="gc-check2" x="46" y="31" font-size="6" fill="#10e87e">&#x2714;</text>'
    + '<text class="gc-check3" x="46" y="37" font-size="6" fill="#f5c842">&#x2714;</text>'
    // person
    + '<g transform="translate(22,44)">'
    + '<circle cx="0" cy="-16" r="4.5" fill="none" stroke="#00e07a" stroke-width="1.3"/>'
    + '<line x1="0" y1="-12" x2="0" y2="-2" stroke="#00e07a" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="12" y2="-6" stroke="#00e07a" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="-6" y2="-4" stroke="#00e07a" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="-4" y2="6" stroke="#00e07a" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="4" y2="6" stroke="#00e07a" stroke-width="1.3"/>'
    + '</g>'
    + '</svg>',

  cloud: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.cl-node-a{animation:cl-float 2s ease-in-out infinite}.cl-node-b{animation:cl-float 2s .4s ease-in-out infinite}.cl-node-c{animation:cl-float 2s .8s ease-in-out infinite}.cl-line{animation:cl-pulse 2s ease-in-out infinite}'
    + '@keyframes cl-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}'
    + '@keyframes cl-pulse{0%,100%{opacity:.3}50%{opacity:.8}}'
    + '</style>'
    // cloud nodes
    + '<g class="cl-node-a"><rect x="50" y="10" width="20" height="12" rx="3" fill="rgba(34,211,238,.1)" stroke="rgba(34,211,238,.4)" stroke-width="1"/><text x="60" y="20" font-size="5" fill="#22d3ee" text-anchor="middle" font-family="monospace">AWS</text></g>'
    + '<g class="cl-node-b"><rect x="18" y="36" width="20" height="12" rx="3" fill="rgba(77,158,255,.1)" stroke="rgba(77,158,255,.4)" stroke-width="1"/><text x="28" y="46" font-size="4.5" fill="#4d9eff" text-anchor="middle" font-family="monospace">IAM</text></g>'
    + '<g class="cl-node-c"><rect x="82" y="36" width="20" height="12" rx="3" fill="rgba(192,132,252,.1)" stroke="rgba(192,132,252,.4)" stroke-width="1"/><text x="92" y="46" font-size="4" fill="#c084fc" text-anchor="middle" font-family="monospace">K8s</text></g>'
    + '<line class="cl-line" x1="60" y1="22" x2="28" y2="36" stroke="#22d3ee" stroke-width=".8" stroke-dasharray="3,2"/>'
    + '<line class="cl-line" x1="60" y1="22" x2="92" y2="36" stroke="#22d3ee" stroke-width=".8" stroke-dasharray="3,2"/>'
    // person
    + '<g transform="translate(60,62)">'
    + '<circle cx="0" cy="-16" r="4.5" fill="none" stroke="#22d3ee" stroke-width="1.3"/>'
    + '<line x1="0" y1="-12" x2="0" y2="-2" stroke="#22d3ee" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="-8" y2="-5" stroke="#22d3ee" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="8" y2="-5" stroke="#22d3ee" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="-4" y2="6" stroke="#22d3ee" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="4" y2="6" stroke="#22d3ee" stroke-width="1.3"/>'
    + '</g>'
    + '</svg>',

  default: '<svg class="hmv-anim-svg" viewBox="0 0 120 72" xmlns="http://www.w3.org/2000/svg">'
    + '<style>.df-shield{animation:df-pulse 2s ease-in-out infinite}.df-head{animation:ra-bob 2s ease-in-out infinite}'
    + '@keyframes df-pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}'
    + '@keyframes ra-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}'
    + '</style>'
    + '<g class="df-shield" transform="translate(60,32)">'
    + '<path d="M0,-22 L18,-14 L18,0 C18,12 0,20 0,20 C0,20 -18,12 -18,0 L-18,-14 Z" fill="rgba(77,158,255,.08)" stroke="rgba(77,158,255,.4)" stroke-width="1.2"/>'
    + '<path d="M-6,-2 L-2,4 L8,-6" fill="none" stroke="#4d9eff" stroke-width="2" stroke-linecap="round"/>'
    + '</g>'
    + '<g transform="translate(60,58)">'
    + '<circle class="df-head" cx="0" cy="-16" r="4.5" fill="none" stroke="#4d9eff" stroke-width="1.3"/>'
    + '<line x1="0" y1="-12" x2="0" y2="-2" stroke="#4d9eff" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="-8" y2="-5" stroke="#4d9eff" stroke-width="1.3"/>'
    + '<line x1="0" y1="-9" x2="8" y2="-5" stroke="#4d9eff" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="-4" y2="6" stroke="#4d9eff" stroke-width="1.3"/>'
    + '<line x1="0" y1="-2" x2="4" y2="6" stroke="#4d9eff" stroke-width="1.3"/>'
    + '</g>'
    + '</svg>'
};
_roleAnims.forensics = _roleAnims.soc; // similar monitor scene
_roleAnims.eng = _roleAnims.default;
_roleAnims.appsec = _roleAnims.red; // terminal scene
_roleAnims.ciso = _roleAnims.grc; // document scene

// ══════════════════════ v16 AUTH UPDATES ══════════════════════
// Google OAuth + Magic Link (passwordless) sign-in

function doGoogleSignIn() {
  var errEl = document.getElementById('auth-error-magic');
  if (errEl) errEl.textContent = '';
  var btn = document.querySelector('.auth-google-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  _sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  }).then(function(res) {
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    if (res.error) {
      if (errEl) errEl.textContent = res.error.message;
    }
    // On success, Supabase redirects the browser — no further action needed here
  });
}

function doMagicLink() {
  var email = ((document.getElementById('auth-magic-email') || {}).value || '').trim();
  var errEl = document.getElementById('auth-error-magic');
  if (!email) {
    if (errEl) errEl.textContent = 'Please enter your email address.';
    return;
  }
  var btn = document.getElementById('auth-submit-magic');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
  _sb.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname }
  }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Send Magic Link \u2192'; }
    if (res.error) {
      if (errEl) errEl.textContent = res.error.message;
      return;
    }
    if (errEl) {
      errEl.style.color = '#00d4c8';
      errEl.textContent = 'Check your email \u2014 magic link sent! \u2705';
    }
  });
}

function _getDomainFromRole(role) {
  if (!role) return 'default';
  var r = role.toLowerCase();
  if (r.indexOf('iam') !== -1 || r.indexOf('identity') !== -1 || r.indexOf('access') !== -1) return 'iam';
  if (r.indexOf('soc') !== -1 || r.indexOf('analyst') !== -1 || r.indexOf('incident') !== -1 || r.indexOf('detection') !== -1) return 'soc';
  if (r.indexOf('pentest') !== -1 || r.indexOf('red team') !== -1 || r.indexOf('penetrat') !== -1 || r.indexOf('offensive') !== -1) return 'red';
  if (r.indexOf('grc') !== -1 || r.indexOf('compliance') !== -1 || r.indexOf('governance') !== -1 || r.indexOf('audit') !== -1 || r.indexOf('risk') !== -1) return 'grc';
  if (r.indexOf('cloud') !== -1) return 'cloud';
  if (r.indexOf('appsec') !== -1 || r.indexOf('devsec') !== -1 || r.indexOf('software') !== -1) return 'appsec';
  if (r.indexOf('forensic') !== -1 || r.indexOf('threat intel') !== -1 || r.indexOf('malware') !== -1) return 'forensics';
  return 'default';
}

// Override _renderMemberBanner to add certs and animation
var _origRenderMemberBanner = _renderMemberBanner;
_renderMemberBanner = function() {
  _origRenderMemberBanner();
  var p = (typeof loadProfile === 'function') ? loadProfile() : {};

  // Animated role illustration
  var animEl = document.getElementById('hmv-role-anim');
  if (animEl) {
    var domain = _getDomainFromRole(p.currentRole || p.targetRole || '');
    animEl.innerHTML = _roleAnims[domain] || _roleAnims.default;
    animEl.style.display = 'block';
  }

  // Certs row
  var certsRow = document.getElementById('hmv-certs-row');
  var certsList = document.getElementById('hmv-certs-list');
  var myCerts = p.myCerts || [];
  if (certsRow && certsList) {
    if (myCerts.length > 0) {
      certsList.innerHTML = myCerts.slice(0, 5).map(function(c) {
        return '<span class="hmv-cert-badge">' + c + '</span>';
      }).join('') + (myCerts.length > 5 ? '<span class="hmv-cert-more">+' + (myCerts.length - 5) + '</span>' : '');
      certsRow.style.display = 'block';
    } else {
      certsRow.style.display = 'none';
    }
  }

  // Check admin role
  _checkAdminRole();
};
