// 属性和 effect 的关联关系，依赖收集
// 1:1
// 1:n
// n:n ✅

function cleanupEffect(effect) {
    const { deps } = effect;
    // effect.deps = [new Set(), new Set()];
    for(let i = 0; i < deps.length; i++) {
        deps[i].delete(effect); // 删除掉 set 中的 effect
    }
    effect.deps.length = 0; // 让 effect 中的 deps 和属性解除关联
};

export let activeEffect = undefined;
class ReactiveEffect {
    parent = undefined;
    // effect中要记录哪些属性是在 effect 中使用的
    deps = [];
    constructor(public fn) {};

    run() {
        // 当运行的时候 我们需要将属性和对应的effect做一个关联
        // 利用 js 是单线程的特性，先将 activeEffect 放到全局，在取值
        try {
            this.parent = activeEffect;
            activeEffect = this;
            // 先清除掉上一次的 deps 依赖，再重新收集 防止重复收集运行
            cleanupEffect(this);
            // 触发属性的 get(), get中会调用 track 收集依赖, deps添加了effect
            return this.fn();
        } finally {
            activeEffect = this.parent;
        }
    }
}

export function effect(fn) {
    // 将用户的函数，拿到变成一个响应式的函数
    const _effect = new ReactiveEffect(fn);

    // 默认让用户的函数执行一次
    _effect.run();
};

/*
嵌套的 effect 就是一个栈结构，类比于嵌套的组件

// activeEffect = undefined;
effect(() => { // effect1
    // activeEffect = effect1;
    // effect1.parent = undefined;
    // a

    effect(() => { // effect2
        // activeEffect = effect2;
        // effect2.parent = effect1;
        // b

        effect(() => { // effect3
            // activeEffect = effect3;
            // effect3.parent = effect2;
            // c
        });

        // 第一轮 c 循环结束后，activeEffect = effect2;
        // 第二轮 b 循环结束后，activeEffect = effect1;
    });
    // d => effect1
});
*/