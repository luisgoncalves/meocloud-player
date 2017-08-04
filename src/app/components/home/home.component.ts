import { Component, OnInit } from '@angular/core';
import { CloudConfiguration } from '../../cloud-config';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  constructor(private readonly cloud: CloudConfiguration) { }

}
