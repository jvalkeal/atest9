import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppService} from '../../../shared/api/app.service';
import {NotificationService} from '../../../shared/service/notification.service';

@Component({
  selector: 'app-add-website-starters',
  templateUrl: './website-starters.component.html'
})
export class WebsiteStartersComponent {
  isImporting = false;
  value: string;
  force = false;

  uris = {
    'stream.kafka.maven': 'https://dataflow.spring.io/kafka-maven-latest',
    'stream.kafka.docker': 'https://dataflow.spring.io/kafka-docker-latest',
    'stream.rabbitmq.maven': 'https://dataflow.spring.io/rabbitmq-maven-latest',
    'stream.rabbitmq.docker': 'https://dataflow.spring.io/rabbitmq-docker-latest',
    'task.maven': 'https://dataflow.spring.io/task-maven-latest',
    'task.docker': 'https://dataflow.spring.io/task-docker-latest'
  };

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private appService: AppService,
    private translate: TranslateService
  ) {}

  submit(): void {
    if (!this.value || !this.uris[this.value]) {
      this.notificationService.error(
        this.translate.instant('applications.add.websiteStarters.message.noStarterTitle'),
        this.translate.instant('applications.add.websiteStarters.message.noStarterContent')
      );
      return;
    }
    this.isImporting = true;
    this.appService.importUri(this.uris[this.value], this.force).subscribe(
      () => {
        this.notificationService.success(
          this.translate.instant('applications.add.websiteStarters.message.successTitle'),
          this.translate.instant('applications.add.websiteStarters.message.successContent')
        );
        this.back();
      },
      error => {
        this.notificationService.error(this.translate.instant('commons.message.error'), error);
        this.isImporting = false;
      }
    );
  }

  back(): void {
    this.router.navigateByUrl('apps');
  }
}
