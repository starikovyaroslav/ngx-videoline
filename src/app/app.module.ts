import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxVideolineModule } from '../../projects/timeline/src/lib/timeline.module';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        NgxVideolineModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
