import { effect } from './reactive';

export function html(strings: TemplateStringsArray, ...expressions: unknown[]) {
  return (element: HTMLElement | null) => {
    if (!element) return;
    effect(() => {
      const eventHandlers: { [key: string]: { handler: Function; selector: string }[] } = {};
      element.innerHTML = generateTemplate(strings, expressions, eventHandlers);
      for (const eventName in eventHandlers) {
        const handlers = eventHandlers[eventName];
        handlers.forEach(({ handler, selector }) => {
          const targetElement = element.querySelector(`[data-rid="${selector}"]`);
          if (targetElement) {
            targetElement.addEventListener(eventName, handler as EventListener);
          }
        });
      }
    });
  };
}

function* uIdGenerator() {
  let count = 0;
  while (true) {
    yield count++;
  }
}

function generateTemplate(
  strings: TemplateStringsArray,
  expressions: unknown[],
  eventHandlers: { [key: string]: { handler: Function; selector: string }[] },
) {
  const getId = uIdGenerator();
  return strings.reduce((acc, string, index) => {
    acc += string;
    const currExpression = expressions[index];
    if (isFunction(currExpression)) {
      const eventNameMatch = Array.from(string.matchAll(/@(\w+)=$/g));
      const lastEventNameMatch = eventNameMatch.pop()
      if (lastEventNameMatch) { // is a eventhandler
        const selector = `${getId.next().value}`;
        const tagMatches = Array.from(acc.matchAll(/<(\w+)/g));
        const lastMatch = tagMatches.pop();
        if (lastMatch) {
          const lastOccurrenceIndex = acc.lastIndexOf(lastMatch[0]);
          if (lastOccurrenceIndex !== -1) {
            const beforeLastOccurrence = acc.slice(0, lastOccurrenceIndex);
            const afterLastOccurrence = acc.slice(lastOccurrenceIndex + lastMatch[0].length);
            acc = beforeLastOccurrence + `${lastMatch[0]} data-rid="${selector}"` + afterLastOccurrence;
          }
        }

        const eventName = lastEventNameMatch[1];
        if (!eventHandlers[eventName]) {
          eventHandlers[eventName] = [];
        }
        eventHandlers[eventName].push({ handler: currExpression, selector: selector });
      } else {
        acc += run(currExpression);
      }
    } else if (typeof currExpression !== 'undefined') {
      acc += run(currExpression);
    }

    return acc;
  }, '');
}

function run(something: unknown) {
  if (isFunction(something)) return something();
  else return something;
}

function isFunction(some: unknown): some is Function {
  return typeof some === 'function';
}
