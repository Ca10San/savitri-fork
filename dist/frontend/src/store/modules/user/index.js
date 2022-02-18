"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = exports.initialItemState = exports.initialState = void 0;
const module_1 = require("frontend/store/module");
/**
 * @exports @const
 * Initial state.
 */
exports.initialState = {
    current: {
        email: '',
        password: '',
        token: '',
        level: [],
    }
};
/**
 * @exports @const
 * Initial item state.
 */
exports.initialItemState = {
    email: '',
    password: ''
};
/**
 * @exports @class
 * User module.
 */
class UserModule extends module_1.Module {
    constructor() {
        super('user', exports.initialState, exports.initialItemState);
    }
    actions() {
        return {
            authenticate: ({ commit, dispatch, state: { current } }) => new Promise((resolve) => {
                const payload = {
                    email: current.email,
                    password: current.password,
                };
                dispatch('swapLoading', true);
                this.http.post({ commit, dispatch }, this.route('authenticate'), payload)
                    .then(async ({ data: { result } }) => {
                    commit('USER_AUTH', result);
                    commit('ITEM_CLEAR');
                    await dispatch('meta/describeAll', {}, { root: true });
                    window.dispatchEvent(new CustomEvent('__storeCreated'));
                    resolve();
                })
                    .finally(() => dispatch('swapLoading', false));
            }),
            signout: ({ commit }) => new Promise((resolve) => {
                commit('USER_SIGNOUT');
                resolve();
            })
        };
    }
    getters() {
        return {
            token: (state) => state.current.token,
            current: (state) => state.current,
        };
    }
    mutations() {
        return {
            USER_AUTH(state, value) {
                Object.assign(state.current, {
                    ...value,
                    password: ''
                });
                sessionStorage.setItem('auth:token', value.token);
            },
            USER_SIGNOUT(state) {
                state.current = {};
                sessionStorage.removeItem('auth:token');
            }
        };
    }
}
exports.UserModule = UserModule;
//# sourceMappingURL=index.js.map