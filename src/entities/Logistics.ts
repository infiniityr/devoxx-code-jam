import { ConveyorDirection } from './Conveyor';

export interface ISplitter {
  id: string;
  x: number;
  y: number;
  /** 2 or 3 output directions (configurable) */
  outputDirections: ConveyorDirection[];
  /** round-robin index for distribution */
  currentOutputIndex: number;
}

export interface IMerger {
  id: string;
  x: number;
  y: number;
  /** exactly 2 input directions */
  inputDirections: [ConveyorDirection, ConveyorDirection];
  outputDirection: ConveyorDirection;
}

export class Splitter implements ISplitter {
  id: string;
  x: number;
  y: number;
  outputDirections: ConveyorDirection[];
  currentOutputIndex: number = 0;

  constructor(id: string, x: number, y: number, outputDirections: ConveyorDirection[]) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.outputDirections = outputDirections;
  }
}

export class Merger implements IMerger {
  id: string;
  x: number;
  y: number;
  inputDirections: [ConveyorDirection, ConveyorDirection];
  outputDirection: ConveyorDirection;

  constructor(
    id: string,
    x: number,
    y: number,
    inputDirections: [ConveyorDirection, ConveyorDirection],
    outputDirection: ConveyorDirection
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.inputDirections = inputDirections;
    this.outputDirection = outputDirection;
  }
}
