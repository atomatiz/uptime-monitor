import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { HostRepository } from '../repositories/host.repository';
import { LoggingService } from '@core/logging.service';
import { Config, UseCase } from '@common/interfaces';
import aggregateStore from '@domain/aggregate-store';
import { Host } from '@domain/host';
import { Website } from '@domain/website';
import { ID_PREFIXES } from '@common/constants';

export class RestartHostUseCase implements UseCase<string, void> {
    private readonly logger = new LoggingService(RestartHostUseCase.name);

    constructor(
        @Inject('HOST_REPOSITORY')
        private readonly hostRepository: HostRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(aggregateId: string, config: Config): Promise<void> {
        const host = aggregateStore.get<Host>(aggregateId);
        const website = aggregateStore.get<Website>(
            aggregateId.replace(ID_PREFIXES.HOST, ID_PREFIXES.WEBSITE),
        );
        if (!host || !website) {
            this.logger.warn(
                `No ${!host ? `host` : !website ? `website` : `host and website`} found with ID: ${aggregateId}`,
            );
            return;
        }

        const isHostRestarting = async (): Promise<boolean> => {
            return await this.hostRepository.isRestarting(
                host.instanceId,
                config,
            );
        };

        if (host.needsManualIntervention || host.hasReachedMaxRestartAttempts) {
            return;
        }

        let currentAttempt = host.restartAttempts + 1;

        while (currentAttempt <= host.maxRestartAttempts) {
            if ((await isHostRestarting()) && currentAttempt === 1) {
                this.logger.warn(
                    `The host ${host.id} is already in transitional state, waiting for host startup threshold in ${host.startupThreshold / 60000} minutes...`,
                );

                await this.waitForThreshold(host, website);

                if (website.isOnline) {
                    host.markAsRestarted();
                    return;
                }

                if (await isHostRestarting()) {
                    return;
                }
            }

            host.markAsRestarting();

            const restarted = await this.hostRepository.restartHost(
                host.instanceId,
                config,
            );

            if (restarted) {
                this.logger.log(
                    `Restarting host ${host.id} attempt ${currentAttempt}/${host.maxRestartAttempts} successful, waiting for host startup threshold in ${host.startupThreshold / 60000} minutes...`,
                );

                if (
                    currentAttempt < host.maxRestartAttempts &&
                    currentAttempt < 2
                ) {
                    host.markAsRestarted();
                    if (!host.restartedNotificationSent) {
                        const event = host.getDomainEventById(host.id);
                        if (event) {
                            await this.eventBus.publish(event);
                            host.deleteDomainEventById(host.id);
                        }
                    }
                }

                await this.waitForThreshold(host, website);

                if (website.isOnline) {
                    host.markAsRestarted();
                    return;
                }
            } else {
                this.logger.error(
                    `Restarting host ${host.id} attempt ${currentAttempt}/${host.maxRestartAttempts} failed, retrying in ${2000 / 1000} seconds...`,
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            currentAttempt++;

            if (currentAttempt > host.maxRestartAttempts) {
                await this.checkManualIntervention(host, website);
                break;
            }
        }
    }

    private async waitForThreshold(
        host: Host,
        website: Website,
    ): Promise<void> {
        const waitStart = Date.now();
        while (Date.now() - waitStart < host.startupThreshold) {
            if (website.isOnline) {
                host.markAsRestarted();
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }

    private async checkManualIntervention(
        host: Host,
        website: Website,
    ): Promise<void> {
        if (!website.isOnline && !host.manualInterventionNotificationSent) {
            host.markAsNeedsManualIntervention();
            const event = host.getDomainEventById(host.id);
            if (event) {
                await this.eventBus.publish(event);
                host.deleteDomainEventById(host.id);
            }
        }
    }
}
