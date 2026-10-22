// Small optimised Cloudinary thumbnails for icons.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cloudinaryThumb } from "../../src/lib/cloudinary.ts";

const RAW = "https://res.cloudinary.com/dkplzvkie/image/upload/v1752733414/quiz-category-icons/tbpcs6zcsfyl9o21yiow.webp";

test("adds a 2x resize and auto format/quality to Cloudinary upload URLs", () => {
  assert.equal(
    cloudinaryThumb(RAW, 36),
    "https://res.cloudinary.com/dkplzvkie/image/upload/f_auto,q_auto,c_fit,w_72,h_72/v1752733414/quiz-category-icons/tbpcs6zcsfyl9o21yiow.webp",
  );
});

test("leaves other URLs and already-transformed URLs alone", () => {
  assert.equal(cloudinaryThumb("/file.svg", 36), "/file.svg");
  assert.equal(cloudinaryThumb("https://example.com/image/upload/a.png", 36), "https://example.com/image/upload/a.png");
  const done = cloudinaryThumb(RAW, 36);
  assert.equal(cloudinaryThumb(done, 36), done);
});
