import { KafkaClient } from './kafka.client';
import { RabbitMQClient } from './rabbitmq.client';

export const QueueClients = [KafkaClient, RabbitMQClient];
