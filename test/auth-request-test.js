"use strict";

const cds = require("@sap/cds");
const supertest = require("supertest");
const fs = require("fs");

const env = require("./_env");
const util = require("./_env/util");

let request;

const options = {
  passport: {
    strategy: "mock",
    users: {
      alice: {
        password: "alice",
        ID: "alice@wonder.land",
        roles: ["XYZ4711"],
      },
      bob: {
        password: "bob",
        ID: "bob@builder.com",
        roles: [],
      },
    },
  },
};

describe("auth-request", () => {
  beforeAll(async () => {
    const context = await env("authmodel", 0, undefined, options);
    request = supertest(context.app);
  });

  afterAll(async () => {
    await env.end();
  });

  it("GET $metadata auth", async () => {
    const cds3 = cds.version.startsWith("3.");
    let response = await util.callRead(request, "/v2/auth/$metadata", {
      accept: "application/xml",
    });
    if (cds3) {
      expect(response.status).toEqual(401);
      expect(response.headers["www-authenticate"]).toEqual('Basic realm="Users"');
    } else {
      expect(response.status).toEqual(200);
    }

    let authorization = `Basic ${Buffer.from(
      `${options.passport.users.bob.ID}:${options.passport.users.bob.password}`
    ).toString("base64")}`;
    response = await util.callRead(request, "/v2/auth/$metadata", {
      accept: "application/xml",
      Authorization: authorization,
    });
    expect(response.status).toEqual(cds3 ? 403 : 200);

    authorization = `Basic ${Buffer.from(
      `${options.passport.users.alice.ID}:${options.passport.users.alice.password}`
    ).toString("base64")}`;
    response = await util.callRead(request, "/v2/auth/$metadata", {
      accept: "application/xml",
      Authorization: authorization,
    });
    expect(response.status).toEqual(200);
  });
});
