/* InfoSecDeck — Supabase Auth (Phase 2) */
var SUPA_URL = 'https://eaynqvgeqdnaswwuwbha.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVheW5xdmdlcWRuYXN3d3V3YmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDA3NTAsImV4cCI6MjA4ODMxNjc1MH0.YSh3xe5VOfQiE3AnyLhk5_11WBEe0jxpvEWzednZLMY';

var _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
var _currentUser = null;

// ─── INIT: restore session on page load ──────────────────────
_sb.auth.getSession().then(function(res) {
  if (res.data && res.data.session) {
    _currentUser = res.data.session.user;
    _syncFromDB();
  }
  _updateAuthUI();
});

// Listen for auth state changes (sign in, sign out, token refresh)
_sb.auth.onAuthStateChange(function(event, session) {
  _currentUser = session ? session.user : null;
  _updateAuthUI();
  if (event === 'SIGNED_IN') {
    _syncFromDB();
    showToast('Signed in! Welcome back. \u2705');
  }
});

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
  _updateProfileAuthSection();
}

function _updateNavBtn() {
  var btn = document.getElementById('nav-profile-btn');
  if (!btn) return;
  if (_currentUser) {
    var initial = _currentUser.email ? _currentUser.email[0].toUpperCase() : '?';
    btn.innerHTML = '<span class="nav-profile-initial">' + initial + '</span>';
    btn.title = _currentUser.email;
  } else {
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
    btn.title = 'My Profile';
  }
}

function _updateProfileAuthSection() {
  // Header card auth area
  var authArea = document.getElementById('ph-auth-area');
  if (authArea) {
    if (_currentUser) {
      authArea.innerHTML = '<div class="ph-signed-in"><span class="ph-si-dot"></span><span class="ph-si-text">Signed in as <strong>' + _currentUser.email + '</strong></span></div>';
    } else {
      authArea.innerHTML = '<div class="ph-supabase-note"><div class="ph-note-icon">\uD83D\uDD10</div><div><strong>Sign in to sync your data</strong><p>Your progress saves locally. Sign in to access it across all devices.</p><div class="ph-auth-btns"><button class="pss-btn pss-primary" onclick="openAuthModal(\'signin\')">Sign In</button><button class="pss-btn" onclick="openAuthModal(\'signup\')">Create Account</button></div></div></div>';
    }
  }
  // Account section buttons
  var signinBtn = document.getElementById('pss-signin-btn');
  var signupBtn = document.getElementById('pss-signup-btn');
  var signoutBtn = document.getElementById('pss-signout-btn');
  var userInfo = document.getElementById('pss-user-info');
  if (_currentUser) {
    if (signinBtn) signinBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (signoutBtn) signoutBtn.style.display = '';
    if (userInfo) {
      userInfo.style.display = '';
      var em = document.getElementById('pss-user-email');
      if (em) em.textContent = _currentUser.email;
    }
  } else {
    if (signinBtn) signinBtn.style.display = '';
    if (signupBtn) signupBtn.style.display = '';
    if (signoutBtn) signoutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
  }
}

// ─── PATCH showPage to close auth modal on navigation ────────
var _origShowPage = showPage;
showPage = function(p) {
  var m = document.getElementById('auth-modal');
  if (m && m.classList.contains('open')) closeAuthModal();
  _origShowPage(p);
};

// Escape key closes modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAuthModal();
});

// ─── DB SYNC: pull from Supabase into localStorage ───────────
function _syncFromDB() {
  if (!_currentUser) return;

  // Profile
  _sb.from('profiles').select('*').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    if (res.data) {
      var d = res.data;
      var local = {
        name: d.name || '',
        email: _currentUser.email || '',
        currentRole: d.current_role || '',
        targetRole: d.target_role || '',
        exp: d.experience || '',
        location: d.location || '',
        bio: d.bio || ''
      };
      try { localStorage.setItem('isd_profile', JSON.stringify(local)); } catch(e) {}
      if (typeof initProfile === 'function') initProfile();
    }
  });

  // Streak
  _sb.from('challenge_streaks').select('*').eq('id', _currentUser.id).maybeSingle().then(function(res) {
    if (res.data) {
      var sk = { count: res.data.streak_count || 0, last: res.data.last_date || null };
      try { localStorage.setItem('isd_streak', JSON.stringify(sk)); } catch(e) {}
      var floatStreak = document.getElementById('dc-float-streak');
      if (floatStreak && sk.count > 0) floatStreak.textContent = '\uD83D\uDD25' + sk.count;
    }
  });

  // Cert progress
  _sb.from('cert_progress').select('cert_key,status').eq('user_id', _currentUser.id).then(function(res) {
    if (res.data && res.data.length) {
      var cp = {};
      res.data.forEach(function(r) { cp[r.cert_key] = r.status; });
      try { localStorage.setItem('isd_cert_prog', JSON.stringify(cp)); } catch(e) {}
    }
  });
}

// ─── DB SYNC: push to Supabase ───────────────────────────────
function syncProfileToDB(p) {
  if (!_currentUser) return;
  _sb.from('profiles').upsert({
    id: _currentUser.id,
    name: p.name || '',
    current_role: p.currentRole || '',
    target_role: p.targetRole || '',
    experience: p.exp || '',
    location: p.location || '',
    bio: p.bio || '',
    updated_at: new Date().toISOString()
  });
}

function syncStreakToDB(sk) {
  if (!_currentUser) return;
  _sb.from('challenge_streaks').upsert({
    id: _currentUser.id,
    streak_count: sk.count || 0,
    last_date: sk.last || null,
    updated_at: new Date().toISOString()
  });
}

function syncCertProgressToDB(certKey, status) {
  if (!_currentUser) return;
  if (!status) {
    _sb.from('cert_progress').delete().eq('user_id', _currentUser.id).eq('cert_key', certKey);
  } else {
    _sb.from('cert_progress').upsert({
      user_id: _currentUser.id,
      cert_key: certKey,
      status: status,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,cert_key' });
  }
}
