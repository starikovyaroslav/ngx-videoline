import { NgModule } from '@angular/core';
import { NgxVideolineComponent } from './timeline.component';
import { CommonModule } from '@angular/common';



@NgModule({
    declarations: [NgxVideolineComponent],
    imports: [
      CommonModule
    ],
    exports: [NgxVideolineComponent]
})
export class NgxVideolineModule { }
