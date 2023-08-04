import { NgModule } from '@angular/core';
import { NgxTimelinerComponent } from './timeline.component';
import { CommonModule } from '@angular/common';



@NgModule({
    declarations: [NgxTimelinerComponent],
    imports: [
      CommonModule
    ],
    exports: [NgxTimelinerComponent]
})
export class NgxTimelinerModule { }
