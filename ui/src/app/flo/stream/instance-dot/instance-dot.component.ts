import {Component, ViewEncapsulation} from '@angular/core';
import {ElementComponent} from '../../shared/support/shape-component';
import {InstanceStatus} from '../../../shared/model/metrics.model';

/**
 * Component for displaying "dot" for instance streamStatuses data under the module
 *
 * @author Alex Boyko
 * @author Andy Clement
 */
@Component({
  selector: 'app-flo-instance-dot',
  templateUrl: 'instance-dot.component.html',
  styleUrls: ['instance-dot.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InstanceDotComponent extends ElementComponent {
  get instance(): InstanceStatus {
    return this.view ? this.view.model.attr('instance') : undefined;
  }

  get guid(): string {
    return this.instance ? this.instance.guid : '';
  }

  get state(): string {
    return this.instance ? this.instance.state : '';
  }
}
