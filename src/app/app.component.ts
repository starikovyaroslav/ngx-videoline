import { Component, OnInit } from '@angular/core';
import { VideoCellType } from 'ngx-video-timeline';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'ngx-video-timeline';

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
        this.videoCells = [];
        // todo не забывать убрать мок
        this.playTime = 1690520400000;
    }

    onPlay(): void {

        this.isPlayClick = true;
        this.startTimeThreshold = new Date().getTime() - 1 * 3600 * 1000;
    }

    onPause(): void {

        this.isPlayClick = false;
        // this.endTimeThreshold = new Date().getTime() + 1 * 3600 * 1000;
    }

    onPlayClick(date: number): void {
        // console.log(new Date(date));
        // this.canvasHeight = 60;
    }


    selectedTime(date: any): void {
        this.playTime = date.value;
    }

    // todo надо подставить реальные значения
    changeVideo(): void {
        this.videoCells = [
            {
                beginTime: 1690520400000,
                endTime: 1690527720000,
                style: {
                    background: '#2d9dff78'
                }
            },
            {
              beginTime: 1690531200000,
              endTime: 1690534800000,
              style: {
                background: '#2d9dff78'
              }
            }
        ];
    }

    ngOnInit(): void {
    }
}
