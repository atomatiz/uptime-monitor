import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { WebsiteRepository } from '../repositories/website.repository';
import { LoggingService } from '@core/logging.service';
import { Website } from '@domain/website';
import { UseCase } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';

export class TrackWebsiteUseCase implements UseCase<string, void> {
    private readonly logger = new LoggingService(TrackWebsiteUseCase.name);

    constructor(
        @Inject('WEBSITE_REPOSITORY')
        private readonly websiteRepository: WebsiteRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(aggregateId: string): Promise<void> {
        const website = aggregateStore.get<Website>(aggregateId);
        if (!website) {
            this.logger.warn(`No website found with ID: ${aggregateId}`);
            return;
        }

        let isOnline: boolean = false;

        for (let i = 1; i <= website.trackingRetryAttempts; i++) {
            isOnline = await this.websiteRepository.trackWebsite(
                website.url,
                5000,
            );

            if (isOnline) {
                if (!website.isOnline) {
                    website.softClearDomainEvents();
                    if (!website.websiteDownNotificationSent) {
                        website.host.resetState();
                        website.resetState();
                        this.logger.info(
                            `The website ${website.url} is back ONLINE, all states have been reset`,
                        );
                    } else {
                        website.markAsUp();
                        const event = website.getDomainEventById(website.id);
                        if (event) {
                            await this.eventBus.publish(event);
                            website.deleteDomainEventById(website.id);
                        }
                    }
                }

                this.logger.log(
                    `Tracking successful, the website ${website.url} is ONLINE`,
                );
                return;
            }

            if (website.host.needsManualIntervention) {
                this.logger.error(
                    `The host for ${website.url} exceeded ${website.host.maxRestartAttempts} restart attempts. Manual intervention is required.`,
                );
            } else {
                this.logger.error(
                    `Tracking website ${website.url} attempt ${i}/${website.trackingRetryAttempts} failed, retrying in ${i < website.trackingRetryAttempts ? `${2000 / 1000} seconds...` : `next scheduled task lifecycle`}`,
                );
            }

            if (i === 1 && website.isOnline) {
                website.markAsDown();
            }

            if (i < website.trackingRetryAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }

        if (
            website.hasReachedDowntimeThreshold &&
            !website.websiteDownNotificationSent &&
            !website.host.hasReachedMaxRestartAttempts &&
            !website.host.needsManualIntervention
        ) {
            const event = website.getDomainEventById(website.id);
            if (event) {
                await this.eventBus.publish(event);
                website.deleteDomainEventById(website.id);
            }
        }
    }
}
