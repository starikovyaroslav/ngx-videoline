import {Component, OnInit} from '@angular/core';
import {VideoCellType} from 'ngx-video-timeline';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ngx-videoline';

  speed: number;
  canvasHeight: number;
  startTimeThreshold: number | string | Date;
  endTimeThreshold: number | string | Date;
  videoCells: VideoCellType[];
  playTime: number;
  isPlayClick: boolean;

  constructor() {
    this.speed = 1;
    this.isPlayClick = false;
    this.canvasHeight = 50;
    this.startTimeThreshold = new Date();
    this.endTimeThreshold = new Date(new Date().getTime() + (3 * 3600 * 1000));
    this.videoCells = [
      {
        beginTime: 1691118007105,
        endTime: 1691118240152,
        style: {
          background: '#2d9dff78'
        }
      },
      {
        beginTime: 1691118251228,
        endTime: 1691118979589,
        style: {
          background: '#2d9dff78'
        }
      },
    ];
    this.playTime = this.videoCells[0].beginTime as number;
  }

  onPlay(): void {
    this.isPlayClick = true;
    this.startTimeThreshold = new Date().getTime() - 1 * 3600 * 1000;
  }

  onPause(): void {
    this.isPlayClick = false;
  }

  ngOnInit(): void {
  }
}
