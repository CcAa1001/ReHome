// scripts/state.js
// Pola Pub/Sub (Publisher/Subscriber) sederhana untuk ReHome

const state = (() => {
    // Penyimpanan state terpusat
    const _state = {
        cart: [],
        user: null,
    };

    // Daftar subscriber per event
    const _listeners = {};

    /**
     * Berlangganan ke sebuah event.
     * @param {string} event - Nama event, misal: 'cartUpdated', 'authChanged'
     * @param {Function} callback - Fungsi yang dipanggil saat event terjadi
     * @returns {Function} Fungsi unsubscribe untuk membersihkan listener
     */
    function subscribe(event, callback) {
        if (!_listeners[event]) {
            _listeners[event] = [];
        }
        _listeners[event].push(callback);

        // Kembalikan fungsi unsubscribe agar bisa dibersihkan saat komponen di-unmount
        return () => {
            _listeners[event] = _listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Mempublikasikan event dengan data baru, lalu memperbarui state.
     * @param {string} event - Nama event
     * @param {*} data - Data baru yang dikirim ke semua subscriber
     */
    function publish(event, data) {
        // Update state internal jika kuncinya ada
        if (event === 'cartUpdated') _state.cart = data;
        if (event === 'authChanged') _state.user = data;

        // Panggil semua subscriber yang terdaftar
        if (_listeners[event]) {
            _listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Ambil snapshot state saat ini (read-only).
     * @param {string} key - Kunci state, misal: 'cart', 'user'
     */
    function getState(key) {
        return _state[key];
    }

    return { subscribe, publish, getState };
})();

export default state;