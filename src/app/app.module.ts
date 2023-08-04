import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {NgxTimelinerModule} from '../../projects/timeline/src/lib/timeline.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxTimelinerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
