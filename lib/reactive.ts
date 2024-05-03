const reactiveSymbol = Symbol('reactive');

type Reactive<T extends Record<PropertyKey, unknown>> = T & { [reactiveSymbol]?: boolean };
type Ref<T> = { value: T } & { [reactiveSymbol]?: boolean };
export type Effect = () => unknown;
let activeEffect: (() => void) | null = null;

export function effect(callback: Effect) {
  activeEffect = callback;
  const value = callback();
  activeEffect = null;
  return value;
}

const targetMap = new WeakMap<object, Map<PropertyKey, Set<Effect>>>();

function track<T extends Record<PropertyKey, any>>(target: T, key: keyof T) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect);
}

function trigger<T extends Record<PropertyKey, any>>(target: T, key: keyof T) {
  const depsMap = targetMap.get(target);
  if (depsMap) {
    const dep = depsMap.get(key);
    if (dep) {
      dep.forEach((effect) => effect());
    }
  }
}
export function reactive<T extends Record<PropertyKey, any>>(obj: T): Reactive<T> {
  return new Proxy(obj, {
    get(target, key) {
      // console.log(`accessing property ${key.toString()} in ${ JSON.stringify(target)}`)
      track(target, key);
      return target[key];
    },
    set(target, key: keyof T, newVal) {
      if (target[key] === newVal) return true;
      // console.log(`setting property ${key.toString()} in ${JSON.stringify(target)} to ${newVal}`)
      target[key] = newVal;
      trigger(target, key);
      return true;
    },
  });
}

export function ref<T>(value: T): Ref<T> {
  return reactive({ value });
}

export function computed<T>(getter: () => T): Readonly<Ref<T>> {
  const result = ref(getter());
  effect(() => (result.value = getter()));
  return result;
}
