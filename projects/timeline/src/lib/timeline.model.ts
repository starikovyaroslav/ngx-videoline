export interface CanvasPos {
  posX: number;
  posY: number;
}

export interface VideoCellStyleType {
  background: string;
}

export interface VideoCellType {
  startTime: number;
  endTime: number;
  style: VideoCellStyleType;
}
