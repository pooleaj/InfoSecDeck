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
  var emailEl = document.getElementById('hsc-email');
  var email = emailEl ? emailEl.value.trim() : '';
  openAuthModal('signup');
  if (email) {
    setTimeout(function() {
      var input = document.getElementById('auth-email-up');
      if (input) input.value = email;
    }, 150);
  }
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
    var inputId = (tab === 'signup') ? 'auth-email-up' : 'auth-email-in';
    var input = document.getElementById(inputId);
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
  if (ei) ei.textContent = '';
  if (eu) eu.textContent = '';
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
  // Hide join card when already logged in
  var card = document.querySelector('.hero-signup-card');
  if (!card) return;
  if (_currentUser) {
    card.style.display = 'none';
  } else {
    card.style.display = '';
  }
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
      var merged = {
        name: d.name || existing.name || '',
        username: d.username || existing.username || '',
        currentRole: d.curr_role || existing.currentRole || '',
        targetRole: d.target_role || existing.targetRole || '',
        exp: d.experience || existing.exp || '',
        location: d.location || existing.location || '',
        bio: d.bio || existing.bio || '',
        savedSalary: d.saved_salary || existing.savedSalary || ''
      };
      try { localStorage.setItem('isd_profile', JSON.stringify(merged)); } catch(e) {}
      if (typeof initProfile === 'function') initProfile();
      _updateAuthUI();
    }
  });

  // Streak
  _sb.from('challenge_streaks').select('*').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    if (res.error) { console.error('[ISD] Streak sync read error:', res.error); return; }
    if (res.data) {
      var sk = { count: res.data.streak_count || 0, last: res.data.last_date || null, total: res.data.total_answered || 0 };
      try { localStorage.setItem('isd_streak', JSON.stringify(sk)); } catch(e) {}
      var floatStreak = document.getElementById('dc-float-streak');
      if (floatStreak && sk.count > 0) floatStreak.textContent = '\uD83D\uDD25' + sk.count;
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
