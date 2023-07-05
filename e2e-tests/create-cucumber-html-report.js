const report = require("multiple-cucumber-html-reporter");
report.generate({
  jsonDir: "cypress/reports/json_logs",
  reportPath: "./cypress/reports/cucumber_html_report",
  pageTitle: "Gradido webapp end-to-end test report",

  metadata: {
    app: {
      name: "Gradido webapp"
    },
    device: "Github worker",
    platform: {
      name: "ubuntu",
      version: "latest"
    }
  }
});