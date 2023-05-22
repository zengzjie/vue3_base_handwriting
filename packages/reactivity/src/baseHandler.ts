import { activeEffect } from "./effect";

// 增加标识，用于判断是否是响应式对象
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers = {
    // 这里使用 Reflect 去做取值和设值，是因为 Reflect 可以保留原有的行为，保证this指向是代理的对象
    // 原始对象 属性 代理对象
    get(target, key, recevier) {
        // 第一次代理过后，会在原始对象上增加一个 __v_isReactive 属性，值为 true
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        track(target, key);
        const res = Reflect.get(target, key, recevier);
        return res;
    },
    // 原始对象 属性 值 代理对象
    set(target, key, value, recevier) {
        const oldValue = target[key];
        const res = Reflect.set(target, key, value, recevier);
        if(value !== oldValue) {
            trigger(target, key, value, oldValue);
        };
        return res;
    }
};

// Map1 = {{name: 'zzj', age: 23}: name};
// Map2 = {name: new Set(effect1, effect2)};

// {name: 'zzj', age: 23} -> name -> [effect1, effect2];

// 用于存储属性和effect的关系
const targetMap = new WeakMap();
const track = (target, key) => {
    if(activeEffect) {
        // 当前这个属性是在 effect 中使用的才收集，否则不收集
        let depsMap = targetMap.get(target);
        if(!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }

        let dep = depsMap.get(key);
        if(!dep) {
            depsMap.set(key, (dep = new Set()));
        }

        const shouldTrack = !dep.has(activeEffect);

        if(shouldTrack) {
            // 属性关联的 effect
            dep.add(activeEffect);
            // effect 关联的属性
            activeEffect.deps.push(dep);
        }
    }
};

// {name: 'zzj', age: 23} -> name -> [effect1, effect2];
const trigger = (target, key, value, oldValue) => {
    // 找到属性对应的 effect，让它重新执行
    const depsMap = targetMap.get(target);
    if(!depsMap) {
        return;
    }

    let effects = depsMap.get(key);

    if(effects) {
        // 需要相深拷贝一份，因为在执行 run() 的时候，会对 deps 进行删除操作
        const _effects = [...effects];
        _effects.forEach(_effect => {
            // 判断当前的 effect 和 activeEffect 相等，如果相等，就不执行
            if(_effect !== activeEffect) {
                // 里面有删除+新增的逻辑
                _effect.run();
            }
        });
    }
};