import { GameState } from './GameState';
import { Building, BuildingType, ResourceType } from '../entities/Building';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';
import { Splitter, Merger } from '../entities/Logistics';

const BUFFER_MAX = 50;

/** Get or create buffer for a building */
function getBuffer(state: GameState, buildingId: string): Map<ResourceType, number> {
  let buf = state.buffers.get(buildingId);
  if (!buf) {
    buf = new Map();
    state.buffers.set(buildingId, buf);
  }
  return buf;
}

function bufferGet(buf: Map<ResourceType, number>, r: ResourceType): number {
  return buf.get(r) ?? 0;
}

function bufferAdd(buf: Map<ResourceType, number>, r: ResourceType, amount: number, capacity: number): number {
  const current = bufferGet(buf, r);
  const space = capacity - current;
  const added = Math.min(amount, space);
  buf.set(r, current + added);
  return added;
}

function bufferConsume(buf: Map<ResourceType, number>, r: ResourceType, amount: number): number {
  const current = bufferGet(buf, r);
  const consumed = Math.min(amount, current);
  buf.set(r, current - consumed);
  return consumed;
}

/** Get cell ahead of a conveyor based on direction */
function nextCell(conv: Conveyor): { x: number; y: number } {
  switch (conv.direction) {
    case ConveyorDirection.Right: return { x: conv.x + 1, y: conv.y };
    case ConveyorDirection.Left:  return { x: conv.x - 1, y: conv.y };
    case ConveyorDirection.Up:    return { x: conv.x, y: conv.y - 1 };
    case ConveyorDirection.Down:  return { x: conv.x, y: conv.y + 1 };
  }
}

/** Find conveyor at position */
function conveyorAt(conveyors: Conveyor[], x: number, y: number): Conveyor | undefined {
  return conveyors.find(c => c.x === x && c.y === y);
}

/** Find building occupying a cell */
function buildingAtCell(buildings: Building[], x: number, y: number): Building | undefined {
  return buildings.find(b =>
    x >= b.x && x < b.x + b.width &&
    y >= b.y && y < b.y + b.height
  );
}

/** Find splitter at exact position */
function splitterAt(splitters: Splitter[], x: number, y: number): Splitter | undefined {
  return splitters.find(s => s.x === x && s.y === y);
}

/** Find merger at exact position */
function mergerAt(mergers: Merger[], x: number, y: number): Merger | undefined {
  return mergers.find(m => m.x === x && m.y === y);
}

/** Get the cell a direction points toward from a given position */
function cellInDirection(x: number, y: number, dir: ConveyorDirection): { x: number; y: number } {
  switch (dir) {
    case ConveyorDirection.Right: return { x: x + 1, y };
    case ConveyorDirection.Left:  return { x: x - 1, y };
    case ConveyorDirection.Up:    return { x, y: y - 1 };
    case ConveyorDirection.Down:  return { x, y: y + 1 };
  }
}

/**
 * Process one tick of resource flow.
 * Buildings produce into their output buffers;
 * Conveyors move items between buffers.
 */
