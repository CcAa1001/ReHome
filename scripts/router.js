// scripts/router.js
import { supabase } from './supabaseClient.js';
import state from './state.js';

// Tandai rute mana saja yang membutuhkan autentikasi
const routes = {
    '':           { script: 'render/index.js',    auth: false },
    '#products':  { script: 'render/products.js', auth: false },
    '#login':     { script: 'render/login.js',    auth: false },
    '#cart':      { script: 'render/cart.js',     auth: true  },
    '#account':   { script: 'render/account.js',  auth: true  },
    '#listings':  { script: 'render/listings.js', auth: true  },
    '#history':   { script: 'render/history.js',  auth: true  },
    '#settings':  { script: 'render/settings.js', auth: true  },
};

async function loadRoute() {
    let hash = window.location.hash;
    const route = routes[hash] ?? routes[''];

    const mainContent = document.getElementById('main-content');

    // ── ROUTE GUARD ──────────────────────────────────────────────
    if (route.auth) {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Simpan halaman yang ingin dituju agar bisa redirect setelah login
            sessionStorage.setItem('redirectAfterLogin', hash);
            window.location.hash = '#login';
            return; // Hentikan eksekusi, biarkan hashchange menangani sisanya
        }
    }
    // ─────────────────────────────────────────────────────────────

    // Skeleton loader saat menunggu modul dimuat
    mainContent.innerHTML = `
        <div class="skeleton-wrapper">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        </div>
    `;

    try {
        const module = await import(`../scripts/${route.script}`);
        if (module.render) {
            module.render(mainContent);
        }
    } catch (error) {
        console.error('Gagal memuat route:', error);
        mainContent.innerHTML = '<h2>404 - Halaman Tidak Ditemukan</h2>';
    }
}

// Dengarkan perubahan status autentikasi dari Supabase
// dan update Global State secara otomatis
supabase.auth.onAuthStateChange((event, session) => {
    state.publish('authChanged', session?.user ?? null);

    // Jika user baru saja login, redirect ke halaman tujuan semula
    if (event === 'SIGNED_IN') {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.hash = redirect;
        }
    }

    // Jika user logout, paksa kembali ke beranda
    if (event === 'SIGNED_OUT') {
        window.location.hash = '';
    }
});

window.addEventListener('hashchange', loadRoute);
window.addEventListener('load', loadRoute);