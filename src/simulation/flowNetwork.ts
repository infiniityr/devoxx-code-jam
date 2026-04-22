import { GameState } from './GameState';
import { Building, BuildingType, ResourceType } from '../entities/Building';
import { Conveyor, ConveyorDirection } from '../entities/Conveyor';

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

/**
 * Process one tick of resource flow.
 * Buildings produce into their output buffers;
 * Conveyors move items between buffers.
 */
export function updateFlowNetwork(
  state: GameState,
  bufferCapacity: number = BUFFER_MAX
): void {
  const { buildings, conveyors } = state;
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

  // Step 3: Conveyors move items to downstream building input buffers
  for (const conv of conveyors) {
    const fromBuilding = buildingAtCell(buildings, conv.x, conv.y);

    const next = nextCell(conv);
    const toBuilding = buildingAtCell(buildings, next.x, next.y);
    const toConveyor = conveyorAt(conveyors, next.x, next.y);

    if (!fromBuilding) continue;

    const fromBuf = getBuffer(state, fromBuilding.id);

    // Transfer one item per tick (or 2 for Mk3)
    const itemsToMove = conv.mk === 3 ? 2 : 1;

    let moved = 0;

    if (toBuilding) {
      const toBuf = getBuffer(state, toBuilding.id);
      // Move whatever is in the from-buffer that matches a downstream input port
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
    } else if (toConveyor) {
      // pass-through: move from this conveyor's building to next conveyor's "virtual buffer"
      const nextBuilding = buildingAtCell(buildings, toConveyor.x, toConveyor.y);
      if (nextBuilding) {
        const toBuf = getBuffer(state, nextBuilding.id);
        for (const resource of fromBuf.keys()) {
          const available = bufferGet(fromBuf, resource as ResourceType);
          if (available > 0) {
            const actual = Math.min(available, itemsToMove);
            const space = cap - bufferGet(toBuf, resource as ResourceType);
            const transferred = Math.min(actual, space);
            if (transferred > 0) {
              bufferConsume(fromBuf, resource as ResourceType, transferred);
              bufferAdd(toBuf, resource as ResourceType, transferred, cap);
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
    void moved; // used for future analytics
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
}

function applyBuildingModifier(building: Building, baseRate: number, state: GameState): number {
  if (building.type === BuildingType.Tokenizer) {
    return baseRate * state.techModifiers.tokenizerSpeed;
  }
  return baseRate;
}