export function updateFlowNetwork(
  state: GameState,
  bufferCapacity: number = BUFFER_MAX
): void {
  const { buildings, conveyors, splitters, mergers } = state;
  const cap = bufferCapacity * state.techModifiers.bufferCapacity;

  // Step 1: Extractors / generators produce directly into their own output buffer
  for (const building of buildings) {
    if (!building.active) continue;

    const buf = getBuffer(state, building.id);

    for (const port of building.outputPorts) {
      const rate = applyBuildingModifier(building, port.ratePerTick, state);
      const added = bufferAdd(buf, port.resource, rate, cap);
      port.actualRate = added;
    }
  }

  // Step 2: Processing buildings consume from input buffer and fill output buffer
  for (const building of buildings) {
    if (!building.active) continue;
    if (building.inputPorts.length === 0) continue;
    if (building.type === BuildingType.ModelIntegrator) continue; // handled in tick.ts

    const inBuf = getBuffer(state, building.id);
    const outBuf = getBuffer(state, building.id);

    // Check if all inputs available
    let canProcess = true;
    for (const port of building.inputPorts) {
      if (bufferGet(inBuf, port.resource) < port.ratePerTick) {
        canProcess = false;
        break;
      }
    }

    if (!canProcess) continue;

    // Consume inputs
    for (const port of building.inputPorts) {
      bufferConsume(inBuf, port.resource, port.ratePerTick);
      port.actualRate = port.ratePerTick;
    }

    // Produce outputs
    for (const port of building.outputPorts) {
      const rate = applyBuildingModifier(building, port.ratePerTick, state);
      const added = bufferAdd(outBuf, port.resource, rate, cap);
      port.actualRate = added;
    }
  }

  // Step 3: Conveyors move items to downstream building/splitter/merger input buffers
  for (const conv of conveyors) {
    const fromBuilding = buildingAtCell(buildings, conv.x, conv.y);
    const fromSplitter = !fromBuilding ? splitterAt(splitters, conv.x, conv.y) : undefined;
    const fromMerger = !fromBuilding && !fromSplitter ? mergerAt(mergers, conv.x, conv.y) : undefined;

    const sourceId = fromBuilding?.id ?? fromSplitter?.id ?? fromMerger?.id;
    if (!sourceId) continue;

    const fromBuf = getBuffer(state, sourceId);
    const itemsToMove = conv.mk === 3 ? 2 : 1;

    const next = nextCell(conv);
    const toBuilding = buildingAtCell(buildings, next.x, next.y);
    const toSplitter = !toBuilding ? splitterAt(splitters, next.x, next.y) : undefined;
    const toMerger = !toBuilding && !toSplitter ? mergerAt(mergers, next.x, next.y) : undefined;
    const toConveyor = !toBuilding && !toSplitter && !toMerger
      ? conveyorAt(conveyors, next.x, next.y)
      : undefined;

    let moved = 0;

    if (toBuilding) {
      const toBuf = getBuffer(state, toBuilding.id);
      for (const port of toBuilding.inputPorts) {
        const available = bufferGet(fromBuf, port.resource);
        if (available > 0) {
          const transferable = Math.min(available, itemsToMove);
          const space = cap - bufferGet(toBuf, port.resource);
          const actual = Math.min(transferable, space);
          if (actual > 0) {
            bufferConsume(fromBuf, port.resource, actual);
            bufferAdd(toBuf, port.resource, actual, cap);
            moved += actual;
          }
        }
      }
    } else if (toSplitter) {
      // Route into the splitter's buffer — accepts any resource
      const toBuf = getBuffer(state, toSplitter.id);
      for (const [res, available] of fromBuf) {
        if (available > 0) {
          const actual = Math.min(available, itemsToMove);
          const transferred = bufferAdd(toBuf, res, actual, cap);
          bufferConsume(fromBuf, res, transferred);
          moved += transferred;
        }
      }
    } else if (toMerger) {
      // Route into the merger's buffer — accepts any resource
      const toBuf = getBuffer(state, toMerger.id);
      for (const [res, available] of fromBuf) {
        if (available > 0) {
          const actual = Math.min(available, itemsToMove);
          const transferred = bufferAdd(toBuf, res, actual, cap);
          bufferConsume(fromBuf, res, transferred);
          moved += transferred;
        }
      }
    } else if (toConveyor) {
      // pass-through to next conveyor's building/splitter/merger
      const nextBuilding = buildingAtCell(buildings, toConveyor.x, toConveyor.y);
      const nextSplitter = !nextBuilding ? splitterAt(splitters, toConveyor.x, toConveyor.y) : undefined;
      const nextMerger = !nextBuilding && !nextSplitter ? mergerAt(mergers, toConveyor.x, toConveyor.y) : undefined;
      const destId = nextBuilding?.id ?? nextSplitter?.id ?? nextMerger?.id;
      if (destId) {
        const toBuf = getBuffer(state, destId);
        for (const [res, available] of fromBuf) {
          if (available > 0) {
            const actual = Math.min(available, itemsToMove);
            const space = cap - bufferGet(toBuf, res);
            const transferred = Math.min(actual, space);
            if (transferred > 0) {
              bufferConsume(fromBuf, res, transferred);
              bufferAdd(toBuf, res, transferred, cap);
              moved += transferred;
            }
          }
        }
      }
    }

    // Saturation: how full is the source buffer?
    let totalInBuf = 0;
    for (const v of fromBuf.values()) totalInBuf += v;
    conv.saturation = Math.min(1, totalInBuf / cap);
    void moved;
  }

  // Step 4: Update token stats for HUD
  let totalTokensProduced = 0;
  for (const building of buildings) {
    if (building.type === BuildingType.Tokenizer && building.active) {
      for (const port of building.outputPorts) {
        if (port.resource === ResourceType.Token) {
          totalTokensProduced += port.actualRate;
        }
      }
    }
  }
  state.tokensPerSecond = totalTokensProduced * state.tps;

  // Step 5: Splitters — round-robin distribute to output conveyors
  for (const splitter of splitters) {
    const buf = getBuffer(state, splitter.id);
    if (splitter.outputDirections.length === 0) continue;

    // Collect all resources present in the buffer
    const resources = [...buf.entries()].filter(([, amt]) => amt > 0);
    if (resources.length === 0) continue;

    // For each item to distribute, pick the next output direction (round-robin)
    for (const [res, available] of resources) {
      let remaining = available;
      let attempts = splitter.outputDirections.length;
      while (remaining > 0 && attempts-- > 0) {
        const dir = splitter.outputDirections[splitter.currentOutputIndex % splitter.outputDirections.length];
        splitter.currentOutputIndex = (splitter.currentOutputIndex + 1) % splitter.outputDirections.length;

        const outCell = cellInDirection(splitter.x, splitter.y, dir);
        const toBuilding = buildingAtCell(buildings, outCell.x, outCell.y);
        const toSplitter = !toBuilding ? splitterAt(splitters, outCell.x, outCell.y) : undefined;
        const toMerger = !toBuilding && !toSplitter ? mergerAt(mergers, outCell.x, outCell.y) : undefined;
        const destId = toBuilding?.id ?? toSplitter?.id ?? toMerger?.id;

        if (!destId) continue;
        const toBuf = getBuffer(state, destId);

        // If destination is a building, only route if it accepts this resource
        if (toBuilding) {
          const acceptsResource = toBuilding.inputPorts.some(p => p.resource === res);
          if (!acceptsResource) continue;
        }

        const space = cap - bufferGet(toBuf, res);
        const transfer = Math.min(1, remaining, space);
        if (transfer > 0) {
          bufferConsume(buf, res, transfer);
          bufferAdd(toBuf, res, transfer, cap);
          remaining -= transfer;
        }
      }
    }
  }

  // Step 6: Mergers — fuse 2 input directions into 1 output (same resource type only)
  for (const merger of mergers) {
    const buf = getBuffer(state, merger.id);

    // Check that all resources in the buffer are of the same type
    const presentTypes = [...buf.entries()].filter(([, amt]) => amt > 0).map(([res]) => res);
    if (presentTypes.length > 1) {
      // Mixed types: drain the buffer to avoid deadlock (discard excess types, keep first)
      const keepType = presentTypes[0];
      for (const res of presentTypes.slice(1)) {
        buf.set(res, 0);
      }
      presentTypes.length = 1;
      presentTypes[0] = keepType;
    }

    if (presentTypes.length === 0) continue;

    const outCell = cellInDirection(merger.x, merger.y, merger.outputDirection);
    const toBuilding = buildingAtCell(buildings, outCell.x, outCell.y);
    const toSplitter = !toBuilding ? splitterAt(splitters, outCell.x, outCell.y) : undefined;
    const toMerger = !toBuilding && !toSplitter ? mergerAt(mergers, outCell.x, outCell.y) : undefined;
    const destId = toBuilding?.id ?? toSplitter?.id ?? toMerger?.id;

    if (!destId) continue;
    const toBuf = getBuffer(state, destId);
    const res = presentTypes[0];
    const available = bufferGet(buf, res);

    if (toBuilding) {
      const acceptsResource = toBuilding.inputPorts.some(p => p.resource === res);
      if (!acceptsResource) continue;
    }

    const space = cap - bufferGet(toBuf, res);
    const transfer = Math.min(available, space, 2); // up to 2 items/tick
    if (transfer > 0) {
      bufferConsume(buf, res, transfer);
      bufferAdd(toBuf, res, transfer, cap);
    }
  }
}

function applyBuildingModifier(building: Building, baseRate: number, state: GameState): number {
  if (building.type === BuildingType.Tokenizer) {
    return baseRate * state.techModifiers.tokenizerSpeed;
  }
  return baseRate;
}
