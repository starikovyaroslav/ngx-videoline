import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import {DateUtil} from './dateUtils';
import {CanvasPos, VideoCellType} from './timeline.model';

@Component({
  selector: 'ngx-timeliner',
  templateUrl: './timeline.component.html',
  styleUrls: ['timeline.component.scss']
})
export class NgxTimelinerComponent implements OnInit, OnChanges {
  @Input() canvasHeight = 50;
  @Input() playTime: number;
  @Input() speed: number;
  @Input() forWardValue: number;
  @Input() startTimeThreshold: number;
  @Input() endTimeThreshold: number;
  @Input() borderColor: string;
  @Input() bgColor: string;
  @Input() bottomLineColor: string;
  @Input() verticalBarColor: string;
  @Input() playBarColor: string;
  @Input() notRecordColor: string;
  @Input() videoCells: VideoCellType[];
  @Input() events: VideoCellType[];
  @Output() readonly playClick: EventEmitter<any>;
  @Output() readonly mouseUp: EventEmitter<any>;
  @Output() readonly mouseDown: EventEmitter<any>;
  @Output() readonly mouseMove: EventEmitter<any>;

  readonly minutesPerStep: Array<number> = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 720, 1440];
  readonly millisInHour = 3600 * 1000;

  scale: number = this.canvasHeight / 4.55;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  canvasW: number;
  canvasH: number;
  timecell: VideoCellType[];
  pxPerMs: number;
  graduationStep: number;
  hoursPerRuler: number;
  startTimestamp: number;
  endTimestamp: number;
  currentTimestamp: number;
  distanceBetweenGtitle: number;
  zoom: number;
  gIsMousedown: boolean;
  gIsMousemove: boolean;
  gIsMouseup: boolean;
  gMousedownCursor: number;
  gMousedownCursorY: number;
  playBarDistanceLeft: number;
  playBarOffsetX: number;
  playBarOffsetX1: number;
  playBarOffsetX2: number;
  playBarOffsetY1: number;
  playBarOffsetY2: number;
  isBarDown: boolean;
  notRecordArea: VideoCellType;

  @ViewChild('timeline', {static: true}) canvasExp: ElementRef<HTMLCanvasElement>;

  constructor() {
    this.forWardValue = 5000;
    this.speed = 1000;
    this.playTime = new Date().getTime();
    this.startTimeThreshold = new Date().getTime() - 12 * this.millisInHour;
    this.endTimeThreshold = new Date().getTime() + 12 * this.millisInHour;
    this.playClick = new EventEmitter<any>();
    this.mouseUp = new EventEmitter<any>();
    this.mouseDown = new EventEmitter<any>();
    this.mouseMove = new EventEmitter<any>();
    this.verticalBarColor = '#333333';
    this.bottomLineColor = 'transparent';
    this.borderColor = '#fff';
    this.bgColor = '#f7f7f7';
    this.playBarColor = '#3ebeff';
    this.notRecordColor = '#d91000';
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(e: MouseEvent): boolean {
    e.preventDefault();
    return false;
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.canvas.width = Math.round(this.canvas.offsetWidth - 2);
    this.canvasW = this.canvas.offsetWidth;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
    this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
    this.init(this.startTimestamp, this.timecell);
    this.drawPlayBar();
  }

  @HostListener('wheel', ['$event'])
  mousewheelFunc(event: WheelEvent): void {
    this.clearCanvas();
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const delta = Math.max(-1, Math.min(1, -event.deltaY));
    if (delta < 0) {
      this.zoom < 1 ? this.zoom += 0.5 : this.zoom += 1;
      if (this.zoom >= 24) {
        this.zoom = 24;
      }
      this.hoursPerRuler = this.zoom;
    } else if (delta > 0) {
      this.zoom < 1 ? this.zoom -= 0.5 : this.zoom -= 1;
      if (this.zoom <= 0.5) {
        this.zoom = 0.5;
      }
      this.hoursPerRuler = this.zoom;
    }
    const middleTime = this.startTimestamp + ((this.canvasW / 2) / this.pxPerMs);
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
    this.startTimestamp = middleTime - ((this.canvasW / 2) / this.pxPerMs);
    this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
    this.init(this.startTimestamp, this.timecell);
    this.drawPlayBar();
  }

  @HostListener('mousedown', ['$event'])
  mousedownFunc(e: MouseEvent): void {
    this.gIsMousedown = true;
    this.gMousedownCursor = this.get_cursor_x_position(e).posX;
    this.gMousedownCursorY = this.get_cursor_x_position(e).posY;
  }

  @HostListener('mousemove', ['$event'])
  mousemoveFunc(e: MouseEvent): void {
    this.clearCanvas();
    const posX = this.get_cursor_x_position(e).posX;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
    const diffX = posX - this.gMousedownCursor;
    if (this.gIsMousedown) {
      (
        posX >= Math.floor(this.playBarOffsetX1) &&
        posX <= Math.floor(this.playBarOffsetX2) &&
        this.gMousedownCursorY >= Math.floor(this.playBarOffsetY1) &&
        this.gMousedownCursorY <= Math.floor(this.playBarOffsetY2) ||
        this.isBarDown
      ) ? this.movePlayBar(posX) : this.moveTimeline(diffX, posX);
      this.init(this.startTimestamp, this.timecell);
      this.drawPlayBar();
      this.gIsMousemove = true;
      this.mouseUp.emit(this.currentTimestamp);
    } else {
      this.moveHintLine(posX);
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseupFunc(e: MouseEvent): void {
    this.gIsMouseup = true;

    if (this.gIsMousemove) {
      this.gIsMousemove = false;
      this.gIsMousedown = false;

      if (!this.isBarDown) {
        return;
      }

      this.isBarDown = false;
      const newPlayTime = this.startTimestamp + Math.round(this.playBarOffsetX / this.pxPerMs);
      this.checkAllowedTime(newPlayTime);
      this.setTime(this.playTime as number);
    } else {
      this.gIsMousedown = false;
      this.playBarOffsetX = this.get_cursor_x_position(e).posX;

      const newPlayTime = this.startTimestamp + Math.round(this.playBarOffsetX / this.pxPerMs);
      this.checkAllowedTime(newPlayTime);
      this.setTime(this.playTime as number);
    }
    this.gIsMouseup = false;
    this.mouseDown.emit(this.playTime);
  }

  @HostListener('mouseout', ['$event'])
  mouseoutFunc(): void {
    this.clearCanvas();
    this.gIsMousemove = false;
    this.gIsMousedown = false;
    this.isBarDown = false;
    this.setTime(this.playTime as number);
  }

  get_cursor_x_position(e: MouseEvent): CanvasPos {
    let posx = 0;
    let posy = 0;
    if (e.offsetX || e.offsetY) {
      posx = e.offsetX;
      posy = e.offsetY;
    }

    return {posX: posx, posY: posy};
  }

  ngOnInit(): void {
    this.prepareCanvas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.canvasHeight) {
      this.canvasHeight = changes.canvasHeight.currentValue;
      this.prepareCanvas();
    }
    if (changes.videoCells) {
      this.videoCells = changes.videoCells.currentValue;
      this.timecell = this.videoCells;
      this.add_cells(this.timecell);
    }
    if (changes.events) {
      this.events = changes.events.currentValue;
      this.add_cells(this.events);
    }
    if (changes.startTimeThreshold) {
      this.updateStartTimeThreshold(changes.startTimeThreshold.currentValue);
    }
    if (changes.endTimeThreshold) {
      this.updateEndTimeThreshold(changes.endTimeThreshold.currentValue);
    }
    if (changes.playTime) {
      this.updatePlayTime(changes.playTime.currentValue);
    }
    if (changes.speed) {
      this.speed = Number(changes.speed.currentValue) * 1000;
    }
    if (changes.forWardValue) {
      this.forWardValue = Number(changes.forWardValue.currentValue) * 1000;
    }
  }

  private init(startTimestamp: number, timecell: VideoCellType[]): void {
    this.endTimestamp = this.startTimestamp + this.canvasW / this.pxPerMs;
    this.timecell = timecell;
    this.startTimestamp = startTimestamp;
    this.notRecordArea = {
      startTime: this.startTimestamp,
      endTime: new Date().getTime() <= this.endTimeThreshold ? timecell[timecell.length - 1].endTime : this.endTimestamp,
      style: {
        background: this.notRecordColor,
      }
    };

    this.add_cells([this.notRecordArea]);
    this.add_cells(timecell);
    this.add_cells(this.events);
    this.drawCellBg();
    this.addGraduations(startTimestamp);
    this.drawLine(
      0,
      this.canvasH,
      this.canvasW,
      this.canvasH,
      this.bottomLineColor,
      1
    );
  }

  private addGraduations(startTimestamp: number): void {
    const pxPerMin = this.canvasW / (this.hoursPerRuler * 60);
    let pxPerStep = this.graduationStep;
    let minPerStep = pxPerStep / pxPerMin;
    let mediumStep = 30;
    for (const step of this.minutesPerStep) {
      if (minPerStep <= step) {
        minPerStep = step;
        pxPerStep = pxPerMin * minPerStep;
        break;
      }
    }

    for (const step of this.minutesPerStep) {
      if (this.distanceBetweenGtitle / pxPerMin <= step) {
        mediumStep = step;
        break;
      }
    }
    this.addGraduationElements(startTimestamp, minPerStep, pxPerStep, mediumStep);
  }

  private drawPlayBar(): void {
    this.ctx.beginPath();
    this.ctx.moveTo(this.playBarOffsetX, 0);
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 2));
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
    this.ctx.moveTo(this.playBarOffsetX, (this.scale * 2));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 2));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * .6), (this.scale * 2.75));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * .6), (this.scale * 3.75));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * .6), (this.scale * 3.75));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * .6), (this.scale * 2.75));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 2));
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.fill();
    this.ctx.closePath();
    const time = Number(this.currentTimestamp);
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      DateUtil.formatDate(new Date(time), 'HH:mm:ss'),
      this.playBarOffsetX,
      (this.scale * 4.55)
    );

    this.updatePlayBarScale();
  }

  private drawLine(
    beginX: number,
    beginY: number,
    endX: number,
    endY: number,
    color: string,
    width: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(beginX, beginY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  private add_cells(cells: VideoCellType[]): void {
    cells.forEach((cell) => {
      this.draw_cell(cell);
    });
  }

  private draw_cell(cell: VideoCellType): void {
    const pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour); // px/ms
    const beginX = (cell.startTime - this.startTimestamp) * pxPerMs;
    const cellWidth = (cell.endTime - cell.startTime) * pxPerMs;
    this.ctx.fillStyle = cell.style.background;
    this.ctx.fillRect(beginX, 0, cellWidth, (this.scale));
  }

  private drawCellBg(): void {
    this.ctx.fillStyle = this.verticalBarColor;
    this.ctx.fillRect(100, 0, this.canvasW, 0);
  }

  private ms_to_next_step(timestamp: number, step: number): number {
    const remainder = timestamp % step;
    return remainder ? step - remainder : 0;
  }

  private setTime(time: number): void {
    if (this.ctx) {
      this.clearCanvas();
      this.currentTimestamp = time;
      this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
      this.init(this.startTimestamp, this.timecell);
      this.drawPlayBar();
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, (this.scale * 7.5));
  }

  private moveHintLine(posX: number): void {
    const time = this.startTimestamp + posX / this.pxPerMs;
    this.init(this.startTimestamp, this.timecell);
    this.drawPlayBar();
    this.drawLine(posX, 0, posX, this.scale * 3, '#808080', 1);

    this.ctx.fillStyle = '#808080';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      DateUtil.formatDate(new Date(time), 'HH:mm:ss'),
      posX,
      (this.scale * 3.75)
    );
  }

  private moveTimeline(diffX: number, posX: number): void {
    this.startTimestamp = this.startTimestamp - Math.round(diffX / this.pxPerMs);
    this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
    this.gMousedownCursor = posX;
  }

  private movePlayBar(posX: number): void {
    this.isBarDown = true;
    this.playBarOffsetX = posX;
    this.currentTimestamp = this.startTimestamp + posX / this.pxPerMs;
    this.mouseMove.emit(this.currentTimestamp);
  }

  private checkAllowedTime(time: number): void {
    const allowedTime = !!this.timecell.find((cell) => (time <= cell.endTime && time >= cell.startTime));

    if (!allowedTime) {
      this.checkForTimeHole(time);
      return;
    }
    this.checkForEvents(time);
  }

  private addGraduationElements(startTimestamp: number, minPerStep: number, pxPerStep: number, mediumStep: number): void {
    const numSteps = this.canvasW / pxPerStep;
    const msPerStep = pxPerStep / this.pxPerMs;
    const msOffset = this.ms_to_next_step(startTimestamp, minPerStep * 60 * 1000);
    const pxOffset = msOffset * this.pxPerMs;
    let graduationLeft: number;
    let graduationTime: number;
    let lineH: number;

    for (let i = 0; i < numSteps; i++) {
      graduationLeft = pxOffset + i * pxPerStep;
      graduationTime = Number(startTimestamp) + Number(msOffset) + i * Number(msPerStep);
      const date = new Date(graduationTime);

      const formattedDate = DateUtil.formatDate(date, 'HH:mm:ss');

      if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
        lineH = (this.scale * 1.75);
        this.addGraduationText(formattedDate, graduationLeft);
      } else if ((graduationTime / (60 * 1000)) % mediumStep === 0) {
        lineH = (this.scale * 1.25);
        this.addGraduationText(formattedDate, graduationLeft);
      } else {
        lineH = (this.scale * 0.75);
      }

      this.drawLine(
        graduationLeft,
        0,
        graduationLeft,
        lineH,
        this.verticalBarColor,
        1
      );
    }
  }

  private prepareCanvas(): void {
    this.canvas = this.canvasExp.nativeElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvas.width = Math.round(this.canvas.offsetWidth - 2);
    this.canvasW = this.canvas.width;
    this.canvas.height = this.canvasHeight;
    this.canvasH = this.canvas.height;
    this.timecell = this.videoCells;
    this.graduationStep = 20;
    this.hoursPerRuler = Math.ceil((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour) < 24 ?
      Number(((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour).toFixed(5)) :
      24;
    this.startTimestamp = Number(this.startTimeThreshold);
    this.distanceBetweenGtitle = 80;
    this.zoom = 24;
    this.gIsMousedown = false;
    this.gIsMousemove = false;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
    this.playBarOffsetX = 0;
    this.playBarDistanceLeft = this.playBarOffsetX / this.pxPerMs / this.millisInHour / this.hoursPerRuler;
    this.currentTimestamp = this.startTimestamp + this.hoursPerRuler * this.playBarDistanceLeft * this.millisInHour;

    this.updatePlayBarScale();
    this.init(this.startTimestamp, this.timecell);
    this.drawPlayBar();
  }

  private updatePlayBarScale(): void {
    this.playBarOffsetX1 = this.playBarOffsetX - this.scale * 0.6;
    this.playBarOffsetX2 = this.playBarOffsetX + this.scale * 0.6;
    this.playBarOffsetY1 = this.scale * 2.75;
    this.playBarOffsetY2 = this.scale * 3.75;
  }

  private checkForTimeHole(time: number): void {
    this.timecell.forEach((cell, i, timecell) => {
      const lastIndex = timecell.length - 1;
      const beginCell: VideoCellType = timecell[0];
      const lastCell: VideoCellType = timecell[lastIndex];

      if (time > lastCell.endTime) {
        this.playTime = lastCell.startTime;
        return;
      }

      if (time < beginCell.startTime) {
        this.playTime = beginCell.startTime;
        return;
      }

      if (i >= lastIndex) {
        return;
      }
      const nextCell = timecell[i + 1];
      const isTimeHole = time > cell.endTime && time < nextCell.startTime;

      if (isTimeHole) {
        const middleTimeHole = (nextCell.startTime + cell.endTime) / 2;
        if (time < middleTimeHole) {
          this.playTime = cell.startTime;
        } else {
          this.playTime = nextCell.startTime;
        }
        return;
      }
    });
  }

  private checkForEvents(time: number): void {
    if (!this.events.length) {
      this.playTime = time;
      return;
    }

    this.events.some(event => {
      if (time <= event.endTime && time >= event.startTime) {
        this.playTime = event.startTime;
        return true;
      }
      this.playTime = time;
      return false;
    });
  }

  private updatePlayTime(playTime: number): void {
    this.playTime = playTime;
    this.setTime(new Date(this.playTime).getTime());
  }

  private updateEndTimeThreshold(endTimeThreshold: number): void {
    this.endTimeThreshold = endTimeThreshold;
    this.hoursPerRuler = Math.ceil((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour) < 24 ?
      Number(((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour).toFixed(5)) :
      24;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
  }

  private updateStartTimeThreshold(startTimeThreshold: number): void {
    this.clearCanvas();
    this.startTimeThreshold = startTimeThreshold;
    this.hoursPerRuler = Math.ceil((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour) < 24 ?
      Number(((this.endTimeThreshold - this.startTimeThreshold) / this.millisInHour).toFixed(5)) :
      24;
    this.startTimestamp = this.startTimeThreshold;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * this.millisInHour);
  }

  private addGraduationText(date: string, graduationLeft: number): void {
    this.ctx.textAlign = 'center';
    this.ctx.fillText(date, graduationLeft, (this.scale * 2));
    this.ctx.fillStyle = this.verticalBarColor;
  }
}
