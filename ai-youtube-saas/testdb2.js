const mongoose = require("mongoose");
const Project = require("./models/Project").default || require("./models/Project");

mongoose.connect("mongodb+srv://developer:developer123@velora.yab0h.mongodb.net/velora?retryWrites=true&w=majority")
  .then(async () => {
    const p = await Project.findOne({});
    console.log("Found project currentStep:", p.currentStep);
    // Let's manually set currentStep
    p.currentStep = "scenes";
    await p.save();
    console.log("Saved it as scenes.");
    process.exit(0);
  });
