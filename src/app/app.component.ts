import {Component, OnInit} from '@angular/core';
import {VideoCellType} from '../../projects/timeline/src/lib/timeline.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ngx-timeliner';

  speed: number;
  canvasHeight: number;
  startTimeThreshold: number | string | Date;
  endTimeThreshold: number | string | Date;
  videoCells: VideoCellType[];
  events: VideoCellType[];
  playTime: number;
  isPlayClick: boolean;

  constructor() {
  }

  ngOnInit(): void {
    this.speed = 1;
    this.isPlayClick = false;
    this.canvasHeight = 50;
    this.startTimeThreshold = new Date();
    this.endTimeThreshold = new Date(new Date().getTime() + (3 * 3600 * 1000));
    this.videoCells = [
      {
        startTime: 1695064095000,
        endTime: 1695078495000,
        style: {
          background: '#0087ff'
        }
      },
      {
        startTime: 1695092895000,
        endTime: 1695100095000,
        style: {
          background: '#0087ff'
        }
      },
    ];
    this.events = [
      {
        startTime: 1695096495000,
        endTime: 1695096585000,
        style: {
          background: '#ff3d00'
        }
      }
    ];
    this.playTime = this.videoCells[0].startTime as number;
  }
}
