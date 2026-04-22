type EventCallback = (...args: unknown[]) => void;

class EventBusClass {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, cb: EventCallback): void {
    const list = this.listeners.get(event) ?? [];
    list.push(cb);
    this.listeners.set(event, list);
  }

  off(event: string, cb: EventCallback): void {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter(fn => fn !== cb));
  }

  emit(event: string, ...args: unknown[]): void {
    const list = this.listeners.get(event) ?? [];
    for (const cb of list) cb(...args);
  }
}

export const EventBus = new EventBusClass();

// Typed event names
export const Events = {
  TICK: 'tick',
  BUILDING_PLACED: 'building:placed',
  BUILDING_REMOVED: 'building:removed',
  CONVEYOR_PLACED: 'conveyor:placed',
  CONVEYOR_REMOVED: 'conveyor:removed',
  MODEL_SOLD: 'model:sold',
  ALERT: 'alert',
  SAVE: 'save',
  STATE_CHANGED: 'state:changed',
} as const;
