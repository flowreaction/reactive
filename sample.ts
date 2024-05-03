import { computed, ref } from "./lib";

const state = {
  count: 0,
};

// const counterRef = ref(0);

watchEffect(() => {});

watch([], ()=> {})

const computedValue = computed(() => {});

const someRef = ref(0);

const reactiveValue = reactive({ count: 0 });



// const myMoneyComputed = computed(() => counterRef.value * 985);

effect(() => console.log(`${counterRef.value}s: I have ${myMoneyComputed.value} dollars`));



const reactiveSymbol = Symbol('reactive');

type Reactive<T extends Record<PropertyKey, unknown>> = T & { [reactiveSymbol]?: boolean };
type Ref<T> = { value: T } & { [reactiveSymbol]?: boolean };
export type Effect = () => unknown;





const targetMap = new WeakMap<object, Map<PropertyKey, Set<Effect>>>();




let activeEffect: (() => void) | null = null;

export function effect(callback: Effect) {
  activeEffect = callback;
  const value = callback();
  activeEffect = null;
  return value;
}

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


const state = reactive({count: 0})


console.log(state.count);

effect(() => {
  console.log(state.count);
})







const stateProxy = new Proxy(state, {
  get(target, key) {
    track();
    return target[key];
  },
  set(target, key, newVal) {
    trigger();
    target[key] = newVal;
    return true;
  }
})



console.log(stateProxy.count);

effect(() => {
  console.log(stateProxy.count);
});