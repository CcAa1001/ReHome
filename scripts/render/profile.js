/**
 * scripts/render/profile.js
 *
 * Renderer for the Profile Settings view.
 * Called by router.js after views/profile.html is injected into #router-view.
 *
 * Public API:
 *   renderProfile()  – bootstraps all UI behaviour for this view.
 */

export function renderProfile() {
  /* ── 1. Element references ────────────────────────────────────── */
  const form = {
    fname:    document.getElementById('prof-fname'),
    lname:    document.getElementById('prof-lname'),
    email:    document.getElementById('prof-email'),
    phone:    document.getElementById('prof-phone'),
    location: document.getElementById('prof-loc'),
  };

  const meta = {
    displayName: document.getElementById('display-name'),
    email:       document.getElementById('meta-email'),
    phone:       document.getElementById('meta-phone'),
    location:    document.getElementById('meta-location'),
  };

  const saveBtn      = document.getElementById('btn-save-profile');
  const saveFeedback = document.getElementById('save-feedback');
  const changePhoto  = document.getElementById('btn-change-photo');
  const changePw     = document.getElementById('btn-change-pw');
  const dlData       = document.getElementById('btn-dl-data');
  const impactBar    = document.getElementById('impact-bar');

  /* ── 2. Animate impact bar on mount ──────────────────────────── */
  if (impactBar) {
    const pct = parseInt(impactBar.dataset.pct, 10) || 0;
    // Defer one frame so the CSS transition fires after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        impactBar.style.width = `${pct}%`;
      });
    });
  }

  /* ── 3. Save profile ─────────────────────────────────────────── */
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Basic validation: all required fields filled
      const allFilled = Object.values(form).every(el => el && el.value.trim() !== '');
      if (!allFilled) {
        // Highlight empty fields
        Object.values(form).forEach(el => {
          if (el && el.value.trim() === '') {
            el.style.borderColor = '#e11d48';
            el.addEventListener('input', () => {
              el.style.borderColor = '';
            }, { once: true });
          }
        });
        return;
      }

      // Sync identity card meta panel
      if (meta.displayName) {
        meta.displayName.textContent =
          `${form.fname.value.trim()} ${form.lname.value.trim()}`;
      }
      if (meta.email)    meta.email.textContent    = form.email.value.trim();
      if (meta.phone)    meta.phone.textContent     = form.phone.value.trim();
      if (meta.location) meta.location.textContent  = form.location.value.trim();

      // TODO: Replace the block below with your real API call, e.g.:
      // await api.patch('/users/me', { ...formData });
      _showSaveFeedback();
    });
  }

  /* ── 4. Change photo (file picker) ──────────────────────────── */
  if (changePhoto) {
    changePhoto.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type   = 'file';
      picker.accept = 'image/*';
      picker.addEventListener('change', () => {
        const file = picker.files[0];
        if (!file) return;
        const url   = URL.createObjectURL(file);
        const avatar = document.getElementById('prof-avatar');
        if (avatar) avatar.src = url;
        // TODO: upload `file` to your storage endpoint here
      });
      picker.click();
    });
  }

  /* ── 5. Security actions ─────────────────────────────────────── */
  if (changePw) {
    changePw.addEventListener('click', () => {
      // TODO: Navigate to /change-password or open a modal
      console.info('[ReHome] Navigate → change password');
      if (window.router?.navigate) window.router.navigate('/change-password');
    });
  }

  if (dlData) {
    dlData.addEventListener('click', () => {
      // TODO: Trigger GDPR data export endpoint
      console.info('[ReHome] Data export requested');
    });
  }

  /* ── 6. Toggle – Two-Factor Auth ────────────────────────────── */
  const toggle2fa = document.getElementById('toggle-2fa');
  if (toggle2fa) {
    toggle2fa.addEventListener('change', (e) => {
      console.info('[ReHome] 2FA toggled:', e.target.checked);
      // TODO: PATCH /users/me/security { twoFactor: e.target.checked }
    });
  }

  /* ── 7. Notification toggles ─────────────────────────────────── */
  const notifIds = ['notif-orders', 'notif-price', 'notif-marketing', 'notif-messages'];
  notifIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
      console.info(`[ReHome] Notification "${id}" →`, e.target.checked);
      // TODO: PATCH /users/me/notifications { [id]: e.target.checked }
    });
  });

  /* ── 8. Activity buttons ─────────────────────────────────────── */
  const activityRoutes = {
    'btn-purchase-hist': '/profile/purchases',
    'btn-saved-items':   '/profile/saved',
    'btn-manage-reviews':'/profile/reviews',
  };
  Object.entries(activityRoutes).forEach(([btnId, route]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (window.router?.navigate) {
        window.router.navigate(route);
      } else {
        console.info(`[ReHome] Navigate → ${route}`);
      }
    });
  });

  /* ── Private helpers ──────────────────────────────────────────── */
  function _showSaveFeedback() {
    if (!saveFeedback) return;
    saveFeedback.classList.add('show');
    clearTimeout(saveFeedback._timer);
    saveFeedback._timer = setTimeout(() => {
      saveFeedback.classList.remove('show');
    }, 2800);
  }
}