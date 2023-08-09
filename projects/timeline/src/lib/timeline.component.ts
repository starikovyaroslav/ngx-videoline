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
import {interval, Subscription} from 'rxjs';

/**
 * A utility class for working with dates.
 */
export class DateUtil {

  /**
   * Formats the given date according to the specified format.
   * @param date The date to format.
   * @param format The format string, using the following placeholders:
   *   - YYYY: four-digit year
   *   - MM: two-digit month (zero-padded)
   *   - DD: two-digit day of month (zero-padded)
   *   - HH: two-digit hour (zero-padded, 24-hour format)
   *   - mm: two-digit minute (zero-padded)
   *   - ss: two-digit second (zero-padded)
   * @returns The formatted date string.
   */
  static formatDate(date: Date, format: string): string {
    // Extract the year, month, day, hours, minutes, and seconds from the date
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Replace the placeholders in the format string with the corresponding date parts
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}

export interface CanvasPos {
  posX: number;
  posY: number;
}

export interface VideoCellStyleType {
  background: string;
}

export interface VideoCellType {
  beginTime: number | string;
  endTime: number | string;
  style?: VideoCellStyleType;
}


@Component({
  selector: 'ngx-timeliner',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class NgxTimelinerComponent implements OnInit, OnChanges {


  // The height of the outer canvas
  @Input() canvasHeight = 50;

  // Canvas scale is adjusted according to outer height
  scale = this.canvasHeight / 4.55;

  // Video playback time
  @Input() playTime: number | string | Date;

  // The video plays at twice the speed
  @Input() speed: number;

  // Video fast forward value
  @Input() forWardValue: number;

  // Start time limit: Timestamp
  @Input() startTimeThreshold: number | string | Date;

  // End time limit: Timestamp
  @Input() endTimeThreshold: number | string | Date;

  // relation to Css Start

  // color of canvas border
  @Input() borderColor: string;

  // color of canvas backgraound
  @Input() bgColor: string;

  // color of the bottomLine
  @Input() bottomLineColor: string;

  // color of the verticalBar
  @Input() verticalBarColor: string;

  // color of the playBar
  @Input() playBarColor: string;


  // relation to Css End

  // Video clips
  @Input() videoCells: VideoCellType[];

  // flag of click play button
  @Input() isPlayClick: boolean;

  // emit data when click playButton
  @Output() readonly playClick: EventEmitter<any>;

  // emit data when mouseUp
  @Output() readonly mouseUp: EventEmitter<any>;

  // emit data when mouseDown
  @Output() readonly mouseDown: EventEmitter<any>;

  // emit data when keyUp
  @Output() readonly keyUp: EventEmitter<any>;

  // emit data when keyDown
  @Output() readonly keyDown: EventEmitter<any>;

  // --- canvas data start ---//

  // canvas box
  canvas: any;

  // canvas context
  ctx: CanvasRenderingContext2D;

  // canvas width
  canvasW: number;

  // canvas height
  canvasH: number;

  // video clips in reality
  timecell: VideoCellType[];

  // per minute stand for step
  minutesPerStep: Array<number>;

  // per minite stand for px
  pxPerMs: number;

  // Minimum width between scales, unit px
  graduationStep: number;

  // The timeline shows x hours
  hoursPerRuler: number;

  // The leftmost timestamp that appears -- the default is the first 12 hours
  startTimestamp: number;

  // current timestamp
  currentTimestamp: number;

  // Px two hours apart
  distanceBetweenGtitle: number;

  // zoom of canvas
  zoom: number;

  // marker of drag an unreleased mouse event
  gIsMousedown: boolean;

  // marker of drag the mouse move
  gIsMousemove: boolean;

  // The position of the X-axis when the mouse is pressed
  gMousedownCursor = undefined;

  // The position of the y-axis when the mouse is pressed
  gMousedownCursorY = undefined;

  // Time flow timer
  setTimeMove: Subscription;

  // The distance to the left of the play button
  playBarDistanceLeft: number;

  // Play the initial position of the icon
  playBarOffsetX: number;

  // Play the X-axis position 1 of the icon
  playBarOffsetX1: number;

  // Play the X-axis position 2 of the icon
  playBarOffsetX2: number;

  // Play the Y-axis position 1 of the icon
  playBarOffsetY1: number;

  // Play the Y-axis position 2 of the icon
  playBarOffsetY2: number;

  // --- canvas data end ---//

  // elements of the timeline
  @ViewChild('timeline', {static: true}) canvasExp: ElementRef<HTMLCanvasElement>;

  constructor() {
    this.forWardValue = 5000;
    this.speed = 1000;
    this.playTime = new Date().getTime();
    this.startTimeThreshold = new Date().getTime() - 1 * 12 * 3600 * 1000;
    this.endTimeThreshold = new Date().getTime() + 1 * 12 * 3600 * 1000;
    this.playClick = new EventEmitter<any>();
    this.mouseUp = new EventEmitter<any>();
    this.mouseDown = new EventEmitter<any>();
    this.keyUp = new EventEmitter<any>();
    this.keyDown = new EventEmitter<any>();
    this.isPlayClick = false;
    this.videoCells = [
      {
        beginTime: new Date().getTime() - 3 * 3600 * 1000,
        endTime: new Date().getTime() - 1 * 3600 * 1000,
        style: {
          background: 'rgba(132, 244, 180, 0.498039)'
        }
      },
      {
        beginTime: new Date().getTime() - 6 * 3600 * 1000,
        endTime: new Date().getTime() - 4 * 3600 * 1000,
        style: {
          background: 'rgba(132, 244, 180, 0.498039)'
        }
      }
    ];
    this.verticalBarColor = '#333333';
    this.bottomLineColor = 'transparent';
    this.borderColor = '#fff';
    this.bgColor = '#f7f7f7';
    this.playBarColor = '#3daae2';
  }

  /**
   * Browser change event
   */
  @HostListener('window:resize', [])
  onResize(): void {
    this.canvas.width = Math.round(this.canvas.parentNode.offsetWidth - 2);
    this.canvasW = this.canvas.parentNode.offsetWidth;
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
    this.drawPlayBar();
    this.init(this.startTimestamp, this.timecell, false);
  }

  /**
   * Keyboard press event
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: any): void {
    if (Number(event.keyCode) === 37) {
      const newPlayTime = Number(this.playTime) - this.forWardValue;
      this.checkAllowedTime(newPlayTime);
      this.currentTimestamp = Number(this.currentTimestamp) - this.forWardValue;
      this.playBarOffsetX--;
    } else if (Number(event.keyCode === 39)) {
      const newPlayTime = Number(this.playTime) + this.forWardValue;
      this.checkAllowedTime(newPlayTime);
      this.currentTimestamp = Number(this.currentTimestamp) + this.forWardValue;
      this.playBarOffsetX++;
    }
    this.set_time_to_middle(this.playTime as number);

    this.keyDown.emit(this.playTime);
  }

  /**
   * Keyboard release event
   */
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: any): void {
    if (Number(event.keyCode) === 13 || Number(event.keyCode === 32)) {
      this.isPlayClick ? this.onPauseClick() : this.onPlayClick();
    }
    this.keyUp.emit(this.playTime);
  }

  ngOnInit(): void {
    // Initialize data video group event stamp to show new Date().getTime()- number of hours

    // Assign the Canvas DOM to the variable Canvas
    this.canvas = this.canvasExp.nativeElement;

    // Define the area of the canvas
    this.ctx = this.canvas.getContext('2d');

    // Redefine the width of the canvas. The default canvas is 300. Assign the width of the parent element
    this.canvas.width = Math.round(this.canvas.parentNode.offsetWidth - 2);

    // Store the width and height of the canvas
    this.canvasW = this.canvas.width;
    this.canvas.height = this.canvasHeight;
    this.canvasH = this.canvas.height;

    // Assign the video array to Timecell
    this.timecell = this.videoCells;

    // Initialize the number of steps per minute
    this.minutesPerStep = [
      1,
      2,
      5,
      10,
      15,
      20,
      30,
      60,
      120,
      180,
      240,
      360,
      720,
      1440
    ];

    // Initialization style

    // Minimum width between scales, in units of px 20px
    this.graduationStep = 20;

    // The timeline shows the time rounded up according to the time threshold
    this.hoursPerRuler = Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) < 24 ?
      Number(((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600).toFixed(5)) :
      24;

    // The leftmost timestamp defaults to 12 hours before the current time
    this.startTimestamp = Number(this.startTimeThreshold);

    // Default distance 80
    this.distanceBetweenGtitle = 80;
    // Default zoom 24
    this.zoom = 24;

    // Default false
    this.gIsMousedown = false;
    this.gIsMousemove = false;
    this.gMousedownCursor = undefined;

    // px/ms
    this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);

    // The initial X position of the playback icon is in the middle of the scale
    this.playBarOffsetX = 0;

    this.playBarDistanceLeft = this.playBarOffsetX / this.pxPerMs / 3600 / 1000 / this.hoursPerRuler;
    this.currentTimestamp = this.startTimestamp + this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000;

    this.playBarOffsetX1 = this.playBarOffsetX - (this.scale * 0.6);
    this.playBarOffsetX2 = this.playBarOffsetX + (this.scale * 0.6);
    this.playBarOffsetY1 = (this.scale * 2.5);
    this.playBarOffsetY2 = ((this.scale * 3.5));

    // Initialize the timeline
    this.init(this.startTimestamp, this.timecell, false);
    // Draw the play button
    this.drawPlayBar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Refactor the playback component when the width and height change
    if (changes.canvasHeight) {
      this.canvasHeight = changes.canvasHeight.currentValue;

      // Assign the Canvas DOM to the variable Canvas
      this.canvas = this.canvasExp.nativeElement;

      // Define the area of the canvas
      this.ctx = this.canvas.getContext('2d');
      // Redefine the width of the canvas. The default canvas is 300. Assign the width of the parent element
      this.canvas.width = Math.round(this.canvas.parentNode.offsetWidth - 2);

      // Store the width and height of the canvas
      this.canvasW = this.canvas.width;

      this.canvas.height = this.canvasHeight;
      this.canvasH = this.canvas.height;

      // Assign the video array to Timecell
      this.timecell = this.videoCells;

      this.minutesPerStep = [
        1,
        2,
        5,
        10,
        15,
        20,
        30,
        60,
        120,
        180,
        240,
        360,
        720,
        1440
      ];
      // The timeline shows the time rounded up according to the time threshold
      this.hoursPerRuler = Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) < 24 ?
        Number(((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600).toFixed(5)) :
        24;

      // The leftmost timestamp defaults to 12 hours before the current time
      this.startTimestamp = Number(this.startTimeThreshold);

      this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);

      // The initial X position of the playback icon is in the middle of the scale
      this.playBarOffsetX = this.canvasW / 2;

      this.playBarDistanceLeft = this.playBarOffsetX / this.pxPerMs / 3600 / 1000 / this.hoursPerRuler;
      // Current timestamp
      this.currentTimestamp = this.startTimestamp + this.hoursPerRuler * this.playBarDistanceLeft * 3600 * 1000;

      this.playBarOffsetX1 = this.playBarOffsetX - (this.scale * 0.6);
      this.playBarOffsetX2 = this.playBarOffsetX + (this.scale * 0.6);
      this.playBarOffsetY1 = (this.scale * 2.5);
      this.playBarOffsetY2 = ((this.scale * 3.5));

      this.init(this.startTimestamp, this.timecell, false);
      this.drawPlayBar();
    }
    if (changes.videoCells) {
      this.videoCells = changes.videoCells.currentValue;
      this.timecell = this.videoCells;
      this.add_cells(this.timecell);
    }
    if (changes.startTimeThreshold) {
      this.clearCanvas();
      const value = changes.startTimeThreshold.currentValue;
      if (changes.startTimeThreshold.currentValue instanceof String) {
        this.startTimeThreshold = new Date(value).getTime();
      } else if (value instanceof Date) {
        this.startTimeThreshold = value.getTime();
      } else if (typeof value === 'number') {
        this.startTimeThreshold = Number(value);
      }

      this.hoursPerRuler = Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) < 24 ?
        Number(((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600).toFixed(5)) :
        24;
      this.startTimestamp = Number(this.startTimeThreshold);
      this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    }
    if (changes.endTimeThreshold) {
      const value = changes.endTimeThreshold.currentValue;
      if (changes.endTimeThreshold.currentValue instanceof String) {
        this.endTimeThreshold = new Date(value).getTime();
      } else if (value instanceof Date) {
        this.endTimeThreshold = value.getTime();
      } else if (typeof value === 'number') {
        this.endTimeThreshold = Number(value);
      }
      this.hoursPerRuler = Math.ceil((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600) < 24 ?
        Number(((Number(this.endTimeThreshold) - Number(this.startTimeThreshold)) / 1000 / 3600).toFixed(5)) :
        24;
      this.pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    }
    if (changes.playTime) {
      const value = changes.playTime.currentValue;
      if (changes.playTime.currentValue instanceof String) {
        this.playTime = new Date(value).getTime();
      } else if (value instanceof Date) {
        this.playTime = value.getTime();
      } else if (typeof value === 'number') {
        this.playTime = Number(value);
      }
      this.set_time_to_middle(new Date(this.playTime).getTime());
    }
    if (changes.speed) {

      this.speed = Number(changes.speed.currentValue) * 1000;
    }
    if (changes.forWardValue) {

      this.forWardValue = Number(changes.forWardValue.currentValue) * 1000;
    }

    if (changes.isPlayClick) {
      if (changes.isPlayClick.currentValue) {
        this.onPlayClick();
      } else {
        this.onPauseClick();
      }
    }
  }

  /**
   * Initialize
   * @param  startTimestamp Leftmost time
   * @param  timecell Video segment array
   * @param  redrawFlag Whether to redraw the mark
   */
  init(startTimestamp: number, timecell: VideoCellType[], redrawFlag: boolean): void {
    this.timecell = timecell;
    this.startTimestamp = startTimestamp;
    if (this.currentTimestamp > this.endTimeThreshold) {
      this.currentTimestamp = Number(this.endTimeThreshold);
      this.playTime = Number(this.endTimeThreshold);
    } else if (
      this.currentTimestamp <
      this.startTimeThreshold
    ) {
      this.currentTimestamp = Number(this.startTimestamp);
      this.playTime = Number(this.startTimestamp);
    }
    this.drawCellBg();
    this.add_graduations(startTimestamp);
    this.add_cells(timecell);
    // Draw the verticalBar
    this.drawLine(
      0,
      this.canvasH,
      this.canvasW,
      this.canvasH,
      this.bottomLineColor,
      1
    );
  }

  /**
   * Draw add scale
   * @param  startTimestamp Leftmost time
   */
  add_graduations(startTimestamp: number): void {
    // px/min
    const pxPerMin = this.canvasW / (this.hoursPerRuler * 60);
    // px/ms
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 60 * 60 * 1000);
    // The default minimum value of PX/steo is 20px
    let pxPerStep = this.graduationStep;

    // Min/steo
    let minPerStep = pxPerStep / pxPerMin;

    for (const v of this.minutesPerStep) {
      if (minPerStep <= v) {
        // Keep each cell within the range specified by minutesPerStep
        minPerStep = v;
        pxPerStep = pxPerMin * minPerStep;
        break;
      }
    }
    let mediumStep = 30;
    for (const v of this.minutesPerStep) {
      if (this.distanceBetweenGtitle / pxPerMin <= v) {
        mediumStep = v;
        break;
      }
    }
    // The total number
    const numSteps = this.canvasW / pxPerStep;

    let graduationLeft: number;
    let graduationTime: number;
    let lineH: number;

    // The initial offset time (ms)
    const msOffset = this.ms_to_next_step(
      startTimestamp,
      minPerStep * 60 * 1000
    );

    // The initial offset is (px)
    const pxOffset = msOffset * pxPerMs;

    // ms/step
    const msPerStep = pxPerStep / pxPerMs;
    for (let i = 0; i < numSteps; i++) {
      // Distance = offset distance to start + steps *px/ steps
      graduationLeft = pxOffset + i * pxPerStep;

      // Time = left start time + offset time + steps *ms/ steps
      graduationTime =
        Number(startTimestamp) +
        Number(msOffset) +
        i * Number(msPerStep);

      const date = new Date(graduationTime);
      if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
        lineH = (this.scale * 1.25);
        const bigDate = DateUtil.formatDate(date, 'HH:mm:ss');
        this.ctx.textAlign = 'center';
        this.ctx.fillText(bigDate, graduationLeft, (this.scale * 1.5));
        this.ctx.fillStyle = this.verticalBarColor;
      } else if ((graduationTime / (60 * 1000)) % mediumStep === 0) {
        lineH = (this.scale * 0.75);
        const middleDate = DateUtil.formatDate(date, 'HH:mm:ss');
        this.ctx.textAlign = 'center';
        this.ctx.fillText(middleDate, graduationLeft, (this.scale * 1.5));
        this.ctx.fillStyle = this.verticalBarColor;
      } else {
        lineH = (this.scale * 0.5);
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

  /**
   * Draw the play button
   */
  drawPlayBar(): void {
    this.ctx.beginPath();
    this.ctx.moveTo(this.playBarOffsetX, 0);
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.strokeStyle = this.playBarColor;
    this.ctx.stroke();
    this.ctx.moveTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * 0.6), (this.scale * 2.5));
    this.ctx.lineTo(this.playBarOffsetX - (this.scale * 0.6), (this.scale * 3.5));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * 0.6), (this.scale * 3.5));
    this.ctx.lineTo(this.playBarOffsetX + (this.scale * 0.6), (this.scale * 2.5));
    this.ctx.lineTo(this.playBarOffsetX, (this.scale * 1.75));
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.fill();
    this.ctx.closePath();
    const time = Number(this.currentTimestamp);
    this.ctx.fillStyle = this.playBarColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      DateUtil.formatDate(new Date(time), 'HH:mm:ss'),
      this.playBarOffsetX,
      (this.scale * 4.25)
    );
  }

  /**
   * Draw the line
   * @param  beginX The X-axis to start with
   * @param  beginY The Y-axis to start with
   * @param  endX The end of the X-axis
   * @param  endY The end of the Y-axis
   * @param  color color
   * @param  width width
   */
  drawLine(
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

  /**
   * Add video segment
   * @param  cells Video array
   */
  add_cells(cells: any): void {
    cells.forEach((cell: MouseEvent) => {
      this.draw_cell(cell);
    });
  }

  /**
   * Draw video blocks
   * @param  cell The cell includes beginTime Ms; The endTime ms; style;
   */
  draw_cell(cell: any): void {
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 60 * 60 * 1000); // px/ms
    const beginX = (cell.beginTime - this.startTimestamp) * pxPerMs;
    const cellWidth = (cell.endTime - cell.beginTime) * pxPerMs;
    this.ctx.fillStyle = cell.style.background;
    this.ctx.fillRect(beginX, 0, cellWidth, (this.scale * 0.75));
  }

  /**
   * Draws the background of the video block
   */
  drawCellBg(): void {
    this.ctx.fillStyle = this.verticalBarColor;
    this.ctx.fillRect(100, 0, this.canvasW, 0);
  }

  /**
   * Drag/click the Mousedown event
   */
  mousedownFunc(e: MouseEvent): void {
    this.gIsMousedown = true;
    this.gMousedownCursor = this.get_cursor_x_position(e).posX;
    this.gMousedownCursorY = this.get_cursor_x_position(e).posY;
  }

  /**
   * Drag/mouse hover to display mousemove events
   */
  mousemoveFunc(e: MouseEvent): void {
    this.clearCanvas();
    const posX = this.get_cursor_x_position(e).posX;
    const pxPerMs = this.canvasW / (this.hoursPerRuler * 3600 * 1000);
    if (this.gIsMousedown) {
      if (
        this.gMousedownCursor >= this.playBarOffsetX1 ||
        this.gMousedownCursor <= this.playBarOffsetX2 ||
        this.gMousedownCursorY >= this.playBarOffsetY1 ||
        this.gMousedownCursorY <= this.playBarOffsetY2
      ) {
        this.playBarDistanceLeft = this.playBarOffsetX / this.pxPerMs / 3600 / 1000 / this.hoursPerRuler;
        this.playBarOffsetX = posX;
        this.playBarOffsetX1 = this.playBarOffsetX - (this.canvasW);
        this.playBarOffsetX2 = this.playBarOffsetX + (this.canvasW);

        this.currentTimestamp =
          (this.startTimestamp +
            Math.round(this.playBarOffsetX / pxPerMs));
        this.drawPlayBar();
        this.init(this.startTimestamp, this.timecell, true);

        this.gIsMousemove = true;

      } else {
        this.drawPlayBar();
        this.init(this.startTimestamp, this.timecell, true);

        this.gIsMousemove = true;
        this.gMousedownCursor = posX;
      }
      this.mouseUp.emit(this.currentTimestamp);

    } else {
      const time = this.startTimestamp + posX / pxPerMs;
      this.drawPlayBar();
      this.init(this.startTimestamp, this.timecell, true);
      this.drawLine(posX, 0, posX, this.scale * 2, '#808080', 1);

      this.ctx.fillStyle = '#808080';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        DateUtil.formatDate(
          new Date(time),
          'HH:mm:ss'
        ),
        posX,
        (this.scale * 3),
      );
    }
  }

  /**
   * Drag/click the Mouseup event
   */
  mouseupFunc(e: MouseEvent): void {
    if (this.gIsMousemove) {
      // Drag events
      this.gIsMousemove = false;
      this.gIsMousedown = false;
      const newPlayTime = this.startTimestamp + Math.round(this.playBarOffsetX / this.pxPerMs);
      this.checkAllowedTime(newPlayTime);
      this.set_time_to_middle(this.playTime as number);
    } else {
      // Click event
      this.gIsMousedown = false;

      // Mouse distance (px)
      const posX = this.get_cursor_x_position(e).posX;

      this.playBarOffsetX = posX;

      const newPlayTime = this.startTimestamp + Math.round(this.playBarOffsetX / this.pxPerMs);
      this.checkAllowedTime(newPlayTime);
      this.set_time_to_middle(this.playTime as number);
    }
    this.mouseDown.emit(this.playTime);
  }

  checkAllowedTime(time: number): void {
    const allowedTime = !!this.timecell.find(cell => (time <= cell.endTime && time >= cell.beginTime));
    if (!allowedTime) {
      return;
    }
    this.playTime = time;
  }

  /**
   * Mouseout of the hidden time mouseout event
   */
  mouseoutFunc(): void {
    this.clearCanvas();
    this.drawPlayBar();
    this.init(this.startTimestamp, this.timecell, true);
  }

  /**
   * Get the mouse POSx
   * @param  e event
   */
  get_cursor_x_position(e: any): CanvasPos {
    let posx = 0;
    let posy = 0;

    if (!e) {
      e = window.event;
    }
    if (e.offsetX || e.offsetY) {
      posx = e.offsetX;
      posy = e.offsetY;
    }

    return {posX: posx, posY: posy};
  }

  /**
   * The offset of the left start time, returns the unit ms
   * @param  timestamp The time stamp
   * @param  step The offset
   */
  ms_to_next_step(timestamp: number, step: number): number {
    const remainder = timestamp % step;
    return remainder ? step - remainder : 0;
  }

  /**
   * Set the time to jump to the middle red line
   *  @param  time Unit of ms
   */

  set_time_to_middle(time: number): void {
    if (this.ctx) {
      this.clearCanvas();
      this.currentTimestamp = time;
      this.playBarOffsetX = Math.round((this.currentTimestamp - this.startTimestamp) * this.pxPerMs);
      this.drawPlayBar();
      this.init(this.startTimestamp, this.timecell, true);
    }
  }

  /**
   * 清除canvas 每次重新绘制需要先清除
   */
  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, (this.scale * 7.5));
  }

  /**
   * Click to play
   */

  onPlayClick(): void {
    this.isPlayClick = true;
    this.setTimeMove = interval(this.speed).subscribe(() => {
      const newPlayTime = Number(this.playTime) + 1 * 1000;
      this.checkAllowedTime(newPlayTime);
      this.playClick.emit(this.playTime);
      this.set_time_to_middle(this.playTime as number);
    });
  }

  /**
   * Click on the pause
   */
  onPauseClick(): void {
    this.isPlayClick = false;
    if (this.setTimeMove) {
      this.setTimeMove.unsubscribe();
      this.playClick.emit(this.playTime);
    }
  }

  /**
   * Temporary unused
   * @param event MouseEvent
   */
  onDragStart(e: MouseEvent): boolean {
    e.preventDefault();
    return false;
  }
}
