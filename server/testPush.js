const admin = require("./src/config/firebase");

admin
  .messaging()
  .send({
    token:
      "dQE4mTMsJH1Xa3ROK-whlE:APA91bFwyhr92ZUqz3PebD21neXlKSg93X5IvL6EOq6UZ9Apz-wDsvA07ZK1ENeoIz58bdjgn8kAIBa71QaQIhPeClbv0UngcrEnSqfeuNDWKduUW9jIuQA",
    notification: {
      title: "Test Push",
      body: "Firebase is working",
    },
  })
  .then(() => console.log("Push sent"))
  .catch(console.error);
