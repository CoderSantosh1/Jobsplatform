import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { connectCandidateClient } from "../../src/lib/mongo-connection-lifecycle.ts";
import "../../src/lib/mongoose-config.ts";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

class Candidate {
  readonly started = deferred<void>();
  readonly connected = deferred<void>();
  closeCount = 0;

  async connect() {
    this.started.resolve();
    await this.connected.promise;
  }

  async close() {
    this.closeCount++;
  }
}

test("overlapping cold-start requests attach one candidate and close the loser", async () => {
  const first = new Candidate();
  const second = new Candidate();
  let attached: Candidate | null = null;
  let attachCount = 0;
  const state = {
    isConnected: () => attached !== null,
    isDisconnected: () => attached === null,
    attach: (client: Candidate) => {
      attached = client;
      attachCount++;
    },
  };

  const firstRequest = connectCandidateClient(first, state);
  const secondRequest = connectCandidateClient(second, state);
  await Promise.all([first.started.promise, second.started.promise]);

  first.connected.resolve();
  assert.equal(await firstRequest, "connected");
  second.connected.resolve();
  assert.equal(await secondRequest, "reused");

  assert.equal(attached, first);
  assert.equal(attachCount, 1);
  assert.equal(first.closeCount, 0);
  assert.equal(second.closeCount, 1);
});

test("cold model initialization settles without waiting for a request connection", async () => {
  const name = `ColdStartLifecycle${Date.now()}`;
  const Model = mongoose.model(name, new mongoose.Schema({ title: String }));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settled = await Promise.race([
    Model.init().then(() => true),
    new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), 250);
    }),
  ]);
  if (timer) clearTimeout(timer);

  assert.equal(mongoose.connection.readyState, 0);
  assert.equal(settled, true);
});
