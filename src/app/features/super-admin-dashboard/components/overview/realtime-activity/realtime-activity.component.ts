import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { RealtimeActivity } from '../../../../../core/models/admin.models';

@Component({
  selector: 'app-realtime-activity',
  standalone: true,
  imports: [CommonModule, TuiIcon, TuiCardLarge],
  templateUrl: './realtime-activity.component.html',
  styleUrl: './realtime-activity.component.less',
})
export class RealtimeActivityComponent {
  readonly activity = input<RealtimeActivity | null>();
}
