const mongoose = require("mongoose");
const Project = require("./models/Project").default || require("./models/Project");

mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://developer:developer123@velora.yab0h.mongodb.net/velora?retryWrites=true&w=majority")
  .then(async () => {
    const p = await Project.findOne({});
    console.log("Found project currentStep:", p.currentStep);
    process.exit(0);
  });
