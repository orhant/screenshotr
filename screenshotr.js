"use strict";

const sharp = require("sharp");
const browser = require("./browser");

var default_parameters = {
  url: "",
  vp_width: 1024,
  vp_height: 768,
  o_width: null,
  o_height: null,
  o_format: "png",
  dom_element_selector: "",
  fullpage: false,
  delay: 0,
  vp_deviceScaleFactor: 4,
};

/**
 * Read parameters passed in the request and merge them with the default values
 */
function readParameters(req) {
  var request_parameters = {};

  if (req.query.url && "" != req.query.url) {
    request_parameters.url = req.query.url;
  }

  if (req.query.o_format && "png" == req.query.o_format) {
    request_parameters.o_format = "png";
  }

  if (req.query.o_format && "jpg" == req.query.o_format) {
    request_parameters.o_format = "jpeg";
  }

  if (req.query.o_width && !isNaN(parseInt(req.query.o_width))) {
    request_parameters.o_width = parseInt(req.query.o_width);
  }

  if (req.query.o_height && !isNaN(parseInt(req.query.o_height))) {
    request_parameters.o_height = parseInt(req.query.o_height);
  }

  if (req.query.fullpage && 1 == parseInt(req.query.fullpage)) {
    request_parameters.fullpage = true;
  }

  if (req.query.vp_width && !isNaN(parseInt(req.query.vp_width))) {
    request_parameters.vp_width = parseInt(req.query.vp_width);
  }

  if (req.query.vp_height && !isNaN(parseInt(req.query.vp_height))) {
    request_parameters.vp_height = parseInt(req.query.vp_height);
  }

  if (req.query.dom_element_selector && "" != req.query.dom_element_selector) {
    request_parameters.dom_element_selector = req.query.dom_element_selector;
  }

  if (req.query.delay && parseInt(req.query.delay) > 0) {
    request_parameters.delay = parseInt(req.query.delay);
  }
  if (
    req.query.vp_deviceScaleFactor &&
    parseInt(req.query.vp_deviceScaleFactor) > 0
  ) {
    request_parameters.vp_deviceScaleFactor = parseInt(
      req.query.vp_deviceScaleFactor
    );
  }

  return Object.assign({}, default_parameters, request_parameters);
}

async function makeScreenshot(params, page) {
  await page.setViewport({
    width: params.vp_width,
    height: params.vp_height,
    deviceScaleFactor: vp_deviceScaleFactor,
  });

  await page.goto(params.url, { waitUntil: "networkidle2" });
  if (params.delay > 0) {
    await page.waitFor(params.delay);
  }

  var elt;
  if ("" != params.dom_element_selector) {
    elt = await page.$(params.dom_element_selector);

    if (!elt) {
      elt = page;
    }
  } else {
    elt = page;
  }

  return elt.screenshot({
    fullPage: params.fullpage,
  });
}

async function outputScreenshot(params, img, response) {
  var sharp_img = sharp(img);

  if (params.o_width || params.o_height) {
    sharp_img = await sharp_img.resize(params.o_width, params.o_height);
  }

  response.set("Content-Type", "image/" + params.o_format);
  return response.send(await sharp_img.toFormat(params.o_format).toBuffer());
}

async function takeScreenshot(request, response) {
  var params = readParameters(request);
  var page = await browser();
  var img = await makeScreenshot(params, page);
  await page.close();

  return outputScreenshot(params, img, response);
}

module.exports = takeScreenshot;
