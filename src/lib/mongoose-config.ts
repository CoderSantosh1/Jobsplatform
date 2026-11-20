import mongoose from "mongoose";

// Model.init() caches a promise per model. Keep model compilation I/O-free; db.ts
// explicitly awaits schema index creation after a request establishes a connection.
mongoose.set("autoCreate", false);
mongoose.set("autoIndex", false);
mongoose.connection.config.autoCreate = false;
mongoose.connection.config.autoIndex = false;
