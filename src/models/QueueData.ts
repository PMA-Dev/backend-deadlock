export interface QueueData {
    id: string;
    topic: string;
    subject: string;
    data: QueueEventData;
    eventType: string;
    dataVersion: string;
    metadataVersion: string;
    eventTime: string;
}

export interface QueueEventData {
    messageId: string;
    from: string;
    to: string;
    message: string;
    receivedTimestamp: string;
}
