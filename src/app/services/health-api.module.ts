import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HealthApiService } from './health-api.service';

@NgModule({
  imports: [HttpClientModule],
  providers: [HealthApiService]
})
export class HealthApiModule {} 