"use strict";

const requireFromString = require("require-from-string");
const webpack = require("webpack");
const Server = require("../../lib/Server");
const simpleConfig = require("../fixtures/module-federation-config/webpack.config");
const multiConfig = require("../fixtures/module-federation-config/webpack.multi.config");
const objectEntryConfig = require("../fixtures/module-federation-config/webpack.object-entry.config");
const pluginConfig = require("../fixtures/module-federation-config/webpack.plugin");
const runBrowser = require("../helpers/run-browser");
const port = require("../ports-map")["module-federation"];

describe("Module federation", () => {
  describe("should work with simple multi-entry config", () => {
    let compiler;
    let server;
    let page;
    let browser;
    let pageErrors;
    let consoleMessages;

    beforeEach(async () => {
      compiler = webpack(simpleConfig);
      server = new Server({ port }, compiler);

      await server.start();

      ({ page, browser } = await runBrowser());

      pageErrors = [];
      consoleMessages = [];
    });

    afterEach(async () => {
      await browser.close();
      await server.stop();
    });

    it("should use the last entry export", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(`http://localhost:${port}/main.js`, {
        waitUntil: "networkidle0",
      });

      const textContent = await response.text();

      expect(textContent).toContain("entry1");

      let exports;

      expect(() => {
        exports = requireFromString(textContent);
      }).not.toThrow();

      expect(exports).toBe("entry2");

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });
  });

  describe("should work with object multi-entry config", () => {
    let compiler;
    let server;
    let page;
    let browser;
    let pageErrors;
    let consoleMessages;

    beforeEach(async () => {
      compiler = webpack(objectEntryConfig);
      server = new Server({ port }, compiler);

      await server.start();

      ({ page, browser } = await runBrowser());

      pageErrors = [];
      consoleMessages = [];
    });

    afterEach(async () => {
      await browser.close();
      await server.stop();
    });

    it("should use the last entry export", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(`http://localhost:${port}/main.js`, {
        waitUntil: "networkidle0",
      });

      const textContent = await response.text();

      expect(textContent).toContain("entry1");

      let exports;

      expect(() => {
        exports = requireFromString(textContent);
      }).not.toThrow();

      expect(exports).toBe("entry2");

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });

    it("should support the named entry export", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(`http://localhost:${port}/foo.js`, {
        waitUntil: "networkidle0",
      });

      const textContent = await response.text();

      expect(textContent).not.toContain("entry2");

      let exports;

      expect(() => {
        exports = requireFromString(textContent);
      }).not.toThrow();

      expect(exports).toBe("entry1");

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });
  });

  describe("should work with multi compiler config", () => {
    let compiler;
    let server;
    let page;
    let browser;
    let pageErrors;
    let consoleMessages;

    beforeEach(async () => {
      compiler = webpack(multiConfig);
      server = new Server({ port }, compiler);

      await server.start();

      ({ page, browser } = await runBrowser());

      pageErrors = [];
      consoleMessages = [];
    });

    afterEach(async () => {
      await browser.close();
      await server.stop();
    });

    it("should use the last entry export", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(`http://localhost:${port}/main.js`, {
        waitUntil: "networkidle0",
      });

      const textContent = await response.text();

      expect(textContent).toContain("entry1");

      let exports;

      expect(() => {
        exports = requireFromString(textContent);
      }).not.toThrow();

      expect(exports).toBe("entry2");

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });
  });

  describe("should use plugin", () => {
    let compiler;
    let server;
    let page;
    let browser;
    let pageErrors;
    let consoleMessages;

    beforeEach(async () => {
      compiler = webpack(pluginConfig);
      server = new Server({ port }, compiler);

      await server.start();

      ({ page, browser } = await runBrowser());

      pageErrors = [];
      consoleMessages = [];
    });

    afterEach(async () => {
      await browser.close();
      await server.stop();
    });

    it("should contain hot script in remoteEntry.js", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(
        `http://localhost:${port}/remoteEntry.js`,
        {
          waitUntil: "networkidle0",
        },
      );

      const remoteEntryTextContent = await response.text();

      expect(remoteEntryTextContent).toMatch(/webpack\/hot\/dev-server\.js/);

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });

    it("should contain hot script in main.js", async () => {
      page
        .on("console", (message) => {
          consoleMessages.push(message);
        })
        .on("pageerror", (error) => {
          pageErrors.push(error);
        });

      const response = await page.goto(`http://localhost:${port}/main.js`, {
        waitUntil: "networkidle0",
      });

      const mainEntryTextContent = await response.text();

      expect(mainEntryTextContent).toMatch(/webpack\/hot\/dev-server\.js/);

      expect(consoleMessages.map((message) => message.text())).toMatchSnapshot(
        "console messages",
      );

      expect(pageErrors).toMatchSnapshot("page errors");
    });
  });
});
