import { reactive, html, computed, effect } from './lib/index';

const state = reactive({
  count: 0,
});

function reset() {
  state.count = 0;
}

// const double = computed(() => state.count);
// const isEven = computed(() => double.value % 2 === 0);

// effect(()=> console.log(double.value));
// effect(()=> console.log(isEven.value));

const template = html`
  <div>counter: ${() => state.count}</div>
  <button type="button" @click=${reset}>reset</button>
`;

const app = document.getElementById('app');

template(app);

setInterval(() => state.count++, 1000);
