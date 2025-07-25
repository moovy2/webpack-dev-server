"use strict";

const webpack = require("webpack");
const Server = require("../../lib/Server");
const config = require("../fixtures/client-config/webpack.config");
const runBrowser = require("../helpers/run-browser");
const { port } = require("../ports-map");

describe("port", () => {
  const ports = [
    "<not-specified>",

    undefined,
    "auto",
    port,
    `${port}`,
    0,
    "-1",
    "99999",
  ];

  for (const testedPort of ports) {
    it(`should work using "${testedPort}" port `, async () => {
      const compiler = webpack(config);
      const devServerOptions = {};

      let usedPort;

      if (
        testedPort === "<not-specified>" ||
        typeof testedPort === "undefined"
      ) {
        process.env.WEBPACK_DEV_SERVER_BASE_PORT = port;
        usedPort = port;
      } else if (testedPort === "auto") {
        process.env.WEBPACK_DEV_SERVER_BASE_PORT = port;
        devServerOptions.port = testedPort;
        usedPort = port;
      } else {
        devServerOptions.port = testedPort;
        usedPort = testedPort;
      }

      const server = new Server(devServerOptions, compiler);

      let errored;

      try {
        await server.start();
      } catch (error) {
        errored = error;
      }

      if (testedPort === "-1" || testedPort === "99999") {
        const errorMessageRegExp = /options.port should be >= 0 and < 65536/;

        try {
          expect(errored.message).toMatch(errorMessageRegExp);
        } finally {
          await server.stop();
        }

        return;
      }

      const address = server.server.address();

      if (testedPort === 0) {
        expect(typeof address.port).toBe("number");
      } else {
        expect(address.port).toBe(Number(usedPort));
      }

      const { page, browser } = await runBrowser();

      try {
        const pageErrors = [];
        const consoleMessages = [];

        page
          .on("console", (message) => {
            consoleMessages.push(message);
          })
          .on("pageerror", (error) => {
            pageErrors.push(error);
          });

        await page.goto(`http://localhost:${address.port}/`, {
          waitUntil: "networkidle0",
        });

        expect(
          consoleMessages.map((message) => message.text()),
        ).toMatchSnapshot("console messages");
        expect(pageErrors).toMatchSnapshot("page errors");
      } finally {
        await browser.close();
        await server.stop();
      }

      if (
        testedPort === "<not-specified>" ||
        typeof testedPort === "undefined"
      ) {
        delete process.env.WEBPACK_DEV_SERVER_BASE_PORT;
      }
    });
  }
});
