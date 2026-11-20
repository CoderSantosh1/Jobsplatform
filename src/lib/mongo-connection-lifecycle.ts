export interface MongoConnectionCandidate {
  connect(): Promise<unknown>;
  close(): Promise<void>;
}

export interface MongoConnectionState<Client> {
  isConnected(): boolean;
  isDisconnected(): boolean;
  attach(client: Client): void;
}

export async function connectCandidateClient<Client extends MongoConnectionCandidate>(
  client: Client,
  connection: MongoConnectionState<Client>,
  closeClient: (client: Client) => Promise<void> = (candidate) => candidate.close(),
): Promise<"connected" | "reused"> {
  await client.connect();

  if (connection.isConnected()) {
    await closeClient(client);
    return "reused";
  }

  if (!connection.isDisconnected()) {
    throw new Error("MongoDB connection changed state while connecting");
  }

  connection.attach(client);
  return "connected";
}
