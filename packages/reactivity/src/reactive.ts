import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from './baseHandler';

export function reactive(target) {
    return createReactiveObject(target);
};

const _weakMap = new WeakMap(); // 防止内存泄漏

// 创建响应式对象的核心逻辑
function createReactiveObject(target) {
    if (!isObject(target)) {
        return target;
    }

    /*
      第一次进来的时候此时的target是一个普通对象, 所以不会走到 Proxy 的 get 方法中
      在第二次进来的时候，此时的target已经是一个代理对象了，所以会走到 Proxy 的 get 方法中，匹配到了 ReactiveFlags.IS_REACTIVE，所以会返回 true
    */
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }

    // 防止同一个对象被代理两次，返回的永远是同一个代理对象
    const exitstingProxy = _weakMap.get(target);

    if (exitstingProxy) {
        return exitstingProxy;
    }
    // 返回的是代理对象
    const proxy = new Proxy(target, mutableHandlers);
    _weakMap.set(target, proxy);
    return proxy;
}

// hack: 缓存结果 - WeakMap
// hack：增加自定义属性缓存结果