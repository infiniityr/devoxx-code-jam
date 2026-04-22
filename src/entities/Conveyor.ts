export enum ConveyorDirection {
  Right = 'Right',
  Left = 'Left',
  Up = 'Up',
  Down = 'Down',
}

export interface IConveyorItem {
  resource: string;
  /** progress along conveyor 0→1 */
  progress: number;
}

export interface IConveyor {
  x: number;
  y: number;
  direction: ConveyorDirection;
  /** items currently on this belt */
  items: IConveyorItem[];
  /** saturation 0–1 this tick */
  saturation: number;
  /** mk level 1/2/3 affects speed */
  mk: 1 | 2 | 3;
}

export class Conveyor implements IConveyor {
  x: number;
  y: number;
  direction: ConveyorDirection;
  items: IConveyorItem[] = [];
  saturation: number = 0;
  mk: 1 | 2 | 3;

  constructor(x: number, y: number, direction: ConveyorDirection, mk: 1 | 2 | 3 = 1) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.mk = mk;
  }
}
