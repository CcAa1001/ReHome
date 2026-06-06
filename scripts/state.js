
const state = (() => {
    const _state = {
        cart: [],
        user: null,
    };

    const _listeners = {};

    function subscribe(event, callback) {
        if (!_listeners[event]) {
            _listeners[event] = [];
        }
        _listeners[event].push(callback);

        return () => {
            _listeners[event] = _listeners[event].filter(cb => cb !== callback);
        };
    }

    function publish(event, data) {
        if (event === 'cartUpdated') _state.cart = data;
        if (event === 'authChanged') _state.user = data;

        if (_listeners[event]) {
            _listeners[event].forEach(callback => callback(data));
        }
    }

    function getState(key) {
        return _state[key];
    }

    return { subscribe, publish, getState };
})();

export default state;